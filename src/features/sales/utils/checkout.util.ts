import { z } from 'zod';
import fixtures from '../data/checkout.mock.json';
import type {
  CartLine,
  Contact,
  Fulfillment,
  Order,
  OrderDraft,
  PrescriptionDocument,
  Pricing,
} from '../domain/Sales';

const fixtureSchema = z.object({
  deliveryFeeInCents: z.number().int().nonnegative(),
  districts: z.array(z.string()).min(1),
  pharmacies: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      address: z.string(),
      schedule: z.string(),
      available: z.boolean(),
    })
  ),
});
export const CHECKOUT_DATA = fixtureSchema.parse(fixtures);
const PHONE_PATTERN = /^\+?[\d -]{7,20}$/;
const NON_DIGITS_PATTERN = /\D/g;
export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Ingresa tu nombre completo.')
    .max(120, 'Usa como máximo 120 caracteres.'),
  email: z.string().trim().toLowerCase().pipe(z.email('Ingresa un correo válido.').max(254)),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => PHONE_PATTERN.test(value) && value.replace(NON_DIGITS_PATTERN, '').length >= 7,
      'Ingresa un teléfono válido (7 a 20 caracteres).'
    ),
});
const deliverySchema = z.object({
  type: z.literal('delivery'),
  district: z
    .string()
    .refine(
      (value) => CHECKOUT_DATA.districts.includes(value),
      'Selecciona un distrito con cobertura de prueba.'
    ),
  address: z.string().trim().min(5, 'Ingresa una dirección completa.').max(200),
  reference: z.string().trim().max(200),
});
const pickupSchema = z.object({
  type: z.literal('pickup'),
  pharmacyId: z
    .string()
    .refine(
      (id) => CHECKOUT_DATA.pharmacies.some((pharmacy) => pharmacy.id === id && pharmacy.available),
      'Selecciona una botica disponible.'
    ),
});
export const fulfillmentSchema = z.discriminatedUnion('type', [deliverySchema, pickupSchema]);
export const paymentMethodSchema = z.enum(['demo-card', 'demo-wallet']);
const FULFILLMENT_STRATEGIES = {
  delivery: { fee: (): number => CHECKOUT_DATA.deliveryFeeInCents },
  pickup: { fee: (): number => 0 },
};
const CURRENCY = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
export const formatPrice = (cents: number): string => CURRENCY.format(cents / 100);
export const formatCount = (count: number, singular: string, plural: string): string =>
  `${count} ${count === 1 ? singular : plural}`;
export const calculatePricing = (
  cart: readonly CartLine[],
  fulfillment: Fulfillment | null
): Pricing => {
  const subtotal = cart.reduce((sum, line) => sum + line.product.priceInCents * line.quantity, 0);
  const delivery = cart.length && fulfillment ? FULFILLMENT_STRATEGIES[fulfillment.type].fee() : 0;
  return { subtotal, delivery, total: subtotal + delivery };
};
export const prescriptionSignature = (cart: readonly CartLine[]): string =>
  cart
    .filter((line) => line.product.requiresPrescription)
    .map((line) => `${line.product.id}:${line.quantity}`)
    .sort()
    .join('|');
export const validQuantity = (quantity: number, maximum: number): boolean =>
  Number.isInteger(quantity) && quantity >= 1 && quantity <= maximum;
export const validContact = (contact: Contact | null): boolean =>
  contactSchema.safeParse(contact).success;
export const validFulfillment = (fulfillment: Fulfillment | null): boolean =>
  fulfillmentSchema.safeParse(fulfillment).success;
export const validatePrescriptionDocument = (document: PrescriptionDocument): string | null => {
  const extensions: Record<string, readonly string[]> = {
    'application/pdf': ['pdf'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
  };
  const extension = document.name.split('.').slice(-1).join('').toLowerCase();
  if (!extensions[document.type]?.includes(extension))
    return 'Usa un archivo de prueba PDF, JPG o PNG.';
  if (document.size <= 0 || document.size > 5 * 1024 * 1024)
    return 'El archivo debe tener contenido y pesar como máximo 5 MB.';
  return null;
};
export const createOrderSnapshot = (draft: OrderDraft, id: string): Order =>
  Object.freeze({
    ...draft,
    id,
    items: Object.freeze(
      draft.items.map((line) =>
        Object.freeze({ product: Object.freeze({ ...line.product }), quantity: line.quantity })
      )
    ),
    contact: Object.freeze({ ...draft.contact }),
    fulfillment: Object.freeze({ ...draft.fulfillment }),
    pricing: Object.freeze({ ...draft.pricing }),
    prescription: Object.freeze({
      ...draft.prescription,
      ...(draft.prescription.document
        ? { document: Object.freeze({ ...draft.prescription.document }) }
        : {}),
    }),
  });
