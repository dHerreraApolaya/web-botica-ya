import { useState, type FC } from 'react';
import { Link } from 'react-router-dom';
import type { CheckoutFacade } from '../application/checkout.facade';
import type { PrescriptionDocument } from '../domain/Sales';
import { useSalesStore } from '../state/sales.store';
import { formatCount } from '../utils/checkout.util';

export const PrescriptionStep: FC<{ facade: CheckoutFacade }> = ({ facade }) => {
  const cart = useSalesStore((state) => state.cart);
  const review = useSalesStore((state) => state.prescription);
  const [error, setError] = useState<string | null>(null);
  const submit = async (document: PrescriptionDocument): Promise<void> => {
    setError(await facade.reviewPrescription(document));
  };
  return (
    <div className="space-y-5">
      <p className="text-text-muted">
        Estos productos requieren una receta de prueba. La revisión es simulada y no representa
        validación médica.
      </p>
      <ul className="list-inside list-disc text-sm">
        {cart
          .filter((line) => line.product.requiresPrescription)
          .map((line) => (
            <li key={line.product.id}>
              {line.product.name} · {formatCount(line.quantity, 'unidad', 'unidades')}
            </li>
          ))}
      </ul>
      <div className="rounded-lg bg-primary-surface p-5 text-sm text-primary-surface-text">
        Usa el ejemplo sintético o selecciona un archivo ficticio. No uses documentos médicos
        reales. Solo se toma el nombre, formato y tamaño; no se lee ni se envía su contenido.
      </div>
      <button
        type="button"
        disabled={review.status === 'pending'}
        onClick={() =>
          void submit({ name: 'receta-sintetica.pdf', type: 'application/pdf', size: 1024 })
        }
        className="min-h-11 rounded-md border border-border px-4 py-3 font-semibold disabled:opacity-50"
      >
        Usar receta de ejemplo
      </button>
      <div>
        <label htmlFor="prescription-file" className="mb-2 block text-sm font-semibold">
          Seleccionar archivo ficticio (PDF, JPG o PNG, hasta 5 MB)
        </label>
        <input
          id="prescription-file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          disabled={review.status === 'pending'}
          className="min-h-12 w-full min-w-0 rounded-md border border-border p-3 text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void submit({ name: file.name, type: file.type, size: file.size });
            event.target.value = '';
          }}
        />
      </div>
      {review.document ? (
        <p className="break-words text-sm text-text-muted">
          Archivo de prueba: {review.document.name}
        </p>
      ) : null}
      <p role="status" aria-atomic="true" className="font-semibold text-primary-surface-text">
        {review.status === 'pending'
          ? 'Revisando receta de prueba…'
          : review.status === 'approved'
            ? 'Receta aprobada en la simulación.'
            : ''}
      </p>
      {error || review.status === 'rejected' || review.status === 'error' ? (
        <p role="alert" className="text-sm text-error">
          {error ??
            (review.status === 'rejected'
              ? 'La receta de prueba fue rechazada. Reemplázala para intentar otra vez.'
              : 'No se pudo revisar la receta. Inténtalo nuevamente.')}
        </p>
      ) : null}
      {review.status === 'approved' ? (
        <Link
          to="/checkout/fulfillment"
          className="inline-flex min-h-12 items-center rounded-md bg-primary px-5 py-3 font-semibold text-primary-contrast"
        >
          Continuar con la entrega
        </Link>
      ) : (
        <p className="text-xs text-text-muted">
          Podrás continuar después de la aprobación simulada.
        </p>
      )}
    </div>
  );
};
