import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useUserSession } from '../state/userSession.store';

export const UserMenu: FC = () => {
  const user = useUserSession((session) => session.user);
  const signOut = useUserSession((session) => session.signOut);

  return user ? (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
      <span
        title={user.fullName}
        className="max-w-32 truncate text-sm font-semibold text-text-main max-sm:max-w-24"
      >
        {user.fullName}
      </span>
      <button
        type="button"
        onClick={signOut}
        className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold text-text-main hover:bg-surface-hover"
      >
        Cerrar sesión
      </button>
    </div>
  ) : (
    <Link
      to="/iniciar-sesion"
      className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-primary-surface-text hover:bg-primary-surface"
    >
      Ingresar
    </Link>
  );
};
