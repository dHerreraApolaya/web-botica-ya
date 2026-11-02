import type { FC } from 'react';

export const Footer: FC = () => (
  <footer aria-label="Beneficios de Botica Ya" className="w-full bg-bg-app pb-10">
    <div className="mx-auto max-w-6xl px-6 max-md:px-4">
      <div className="grid grid-cols-1 gap-4 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-radius-lg border border-border bg-surface p-4 text-left shadow-subtle">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-radius-md bg-primary-surface text-primary">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold text-text-main">Entrega Express</p>
            <p className="text-xs text-text-muted">En tu puerta en &lt;45 minutos</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-radius-lg border border-border bg-surface p-4 text-left shadow-subtle">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-radius-md bg-primary-surface text-primary">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold text-text-main">100% Certificados</p>
            <p className="text-xs text-text-muted">Garantía oficial DIGEMID</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-radius-lg border border-border bg-surface p-4 text-left shadow-subtle">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-radius-md bg-primary-surface text-primary">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold text-text-main">Químicos Colegiados</p>
            <p className="text-xs text-text-muted">Atención profesional 24/7</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-radius-lg border border-border bg-surface p-4 text-left shadow-subtle">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-radius-md bg-primary-surface text-primary">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold text-text-main">Receta Digital</p>
            <p className="text-xs text-text-muted">Sube tu foto y validamos</p>
          </div>
        </div>
      </div>
    </div>
  </footer>
);
