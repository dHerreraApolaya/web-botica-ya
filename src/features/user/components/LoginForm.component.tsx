import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/ui/molecules/FormField.component';
import type { LoginInput, UserAccessFacade } from '../domain/User';
import { loginSchema } from '../utils/accessValidation.util';
import { createSchemaResolver } from '../utils/schemaResolver.util';
import { useAccessFlow } from '../hooks/useAccessFlow.hook';
import { useUserSession } from '../state/userSession.store';
import { AccessFeedback } from './AccessFeedback.component';

interface LoginFormProps {
  facade: UserAccessFacade;
}

export const LoginForm: FC<LoginFormProps> = ({ facade }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: createSchemaResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const { state, submit } = useAccessFlow();
  const setUser = useUserSession((session) => session.setUser);
  const currentUser = useUserSession((session) => session.user);

  if (currentUser)
    return (
      <div
        role="status"
        className="space-y-4 rounded-lg bg-primary-surface p-6 text-primary-surface-text"
      >
        <h2 className="text-xl font-bold">¡Ya iniciaste sesión!</h2>
        <p>Tu sesión de demostración está activa hasta que recargues la página.</p>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-3 font-semibold text-primary-contrast"
        >
          Explorar productos
        </Link>
      </div>
    );

  return (
    <form
      noValidate
      aria-label="Iniciar sesión"
      aria-busy={state.status === 'submitting'}
      onSubmit={handleSubmit((input) =>
        submit(
          () => facade.login(input),
          (user) => {
            setUser(user);
            reset();
          }
        )
      )}
      className="space-y-5"
    >
      <fieldset disabled={state.status === 'submitting'} className="min-w-0 space-y-5">
        <legend className="sr-only">Datos de inicio de sesión</legend>
        <FormField
          required
          id="login-email"
          label="Correo electrónico"
          type="email"
          autoComplete="username"
          maxLength={254}
          error={errors.email?.message}
          {...register('email')}
        />
        <FormField
          required
          id="login-password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          error={errors.password?.message}
          {...register('password')}
        />
        <button
          type="submit"
          className="min-h-12 w-full rounded-md bg-primary px-6 py-3 font-semibold text-primary-contrast transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          Iniciar sesión
        </button>
      </fieldset>
      <AccessFeedback state={state} />
      <p className="text-center text-sm text-text-muted">
        ¿Aún no tienes una cuenta?{' '}
        <Link
          to="/registro"
          className="inline-flex min-h-11 items-center font-semibold text-primary-surface-text"
        >
          Regístrate
        </Link>
      </p>
    </form>
  );
};
