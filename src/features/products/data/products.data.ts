import { PRODUCT_CATEGORIES, type Product } from '../domain/Product';

const PRODUCT_NAMES: readonly (readonly string[])[] = [
  [
    'Paracetamol 500 mg',
    'Ibuprofeno 400 mg',
    'Loratadina 10 mg',
    'Cetirizina 10 mg',
    'Solución salina 0,9%',
  ],
  ['Vitamina C 500 mg', 'Vitamina D3 1000 UI', 'Complejo B', 'Magnesio 250 mg', 'Multivitamínico'],
  [
    'Protector solar FPS 50',
    'Crema hidratante',
    'Limpiador facial',
    'Bálsamo labial',
    'Gel de aloe vera',
  ],
  [
    'Pañales talla M',
    'Toallitas húmedas',
    'Champú para bebé',
    'Crema para pañal',
    'Jabón para bebé',
  ],
  ['Gasas estériles', 'Venda elástica', 'Apósitos adhesivos', 'Alcohol 70%', 'Cinta médica'],
  ['Sales de rehidratación', 'Fibra soluble', 'Probióticos', 'Simeticona 80 mg', 'Antiácido'],
];

const BRANDS: readonly string[] = ['Vitaluna', 'Sanaluz', 'Bienvía', 'Cuidalia', 'Novavida'];
const PACK_SIZES: readonly number[] = [1, 2, 3, 5];

export const LOCAL_PRODUCTS: readonly Product[] = Object.freeze(
  Array.from({ length: 500 }, (_, index): Product => {
    const baseIndex = index % 30;
    const variantIndex = Math.floor(index / 30);
    const categoryIndex = baseIndex % PRODUCT_CATEGORIES.length;
    const nameIndex = Math.floor(baseIndex / PRODUCT_CATEGORIES.length);
    const id = String(index + 1).padStart(4, '0');
    const packSize = PACK_SIZES[Math.floor(variantIndex / BRANDS.length)];

    return Object.freeze({
      id: `product-${id}`,
      sku: `BY-${id}`,
      name: `${PRODUCT_NAMES[categoryIndex][nameIndex]} ${BRANDS[variantIndex % BRANDS.length]}`,
      category: PRODUCT_CATEGORIES[categoryIndex],
      brand: BRANDS[variantIndex % BRANDS.length],
      presentation: `Paquete de ${packSize} ${packSize === 1 ? 'unidad' : 'unidades'}`,
      priceInCents: 450 + ((index * 137) % 14500),
      inStock: (index + 1) % 11 !== 0,
      availableQuantity: (index + 1) % 11 === 0 ? 0 : 5 + (index % 6),
      requiresPrescription: categoryIndex === 0 && nameIndex === 1,
      isFeatured: index < 12,
    });
  })
);
