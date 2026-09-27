import type { FC, ReactNode } from 'react';
import { Header } from '@/components/ui/organisms/Header.component';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-app text-text-main">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
};
