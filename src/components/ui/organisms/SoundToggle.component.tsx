import { useState, type FC } from 'react';
import { setSoundEnabled, soundEnabled } from '@/utils/feedback.util';

export const SoundToggle: FC = () => {
  const [enabled, setEnabled] = useState(soundEnabled);
  return (
    <button
      type="button"
      aria-label="Sonidos de compra"
      aria-pressed={enabled}
      onClick={() => {
        setSoundEnabled(!enabled);
        setEnabled(!enabled);
      }}
      className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-text-main transition-colors hover:bg-primary-surface"
    >
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d={enabled ? 'M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14' : 'm16 9 5 6m0-6-5 6'} />
      </svg>
      <span className="max-sm:sr-only">Sonido {enabled ? 'activo' : 'silenciado'}</span>
    </button>
  );
};
