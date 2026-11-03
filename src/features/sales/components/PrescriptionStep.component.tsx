import { playFeedback } from '@/utils/feedback.util';
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
    const validationError = await facade.reviewPrescription(document);
    setError(validationError);
    if (validationError) void playFeedback('error');
  };
  return (
    <div className="space-y-5">
      <p className="text-text-muted">
        Añade tu receta de prueba para continuar. Puedes cambiar el archivo antes de confirmar tu
        compra.
      </p>
      <div className="rounded-lg border border-border bg-bg-app p-4">
        <h2 className="text-sm font-semibold text-text-main">Productos que necesitan receta</h2>
        <ul className="mt-2 space-y-2 text-sm text-text-muted">
          {cart
            .filter((line) => line.product.requiresPrescription)
            .map((line) => (
              <li key={line.product.id} className="flex flex-wrap justify-between gap-2">
                <span className="min-w-0 break-words">{line.product.name}</span>
                <span className="shrink-0 font-semibold text-text-main">
                  {formatCount(line.quantity, 'unidad', 'unidades')}
                </span>
              </li>
            ))}
        </ul>
      </div>
      <div className="rounded-lg border border-dashed border-primary bg-primary-surface p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface text-primary-surface-text">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 16V4m-4 4 4-4 4 4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-bold text-primary-surface-text">
          {review.document ? '¿Quieres cambiar tu receta?' : 'Sube tu receta de prueba'}
        </h2>
        <p id="prescription-help" className="mt-2 text-sm text-primary-surface-text">
          PDF, JPG o PNG · Máximo 5 MB
        </p>
        <label htmlFor="prescription-file" className="sr-only">
          Seleccionar archivo ficticio (PDF, JPG o PNG, hasta 5 MB)
        </label>
        <input
          id="prescription-file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          disabled={review.status === 'pending'}
          aria-describedby="prescription-help"
          className="mt-4 block min-h-12 w-full min-w-0 rounded-md border border-border bg-surface p-2 text-sm text-text-main file:mr-2 file:min-h-11 file:rounded-sm file:border-0 file:bg-primary file:px-4 file:font-semibold file:text-primary-contrast disabled:cursor-not-allowed disabled:opacity-50"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void submit({ name: file.name, type: file.type, size: file.size });
            event.target.value = '';
          }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4">
        <div>
          <h2 className="text-sm font-semibold">¿Solo estás probando?</h2>
          <p className="mt-1 text-sm text-text-muted">Continúa con un archivo de ejemplo.</p>
        </div>
        <button
          type="button"
          disabled={review.status === 'pending'}
          onClick={() =>
            void submit({ name: 'receta-sintetica.pdf', type: 'application/pdf', size: 1024 })
          }
          className="min-h-11 rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary-surface-text transition-colors duration-fast hover:bg-primary-surface disabled:opacity-50"
        >
          Usar receta de ejemplo
        </button>
      </div>
      <p className="text-xs leading-relaxed text-text-muted">
        Modo demostración: usa solo archivos ficticios, nunca documentos médicos reales. Solo se
        toma el nombre, formato y tamaño; no se lee ni se envía su contenido. La revisión es
        simulada.
      </p>
      {review.document ? (
        <p className="break-words rounded-md border border-border bg-bg-app p-4 text-sm text-text-main">
          Archivo de prueba: {review.document.name}. Puedes seleccionar otro archivo para
          reemplazarlo y revisarlo nuevamente.
        </p>
      ) : null}
      <p
        role="status"
        aria-atomic="true"
        className="text-sm font-semibold text-primary-surface-text"
      >
        {review.status === 'pending'
          ? 'Revisando receta de prueba…'
          : review.status === 'approved'
            ? 'Receta aprobada en la simulación.'
            : ''}
      </p>
      {error || review.status === 'rejected' || review.status === 'error' ? (
        <p role="alert" className="rounded-md border border-error p-4 text-sm text-error">
          {error ??
            (review.status === 'rejected'
              ? 'La receta de prueba fue rechazada. Reemplázala para intentar otra vez.'
              : 'No se pudo revisar la receta. Inténtalo nuevamente.')}
        </p>
      ) : null}
      {review.status === 'approved' ? (
        <Link
          to="/checkout/fulfillment"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-5 py-3 font-semibold text-primary-contrast transition-colors duration-fast hover:bg-primary-hover"
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
