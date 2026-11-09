BEGIN;

CREATE SCHEMA IF NOT EXISTS orders;
SET LOCAL search_path TO orders;

CREATE TABLE carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid,
  guest_token_hash text UNIQUE CHECK (guest_token_hash ~ '^[0-9a-f]{64}$'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'abandoned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, customer_id),
  CHECK ((customer_id IS NULL) <> (guest_token_hash IS NULL))
);

CREATE UNIQUE INDEX carts_one_active_per_customer ON carts (customer_id)
  WHERE status = 'active' AND customer_id IS NOT NULL;

CREATE TABLE cart_items (
  cart_id uuid NOT NULL REFERENCES carts (id),
  product_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (cart_id, product_id)
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL UNIQUE REFERENCES carts (id),
  customer_id uuid,
  status text NOT NULL DEFAULT 'pending_confirmation' CHECK (status IN (
    'pending_confirmation', 'preparing', 'ready', 'in_transit', 'completed',
    'expired_without_pickup', 'cancelled'
  )),
  contact_name text NOT NULL,
  contact_email text NOT NULL CHECK (btrim(contact_email) <> ''),
  contact_phone text NOT NULL,
  subtotal_cents bigint NOT NULL CHECK (subtotal_cents >= 0),
  delivery_fee_cents bigint NOT NULL CHECK (delivery_fee_cents >= 0),
  total_cents bigint GENERATED ALWAYS AS (subtotal_cents + delivery_fee_cents) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (cart_id, customer_id) REFERENCES carts (id, customer_id)
);

CREATE INDEX orders_customer_created ON orders (customer_id, created_at DESC);

CREATE TABLE order_items (
  order_id uuid NOT NULL REFERENCES orders (id),
  product_id uuid NOT NULL,
  sku text NOT NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_cents bigint NOT NULL CHECK (unit_price_cents >= 0),
  PRIMARY KEY (order_id, product_id)
);

CREATE TABLE fulfillments (
  order_id uuid PRIMARY KEY REFERENCES orders (id),
  warehouse_id uuid NOT NULL,
  method text NOT NULL CHECK (method IN ('delivery', 'pickup')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'ready', 'in_transit', 'handed_over', 'expired', 'cancelled'
  )),
  district text,
  address text,
  address_reference text,
  pickup_notified_at timestamptz,
  expires_at timestamptz,
  handed_over_at timestamptz,
  UNIQUE (order_id, method),
  CHECK (method <> 'delivery' OR (
    district IS NOT NULL AND btrim(district) <> '' AND address IS NOT NULL AND btrim(address) <> ''
  )),
  CHECK (
    (pickup_notified_at IS NULL AND expires_at IS NULL)
    OR (method = 'pickup' AND pickup_notified_at IS NOT NULL
        AND expires_at IS NOT NULL AND expires_at > pickup_notified_at)
  ),
  CHECK ((status = 'handed_over') = (handed_over_at IS NOT NULL))
);

CREATE INDEX fulfillments_pickup_expiry ON fulfillments (expires_at) WHERE status = 'ready';

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  fulfillment_method text NOT NULL,
  method text NOT NULL CHECK (method IN ('card', 'cash')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  provider_reference text UNIQUE,
  collected_at timestamptz,
  collected_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (order_id, fulfillment_method) REFERENCES fulfillments (order_id, method),
  CHECK (method <> 'cash' OR fulfillment_method = 'pickup'),
  CHECK ((status = 'paid') = (collected_at IS NOT NULL)),
  CHECK ((collected_by IS NOT NULL) = (method = 'cash' AND status = 'paid')),
  CHECK (method <> 'card' OR status <> 'paid' OR provider_reference IS NOT NULL)
);

CREATE UNIQUE INDEX payments_one_open_or_paid_per_order ON payments (order_id)
  WHERE status IN ('pending', 'paid');

CREATE TABLE refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL UNIQUE REFERENCES payments (id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  reason text NOT NULL,
  provider_reference text UNIQUE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  CHECK ((status = 'confirmed') = (confirmed_at IS NOT NULL)),
  CHECK (status <> 'confirmed' OR provider_reference IS NOT NULL)
);

COMMIT;
