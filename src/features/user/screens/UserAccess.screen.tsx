import type { FC } from 'react';
import { Link } from 'react-router-dom';
import type { UserAccessFacade } from '../domain/User';
import { userAccessFacade } from '../application/userAccess.config';
import { LoginForm } from '../components/LoginForm.component';
import { RegistrationForm } from '../components/RegistrationForm.component';

interface UserAccessScreenProps {
  mode: 'login' | 'register';
  facade?: UserAccessFacade;
}

const UserAccessScreen: FC<UserAccessScreenProps> = ({ mode, facade = userAccessFacade }) => (
  <section
    className="mx-auto grid w-full max-w-6xl grid-cols-2 items-start gap-16 px-6 py-16 max-lg:gap-8 max-md:grid-cols-1 max-md:px-4 max-md:py-8"
    aria-labelledby="access-heading"
  >
    <div className="min-w-0 max-md:space-y-3">
      <Link
        to="/"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-surface-text"
      >
        ← Volver a la tienda
      </Link>
      <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-primary-surface-text max-md:mt-4">
        Tu bienestar, más cerca
      </p>
      <h1
        id="access-heading"
        className="mt-4 text-4xl font-extrabold tracking-tight text-text-main max-sm:text-3xl"
      >
        {mode === 'login' ? 'Qué bueno tenerte de vuelta' : 'Empieza a cuidarte con nosotros'}
      </h1>
      <p className="mt-4 max-w-md text-lg text-text-muted">
        Tu espacio en Botica Ya para acompañarte en el cuidado de tu salud y bienestar.
      </p>
      <div className="mt-8 rounded-lg bg-primary-surface p-6 text-sm text-primary-surface-text">
        <h2 className="font-bold">Modo demostración</h2>
        <p className="mt-2">
          Este acceso es una simulación. Usa datos ficticios; no ingreses tu contraseña personal.
        </p>
        <p className="mt-3 break-words">
          Cuenta de prueba: <strong>usuario0001@example.test</strong>
        </p>
        <p className="mt-2">
          Para la prueba puedes escribir cualquier contraseña de 8 a 128 caracteres. No se verifica
          ni se guarda.
        </p>
      </div>
    </div>
    <div className="min-w-0 rounded-xl border border-border bg-surface p-8 shadow-card max-sm:p-5">
      <h2 className="text-2xl font-bold text-text-main">
        {mode === 'login' ? 'Iniciar sesión' : 'Crear tu cuenta'}
      </h2>
      <p className="mb-6 mt-2 text-sm text-text-muted">
        {mode === 'login'
          ? 'Ingresa tus datos de prueba para continuar.'
          : 'Solo necesitamos tus datos básicos para comenzar.'}
      </p>
      {mode === 'login' ? <LoginForm facade={facade} /> : <RegistrationForm facade={facade} />}
    </div>
  </section>
);

export default UserAccessScreen;
