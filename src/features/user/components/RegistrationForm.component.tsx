import { useState, type FC } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/ui/molecules/FormField.component';
import type { RegistrationInput, UserAccessFacade } from '../domain/User';
import { registrationSchema } from '../utils/accessValidation.util';
import { createSchemaResolver } from '../utils/schemaResolver.util';
import { useAccessFlow } from '../hooks/useAccessFlow.hook';
import { AccessFeedback } from './AccessFeedback.component';

interface RegistrationFormProps {
  facade: UserAccessFacade;
}

export const RegistrationForm: FC<RegistrationFormProps> = ({ facade }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegistrationInput>({
    resolver: createSchemaResolver(registrationSchema),
    defaultValues: { fullName: '', email: '', password: '', passwordConfirmation: '' },
  });
  const { state, submit } = useAccessFlow();
  const [registeredEmail, setRegisteredEmail] = useState<string>('');

  if (state.status === 'success')
    return (
      <div
        role="status"
        className="space-y-4 rounded-lg bg-primary-surface p-6 text-primary-surface-text"
      >
        <h2 className="text-xl font-bold">¡Tu cuenta de prueba está lista!</h2>
        <p className="break-words">
          Puedes iniciar sesión con {registeredEmail}. La cuenta se conserva solo hasta recargar la
          página.
        </p>
        <Link
          to="/iniciar-sesion"
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-3 font-semibold text-primary-contrast"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );

  return (
    <form
      noValidate
      aria-label="Crear cuenta"
      aria-busy={state.status === 'submitting'}
      onSubmit={handleSubmit((input) =>
        submit(
          () => facade.register(input),
          (user) => {
            setRegisteredEmail(user.email);
            reset();
          }
        )
      )}
      className="space-y-5"
    >
      <fieldset disabled={state.status === 'submitting'} className="min-w-0 space-y-5">
        <legend className="sr-only">Datos de registro</legend>
        <FormField
          required
          id="register-name"
          label="Nombre completo"
          autoComplete="name"
          maxLength={120}
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <FormField
          required
          id="register-email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          maxLength={254}
          error={errors.email?.message}
          {...register('email')}
        />
        <FormField
          required
          id="register-password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          hint="Usa entre 8 y 128 caracteres."
          error={errors.password?.message}
          {...register('password')}
        />
        <FormField
          required
          id="register-confirmation"
          label="Confirmación de contraseña"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          error={errors.passwordConfirmation?.message}
          {...register('passwordConfirmation')}
        />
        <button
          type="submit"
          className="min-h-12 w-full rounded-md bg-primary px-6 py-3 font-semibold text-primary-contrast transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          Crear cuenta
        </button>
      </fieldset>
      <AccessFeedback state={state} />
      <p className="text-center text-sm text-text-muted">
        ¿Ya tienes una cuenta?{' '}
        <Link
          to="/iniciar-sesion"
          className="inline-flex min-h-11 items-center font-semibold text-primary-surface-text"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
};
