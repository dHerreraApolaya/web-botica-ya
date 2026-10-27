import { lazy, Suspense, type FC } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { LandingScreen } from './features/landing/screens/Landing.screen';
import { MainLayout } from './layouts/MainLayout.layout';

const UserAccessScreen = lazy(() => import('./features/user/screens/UserAccess.screen'));

const App: FC = () => (
  <BrowserRouter>
    <MainLayout>
      <Suspense
        fallback={
          <p role="status" className="p-8 text-center text-text-muted">
            Cargando…
          </p>
        }
      >
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/iniciar-sesion" element={<UserAccessScreen key="login" mode="login" />} />
          <Route path="/registro" element={<UserAccessScreen key="register" mode="register" />} />
          <Route
            path="*"
            element={
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Página no encontrada</h1>
                <Link
                  to="/"
                  className="mt-4 inline-flex min-h-11 items-center text-primary-surface-text"
                >
                  Volver a la tienda
                </Link>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </MainLayout>
  </BrowserRouter>
);

export default App;
