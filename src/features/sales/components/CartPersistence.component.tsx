import { useEffect, useState, type FC } from 'react';
import { syncOrdersCart } from '../data/ordersCart.adapter';
import { salesStore } from '../state/sales.store';

export const CartPersistence: FC = () => {
  const [failed, setFailed] = useState(false);
  const sync = (): void => {
    void syncOrdersCart().then(
      () => setFailed(false),
      () => setFailed(true)
    );
  };

  useEffect(() => {
    let active = true;
    const synchronize = (): void => {
      void syncOrdersCart().then(
        () => {
          if (active) setFailed(false);
        },
        () => {
          if (active) setFailed(true);
        }
      );
    };
    const unsubscribe = salesStore.subscribe((state, previous) => {
      if (state.cart !== previous.cart) synchronize();
    });
    synchronize();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return failed ? (
    <p role="status" className="p-2 text-center text-sm">
      No se pudo guardar el carrito.{' '}
      <button type="button" className="underline" onClick={sync}>
        Reintentar
      </button>
    </p>
  ) : null;
};
