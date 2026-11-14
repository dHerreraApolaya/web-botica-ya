BEGIN;

DO $local_database$
BEGIN
    IF current_database() <> 'boticaya_dev'
       AND current_database() !~ '^boticaya_[a-z0-9_]+_test$' THEN
        RAISE EXCEPTION 'Use boticaya_dev or an isolated boticaya_*_test database';
    END IF;
    IF to_regclass('orders.orders') IS NOT NULL THEN
        RAISE EXCEPTION 'Existing separate order service detected; local permissions were not applied';
    END IF;
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO boticaya_orders_app', current_database());
END
$local_database$;

GRANT USAGE ON SCHEMA public TO boticaya_orders_app;
GRANT SELECT ON TABLE public.products TO boticaya_orders_app;
GRANT UPDATE (available_quantity) ON TABLE public.products TO boticaya_orders_app;
GRANT SELECT, INSERT ON TABLE public.orders, public.order_items TO boticaya_orders_app;

COMMIT;
