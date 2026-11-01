import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { AddToCart } from './AddToCart.component';
import { LOCAL_PRODUCTS } from '../../products/data/products.data';
import { salesStore } from '../state/sales.store';

afterEach(() => {
  cleanup();
  salesStore.getState().reset();
});

it('shows cart units and remaining stock and allows removing the last unit', () => {
  const product = { ...LOCAL_PRODUCTS[0], availableQuantity: 2 };
  render(<AddToCart product={product} />);
  const add = screen.getByRole('button', { name: `Agregar ${product.name} al carrito` });
  expect(screen.getByText('Para agregar: 2 unidades')).toBeVisible();
  fireEvent.click(add);
  expect(screen.getByText('En tu carrito: 1 unidad')).toBeVisible();
  expect(screen.getByText('Para agregar: 1 unidad')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: `Sumar ${product.name}` }));
  expect(screen.getByText('En tu carrito: 2 unidades')).toBeVisible();
  expect(add).toBeDisabled();
  expect(screen.getByRole('button', { name: `Sumar ${product.name}` })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: `Restar ${product.name}` }));
  fireEvent.click(screen.getByRole('button', { name: `Restar ${product.name}` }));
  expect(screen.getByText('En tu carrito: 0 unidades')).toBeVisible();
  expect(screen.getByText('Para agregar: 2 unidades')).toBeVisible();
  expect(salesStore.getState().cart).toEqual([]);
  expect(add).toBeEnabled();
});
