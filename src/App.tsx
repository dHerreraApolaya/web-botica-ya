import type { FC } from 'react';
import { LandingScreen } from './features/landing/screens/Landing.screen';
import { MainLayout } from './layouts/MainLayout.layout';

const App: FC = () => {
  return (
    <MainLayout>
      <LandingScreen />
    </MainLayout>
  );
};

export default App;
