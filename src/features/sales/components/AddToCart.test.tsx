import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { playFeedback } from '@/utils/feedback.util';
import { AddToCart } from './AddToCart.component';
import { LOCAL_PRODUCTS } from '../../products/data/products.data';
import { salesStore } from '../state/sales.store';

vi.mock('@/utils/feedback.util', () => ({ playFeedback: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
  cleanup();
  salesStore.getState().reset();
});

it('selects units before adding and permits further additions only within remaining stock', () => {
  const product = { ...LOCAL_PRODUCTS[0], availableQuantity: 3 };
  render(<AddToCart product={product} />);
  const add = screen.getByRole('button', { name: `Agregar ${product.name} al carrito` });
  const increase = screen.getByRole('button', { name: `Sumar ${product.name}` });
  const decrease = screen.getByRole('button', { name: `Restar ${product.name}` });
  expect(decrease).toBeDisabled();
  fireEvent.click(increase);
  fireEvent.click(increase);
  expect(increase).toBeDisabled();
  expect(salesStore.getState().cart).toEqual([]);
  expect(playFeedback).not.toHaveBeenCalled();
  expect(screen.getByText('En tu carrito: 0 unidades')).toBeVisible();
  fireEvent.click(decrease);
  fireEvent.click(add);
  expect(salesStore.getState().cart[0].quantity).toBe(2);
  expect(screen.getByText('En tu carrito: 2 unidades')).toBeVisible();
  expect(screen.getByText('Para agregar: 1 unidad')).toBeVisible();
  expect(increase).toBeDisabled();
  fireEvent.click(add);
  expect(salesStore.getState().cart[0].quantity).toBe(3);
  expect(add).toBeDisabled();
  expect(playFeedback).toHaveBeenCalledTimes(2);
  fireEvent.click(add);
  expect(playFeedback).toHaveBeenCalledTimes(2);
  expect(increase).toBeDisabled();
});
