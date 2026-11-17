import express, { type ErrorRequestHandler } from 'express';
import type { Pool } from 'pg';
import { getInventory, getProducts } from './products/product.repository.js';
import { idempotencyKeySchema, orderSchema } from './orders/order.schema.js';
import { OrderConflict, receiveOrder } from './orders/order.repository.js';

export function createApp(pool: Pool, options: { ordersEnabled?: boolean } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/products', async (_request, response) => {
    response.json(await getProducts(pool));
  });
  app.get('/api/inventory', async (_request, response) => {
    response.json(await getInventory(pool));
  });
  if (options.ordersEnabled) {
    app.post('/api/orders', async (request, response) => {
      const order = orderSchema.safeParse(request.body);
      const key = idempotencyKeySchema.safeParse(request.get('Idempotency-Key'));
      if (!order.success || !key.success) {
        response.status(400).json({
          error: 'invalid_order',
          message: 'Revisa los datos del pedido y su clave de idempotencia.',
        });
        return;
      }
      const result = await receiveOrder(pool, order.data, key.data);
      response.status(result.replayed ? 200 : 201).json(result.order);
    });
  }

  app.use((_request, response) => {
    response.status(404).json({ error: 'not_found', message: 'Ruta no encontrada.' });
  });
  const handleError: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
    if (error instanceof OrderConflict) {
      response.status(409).json({
        error: error.code,
        message: 'No se pudo recibir el pedido. Revisa el stock o la clave de idempotencia.',
      });
      return;
    }
    const status =
      typeof error === 'object' && error !== null && 'status' in error ? error.status : null;
    if (status === 400 || status === 413 || status === 415) {
      response
        .status(status)
        .json({ error: 'invalid_body', message: 'El cuerpo de la solicitud no es válido.' });
      return;
    }
    console.error('API database operation failed');
    response
      .status(503)
      .json({ error: 'service_unavailable', message: 'Servicio temporalmente no disponible.' });
  };
  app.use(handleError);
  return app;
}
