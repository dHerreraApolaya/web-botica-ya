CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT NOT NULL,
    presentation TEXT NOT NULL,
    price_in_cents INTEGER NOT NULL CHECK (price_in_cents >= 0),
    available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0),
    requires_prescription BOOLEAN NOT NULL,
    is_featured BOOLEAN NOT NULL
);

INSERT INTO public.products (
    id, sku, name, category, brand, presentation,
    price_in_cents, available_quantity, requires_prescription, is_featured
)
VALUES (
    'product-0001', 'BY-0001', 'Paracetamol 500 mg Vitaluna',
    'Medicamentos', 'Vitaluna', 'Paquete de 1 unidad',
    450, 5, FALSE, TRUE
)
ON CONFLICT (id) DO NOTHING;
