import { lazy, Suspense, type FC } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { LandingScreen } from './features/landing/screens/Landing.screen';
import { MainLayout } from './layouts/MainLayout.layout';

const CartScreen = lazy(() => import('./features/sales/screens/Cart.screen'));
const CheckoutScreen = lazy(() => import('./features/sales/screens/Checkout.screen'));
const ConfirmationScreen = lazy(() => import('./features/sales/screens/Confirmation.screen'));
const App: FC = () => (
  <BrowserRouter>
    <MainLayout>
      <Suspense
        fallback={
          <p role="status" className="p-8 text-center">
            Cargando…
          </p>
        }
      >
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/carrito" element={<CartScreen />} />
          <Route path="/checkout/:step?" element={<CheckoutScreen />} />
          <Route path="/confirmacion" element={<ConfirmationScreen />} />
          <Route
            path="*"
            element={
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Página no encontrada</h1>
                <Link
                  to="/"
                  className="inline-flex min-h-11 items-center text-primary-surface-text"
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
