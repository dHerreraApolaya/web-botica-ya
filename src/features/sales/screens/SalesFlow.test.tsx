import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CartScreen from './Cart.screen';
import CheckoutScreen from './Checkout.screen';
import ConfirmationScreen from './Confirmation.screen';
import { LandingScreen } from '../../landing/screens/Landing.screen';
import { Header } from '@/components/ui/organisms/Header.component';
import { salesStore } from '../state/sales.store';
import { LOCAL_PRODUCTS } from '../../products/data/products.data';
import { createCheckoutFacade } from '../application/checkout.facade';
import { createMockCheckoutAdapters } from '../data/mockCheckout.adapter';
import { CHECKOUT_DATA, calculatePricing } from '../utils/checkout.util';

const renderFlow = (
  path = '/',
  options: Parameters<typeof createMockCheckoutAdapters>[0] = { delayMs: 0 }
) => {
  const adapters = createMockCheckoutAdapters(options);
  const facade = createCheckoutFacade(salesStore, adapters);
  render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
      <Routes>
        <Route path="/" element={<LandingScreen />} />
        <Route path="/carrito" element={<CartScreen />} />
        <Route path="/checkout/:step?" element={<CheckoutScreen facade={facade} />} />
        <Route path="/confirmacion" element={<ConfirmationScreen />} />
      </Routes>
    </MemoryRouter>
  );
  return { adapters, facade };
};
const fill = (label: string, value: string): void => {
  fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
};
const submit = async (name: string): Promise<void> => {
  await act(async () => {
    fireEvent.submit(screen.getByRole('form', { name }));
  });
};
const add = (index: number): void => {
  salesStore.getState().addProduct(LOCAL_PRODUCTS[index]);
};
const choosePickup = async (): Promise<void> => {
  fireEvent.click(screen.getByLabelText('Recojo en botica · gratis'));
  fireEvent.click(screen.getByLabelText(/Botica Demo Centro/));
  await submit('Entrega o recojo');
};
const contactAndPay = async (): Promise<void> => {
  fill('Nombre completo', 'Ana María Demo');
  fill('Correo electrónico', 'ANA@example.test');
  fill('Teléfono', '999111222');
  fireEvent.click(screen.getByLabelText('Tarjeta de prueba · terminación 4242'));
  await submit('Contacto y pago');
};
afterEach(() => {
  cleanup();
  salesStore.setState({ paymentStatus: 'idle' });
  salesStore.getState().reset();
  vi.useRealTimers();
});

describe('complete checkout prototype', () => {
  it('starts with catalog search, adds a product, changes quantities, and reaches a confirmed pickup order', async () => {
    renderFlow();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'BY-0001' } });
    fireEvent.submit(screen.getByRole('search'));
    fireEvent.click(
      screen.getByRole('button', { name: `Agregar ${LOCAL_PRODUCTS[0].name} al carrito` })
    );
    expect(salesStore.getState().cart).toHaveLength(1);
    fireEvent.click(screen.getByRole('link', { name: 'Carrito de compras' }));
    fireEvent.click(screen.getByRole('button', { name: `Sumar ${LOCAL_PRODUCTS[0].name}` }));
    expect(salesStore.getState().cart[0].quantity).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: `Restar ${LOCAL_PRODUCTS[0].name}` }));
    fireEvent.click(screen.getByRole('link', { name: 'Continuar compra' }));
    expect(screen.getByRole('heading', { name: 'Entrega o recojo' })).toHaveFocus();
    await choosePickup();
    await contactAndPay();
    expect(screen.getByRole('heading', { name: 'Revisa tu compra' })).toBeInTheDocument();
    expect(screen.getByText('ana@example.test')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar compra de prueba' }));
    expect(
      await screen.findByRole('heading', { name: '¡Compra de prueba confirmada!' })
    ).toBeInTheDocument();
    expect(screen.getByText('Pedido DEMO-000001')).toBeInTheDocument();
    expect(salesStore.getState().cart).toHaveLength(0);
    fireEvent.click(screen.getByRole('link', { name: 'Volver a la tienda' }));
    expect(screen.getByRole('heading', { name: 'Productos destacados' })).toBeInTheDocument();
  });

  it('handles cart removal, direct empty checkout and missing confirmation', () => {
    add(0);
    renderFlow('/carrito');
    fireEvent.click(screen.getByRole('button', { name: `Eliminar ${LOCAL_PRODUCTS[0].name}` }));
    expect(screen.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Buscar productos' }));
    expect(screen.getByRole('heading', { name: 'Productos destacados' })).toBeInTheDocument();
  });

  it.each(['/checkout/review', '/confirmacion'])('guards empty direct entry at %s', (path) => {
    renderFlow(path);
    expect(screen.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeInTheDocument();
  });

  it('requires a synthetic prescription and allows replacing a rejected file', async () => {
    add(6);
    const { adapters } = renderFlow('/checkout/review', { delayMs: 0, prescription: 'rejected' });
    expect(screen.getByRole('heading', { name: 'Receta médica de prueba' })).toBeInTheDocument();
    const fileInput = screen.getByLabelText(/Seleccionar archivo ficticio/);
    fireEvent.change(fileInput, {
      target: { files: [new File(['bad'], 'test.txt', { type: 'text/plain' })] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Usa un archivo de prueba');
    fireEvent.change(fileInput, { target: { files: [] } });
    fireEvent.click(screen.getByRole('button', { name: 'Usar receta de ejemplo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('rechazada');
    adapters.prescription.review = vi.fn().mockResolvedValue('error');
    fireEvent.click(screen.getByRole('button', { name: 'Usar receta de ejemplo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo revisar');
    adapters.prescription.review = vi.fn().mockResolvedValue('approved');
    fireEvent.change(fileInput, {
      target: { files: [new File(['synthetic'], 'demo.png', { type: 'image/png' })] },
    });
    expect(await screen.findByText('Receta aprobada en la simulación.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Continuar con la entrega' }));
    await choosePickup();
    await contactAndPay();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar compra de prueba' }));
    expect(
      await screen.findByRole('heading', { name: '¡Compra de prueba confirmada!' })
    ).toBeInTheDocument();
    expect(screen.getByText('Receta aprobada en la simulación.')).toBeInTheDocument();
  });

  it('validates delivery fields, switches fulfillment, and reviews contact errors', async () => {
    add(0);
    renderFlow('/checkout/review');
    await submit('Entrega o recojo');
    expect(screen.getByText('Selecciona un distrito con cobertura de prueba.')).toBeInTheDocument();
    expect(screen.getByLabelText('Dirección de prueba')).toHaveAttribute('aria-invalid', 'true');
    fireEvent.click(screen.getByLabelText('Recojo en botica · gratis'));
    await submit('Entrega o recojo');
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona una botica');
    expect(screen.getByLabelText(/Botica Demo Sur/)).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Envío a domicilio/));
    expect(
      calculatePricing(salesStore.getState().cart, salesStore.getState().fulfillment).delivery
    ).toBe(800);
    fill('Distrito de prueba', CHECKOUT_DATA.districts[0]);
    fill('Dirección de prueba', 'Calle Ficticia 123');
    fill('Referencia (opcional)', 'Puerta de ejemplo');
    await submit('Entrega o recojo');
    expect(salesStore.getState().fulfillment?.type).toBe('delivery');
    await submit('Contacto y pago');
    expect(screen.getByLabelText('Nombre completo')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona un medio de pago');
    fill('Nombre completo', 'Ana');
    fill('Correo electrónico', 'ana@example.test');
    fill('Teléfono', '999111222');
    fireEvent.click(screen.getByLabelText('Billetera digital de prueba'));
    await submit('Contacto y pago');
    expect(screen.getByText('Calle Ficticia 123')).toBeInTheDocument();
    expect(screen.getByText('Referencia: Puerta de ejemplo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Editar entrega' }));
    expect(screen.getByLabelText('Dirección de prueba')).toHaveValue('Calle Ficticia 123');
    await choosePickup();
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Ana');
    await submit('Contacto y pago');
    fireEvent.click(screen.getByRole('link', { name: 'Editar contacto o pago' }));
    await submit('Contacto y pago');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar compra de prueba' }));
    expect(
      await screen.findByRole('heading', { name: '¡Compra de prueba confirmada!' })
    ).toBeInTheDocument();
  });

  it.each(['declined', 'error'] as const)(
    'shows %s feedback and preserves cart for a retry',
    async (payment) => {
      add(0);
      renderFlow('/checkout/fulfillment', { delayMs: 0, payment });
      await choosePickup();
      await contactAndPay();
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar compra de prueba' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        payment === 'declined' ? 'rechazado' : 'no está disponible'
      );
      expect(salesStore.getState().cart).toHaveLength(1);
      expect(screen.getByRole('button', { name: 'Confirmar compra de prueba' })).toBeEnabled();
    }
  );

  it('disables review editing and cart mutations during delayed payment', async () => {
    vi.useFakeTimers();
    add(0);
    renderFlow('/checkout/fulfillment', { delayMs: 1000 });
    await choosePickup();
    await contactAndPay();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar compra de prueba' }));
    expect(screen.getByRole('button', { name: 'Procesando…' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Editar productos' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Carrito de compras' }));
    expect(screen.getByRole('button', { name: `Sumar ${LOCAL_PRODUCTS[0].name}` })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Pago de prueba en proceso');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(
      screen.getByRole('heading', { name: '¡Compra de prueba confirmada!' })
    ).toBeInTheDocument();
  });

  it('limits repeated catalog additions and disables unavailable products', () => {
    renderFlow();
    const button = screen.getByRole('button', {
      name: `Agregar ${LOCAL_PRODUCTS[0].name} al carrito`,
    });
    for (let unit = 0; unit < LOCAL_PRODUCTS[0].availableQuantity; unit += 1)
      fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Límite de stock');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'BY-0011' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(within(screen.getByRole('article')).getByRole('button')).toBeDisabled();
  });
});
