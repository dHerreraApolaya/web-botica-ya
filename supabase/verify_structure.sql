BEGIN;
SET LOCAL statement_timeout = '30s';

DO $verify$
DECLARE
  target text;
  schema_name text;
  table_name text;
BEGIN
  FOREACH target IN ARRAY ARRAY[
    'public.users', 'public.roles', 'public.user_roles', 'public.sessions',
    'public.consents', 'public.schema_migrations', 'orders.carts',
    'orders.cart_items', 'orders.orders', 'orders.order_items',
    'orders.fulfillments', 'orders.payments', 'orders.refunds'
  ]
  LOOP
    schema_name := split_part(target, '.', 1);
    table_name := split_part(target, '.', 2);
    IF to_regclass(target) IS NULL THEN
      RAISE EXCEPTION 'Missing table %', target;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
      WHERE conrelid = to_regclass(target) AND contype = 'p') THEN
      RAISE EXCEPTION 'Missing primary key on %', target;
    END IF;
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = to_regclass(target)) THEN
      RAISE EXCEPTION 'RLS disabled on %', target;
    END IF;
    IF has_table_privilege('anon', target, 'SELECT,INSERT,UPDATE,DELETE')
      OR has_table_privilege('authenticated', target, 'SELECT,INSERT,UPDATE,DELETE') THEN
      RAISE EXCEPTION 'Unexpected Data API privileges on %', target;
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM public.roles
    WHERE code IN ('customer', 'administrator', 'pharmacist')) <> 3 THEN
    RAISE EXCEPTION 'Missing initial application roles';
  END IF;
  IF has_table_privilege('boticaya_orders_backend', 'public.users', 'SELECT')
    OR has_table_privilege('boticaya_identity_backend', 'orders.orders', 'SELECT') THEN
    RAISE EXCEPTION 'Unexpected cross-service access';
  END IF;
END
$verify$;

SELECT n.nspname AS schema_name, c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND (
  (n.nspname = 'public' AND c.relname IN (
    'users', 'roles', 'user_roles', 'sessions', 'consents', 'schema_migrations'
  )) OR n.nspname = 'orders'
)
ORDER BY 1, 2;

SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace IN ('public'::regnamespace, 'orders'::regnamespace)
  AND conrelid IN (
    'public.users'::regclass, 'public.roles'::regclass, 'public.user_roles'::regclass,
    'public.sessions'::regclass, 'public.consents'::regclass,
    'public.schema_migrations'::regclass, 'orders.carts'::regclass,
    'orders.cart_items'::regclass, 'orders.orders'::regclass,
    'orders.order_items'::regclass, 'orders.fulfillments'::regclass,
    'orders.payments'::regclass, 'orders.refunds'::regclass
  )
ORDER BY conrelid::regclass::text, conname;

SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE (schemaname = 'public' AND tablename IN (
  'users', 'roles', 'user_roles', 'sessions', 'consents', 'schema_migrations'
)) OR schemaname = 'orders'
ORDER BY schemaname, tablename, indexname;

SELECT id, applied_at FROM public.schema_migrations ORDER BY id;
ROLLBACK;
