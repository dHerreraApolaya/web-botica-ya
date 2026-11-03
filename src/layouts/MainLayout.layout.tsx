import { useLayoutEffect, type FC, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Footer } from '@/components/ui/organisms/Footer.component';
import { Header } from '@/components/ui/organisms/Header.component';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
  }, [pathname]);
  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-app text-text-main">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};
