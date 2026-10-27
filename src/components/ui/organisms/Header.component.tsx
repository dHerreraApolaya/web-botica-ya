import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { UserMenu } from '@/features/user/components/UserMenu.component';

export const Header: FC = () => {
  return (
    <header className="sticky top-0 z-sticky w-full border-b border-border bg-surface shadow-subtle">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3.5 max-md:px-4">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="Botica Ya, inicio" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-radius-md bg-primary text-primary-contrast shadow-subtle">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-text-main">
                Botica <span className="text-primary">Ya</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Farmacia Digital
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-1.5 rounded-radius-full border border-border bg-bg-app px-3.5 py-1 text-xs font-medium text-text-muted lg:flex">
            <svg
              className="h-4 w-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Envíos en menos de 45 min</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2.5">
          <UserMenu />
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-radius-md bg-primary-surface px-4 py-2 text-sm font-semibold text-primary-surface-text transition-all duration-fast hover:opacity-90 sm:inline-flex"
          >
            <svg
              className="h-4 w-4"
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
            <span>Subir Receta</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-radius-md border border-border bg-surface p-2 text-text-main transition-all duration-fast hover:bg-surface-hover"
            aria-label="Carrito de compras"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
