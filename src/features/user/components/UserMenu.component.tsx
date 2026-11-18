import { useEffect, useState, type FC } from 'react';
import { logoutIdentitySession, restoreIdentitySession } from '../data/httpUser.adapter';
import { Link } from 'react-router-dom';
import { useUserSession } from '../state/userSession.store';

export const UserMenu: FC = () => {
  const user = useUserSession((session) => session.user);
  const signOut = useUserSession((session) => session.signOut);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let active = true;
    void restoreIdentitySession().then((result) => {
      if (active && result.ok) useUserSession.getState().setUser(result.user);
    });
    return () => {
      active = false;
    };
  }, []);
  const logout = async (): Promise<void> => {
    setPending(true);
    setError(null);
    try {
      await logoutIdentitySession();
      signOut();
    } catch {
      setError('No se pudo cerrar la sesión. Inténtalo nuevamente.');
    } finally {
      setPending(false);
    }
  };

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
        onClick={() => void logout()}
        disabled={pending}
        className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold text-text-main hover:bg-surface-hover"
      >
        Cerrar sesión
      </button>
      {error && (
        <span role="alert" className="text-sm">
          {error}
        </span>
      )}
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
