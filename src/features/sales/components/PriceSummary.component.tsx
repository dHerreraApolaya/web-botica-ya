import type { FC } from 'react';
import type { Pricing } from '../domain/Sales';
import { formatPrice } from '../utils/checkout.util';

interface PriceSummaryProps {
  pricing: Pricing;
  fulfillmentChosen: boolean;
}
export const PriceSummary: FC<PriceSummaryProps> = ({ pricing, fulfillmentChosen }) => (
  <dl className="space-y-3 text-sm text-text-muted">
    <div className="flex justify-between gap-3">
      <dt>Subtotal</dt>
      <dd>{formatPrice(pricing.subtotal)}</dd>
    </div>
    <div className="flex justify-between gap-3">
      <dt>Entrega / recojo</dt>
      <dd>{fulfillmentChosen ? formatPrice(pricing.delivery) : 'Por elegir'}</dd>
    </div>
    <div className="flex justify-between gap-3 border-t border-border pt-4 text-lg font-bold text-text-main">
      <dt>Total</dt>
      <dd>{formatPrice(pricing.total)}</dd>
    </div>
  </dl>
);
