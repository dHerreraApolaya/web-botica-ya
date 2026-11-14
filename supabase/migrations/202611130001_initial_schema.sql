BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
SELECT pg_advisory_xact_lock(hashtext('boticaya_initial_schema'));
SET LOCAL search_path TO public;


      CREATE TABLE schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE users (
        id UUID PRIMARY KEY,
        full_name VARCHAR(300) NOT NULL,
        document_type VARCHAR(20),
        document_number VARCHAR(30),
        email VARCHAR(254) NOT NULL UNIQUE CHECK (email = LOWER(email)),
        phone VARCHAR(20),
        password_hash TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'deleted')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        CHECK ((document_type IS NULL) = (document_number IS NULL)),
        CHECK (document_type IS NULL OR document_type IN ('dni', 'foreign_id', 'passport'))
      );

      CREATE UNIQUE INDEX users_document_unique
        ON users (document_type, document_number)
        WHERE document_type IS NOT NULL;

      CREATE TABLE roles (
        id UUID PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(300) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE user_roles (
        user_id UUID NOT NULL REFERENCES users(id),
        role_id UUID NOT NULL REFERENCES roles(id),
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        assigned_by UUID REFERENCES users(id),
        PRIMARY KEY (user_id, role_id)
      );

      CREATE TABLE consents (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        type VARCHAR(50) NOT NULL CHECK (type IN ('health_data_processing')),
        policy_version VARCHAR(50) NOT NULL,
        accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        revoked_at TIMESTAMPTZ,
        UNIQUE (user_id, type, policy_version)
      );

      CREATE TABLE sessions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        token_hash CHAR(64) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        user_agent_hash CHAR(64),
        ip_hash CHAR(64)
      );

      CREATE INDEX sessions_user_id_index ON sessions (user_id);
      CREATE INDEX sessions_active_index ON sessions (id, expires_at) WHERE revoked_at IS NULL;

      INSERT INTO roles (id, code, name, description)
      VALUES
        ('00000000-0000-0000-0000-000000000001', 'customer', 'Cliente', 'Compra productos y administra su perfil.'),
        ('00000000-0000-0000-0000-000000000002', 'administrator', 'Administrador', 'Administra usuarios y la operación de la botica.'),
        ('00000000-0000-0000-0000-000000000003', 'pharmacist', 'Químico farmacéutico', 'Revisa recetas y dispensa productos regulados.')
      ON CONFLICT (code) DO NOTHING;

INSERT INTO public.schema_migrations (id) VALUES ('001_identity_schema');



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


SET LOCAL search_path TO public;
CREATE INDEX user_roles_role_id_idx ON public.user_roles (role_id);
CREATE INDEX user_roles_assigned_by_idx ON public.user_roles (assigned_by);
CREATE INDEX orders_customer_id_idx ON orders.orders (customer_id);
CREATE INDEX cart_items_product_id_idx ON orders.cart_items (product_id);
CREATE INDEX order_items_product_id_idx ON orders.order_items (product_id);
CREATE INDEX payments_collected_by_idx ON orders.payments (collected_by);

CREATE ROLE boticaya_identity_backend NOLOGIN;
CREATE ROLE boticaya_orders_backend NOLOGIN;
GRANT USAGE ON SCHEMA public TO boticaya_identity_backend;
GRANT USAGE ON SCHEMA orders TO boticaya_orders_backend;
GRANT SELECT ON public.roles TO boticaya_identity_backend;
GRANT SELECT, INSERT, UPDATE ON public.users, public.sessions, public.consents, public.user_roles
  TO boticaya_identity_backend;
GRANT SELECT, INSERT, UPDATE ON orders.carts, orders.orders, orders.order_items,
  orders.fulfillments, orders.payments TO boticaya_orders_backend;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders.cart_items TO boticaya_orders_backend;

DO $security$
DECLARE
  target record;
  backend_role text;
BEGIN
  FOR target IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r' AND (
      (n.nspname = 'public' AND c.relname IN (
        'users', 'roles', 'user_roles', 'sessions', 'consents', 'schema_migrations'
      )) OR (n.nspname = 'orders' AND c.relname IN (
        'carts', 'cart_items', 'orders', 'order_items', 'fulfillments', 'payments', 'refunds'
      ))
    )
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
      target.schema_name, target.table_name);
    EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC, anon, authenticated, service_role',
      target.schema_name, target.table_name);
    IF target.table_name <> 'schema_migrations' THEN
      backend_role := CASE WHEN target.schema_name = 'public'
        THEN 'boticaya_identity_backend' ELSE 'boticaya_orders_backend' END;
      EXECUTE format(
        'CREATE POLICY backend_access ON %I.%I TO %I USING (true) WITH CHECK (true)',
        target.schema_name, target.table_name, backend_role
      );
    END IF;
  END LOOP;
END
$security$;

INSERT INTO public.schema_migrations (id) VALUES ('002_orders_schema'), ('003_supabase_access');
COMMIT;
