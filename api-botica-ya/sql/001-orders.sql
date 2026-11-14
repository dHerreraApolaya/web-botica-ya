BEGIN;

DO $compatibility$
BEGIN
    IF to_regclass('orders.orders') IS NOT NULL THEN
        RAISE EXCEPTION 'Existing orders.orders detected; reconcile the order service contract before applying the Express candidate schema';
    END IF;
END
$compatibility$;

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY,
    idempotency_key UUID NOT NULL UNIQUE,
    request_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status = 'pending'),
    contact JSONB NOT NULL,
    fulfillment JSONB NOT NULL,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.order_items (
    order_id UUID NOT NULL REFERENCES public.orders(id),
    product_id TEXT NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_in_cents INTEGER NOT NULL CHECK (unit_price_in_cents >= 0),
    PRIMARY KEY (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON public.order_items(product_id);

COMMIT;
