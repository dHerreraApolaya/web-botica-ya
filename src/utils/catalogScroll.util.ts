export const scrollToCatalogSection = (id: string): void => {
  const target = document.getElementById(id);
  if (!target) return;
  const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({
    top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerHeight - 16),
    behavior: reducedMotion ? 'instant' : 'smooth',
  });
};
