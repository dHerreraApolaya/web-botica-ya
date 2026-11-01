import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UserAccessScreen from '../screens/UserAccess.screen';
import { Header } from '@/components/ui/organisms/Header.component';
import { createMockUserAdapter } from '../data/mockUser.adapter';
import users from '../data/users.mock.json';
import { createUserFacade } from '../application/user.facade';
import { useUserSession } from '../state/userSession.store';
import type { UserAccessFacade } from '../domain/User';

const renderAccess = (
  path: string = '/iniciar-sesion',
  facade: UserAccessFacade = createUserFacade(createMockUserAdapter(users, { delayMs: 0 }))
): void => {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
      <Routes>
        <Route path="/" element={<h1>Catálogo</h1>} />
        <Route
          path="/iniciar-sesion"
          element={<UserAccessScreen key="login" mode="login" facade={facade} />}
        />
        <Route
          path="/registro"
          element={<UserAccessScreen key="register" mode="register" facade={facade} />}
        />
      </Routes>
    </MemoryRouter>
  );
};

const fill = (label: string, value: string): void => {
  fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
};
const submitForm = async (name: string): Promise<void> => {
  await act(async () => {
    fireEvent.submit(screen.getByRole('form', { name }));
  });
};
const fillLogin = (email: string = users[0].email): void => {
  fill('Correo electrónico', email);
  fill('Contraseña', 'test-input-only');
};
const fillRegistration = (email: string = 'new@example.test'): void => {
  fill('Nombre completo', '  María de los Ángeles  ');
  fillLogin(email);
  fill('Confirmación de contraseña', 'test-input-only');
};

afterEach(() => {
  cleanup();
  useUserSession.getState().signOut();
  vi.useRealTimers();
});

describe('user access layouts', () => {
  it('shows a clearly labeled simulation and toggles password visibility accessibly', () => {
    renderAccess();
    expect(screen.getByRole('heading', { name: 'Modo demostración' })).toBeInTheDocument();
    fill('Contraseña', 'visible-input');
    const input = screen.getByLabelText('Contraseña', { exact: true });
    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveValue('visible-input');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('validates empty login fields and associates errors without calling the facade', async () => {
    const facade = { login: vi.fn(), register: vi.fn() };
    renderAccess('/iniciar-sesion', facade);
    await submitForm('Iniciar sesión');
    expect(screen.getByText('Ingresa un correo electrónico válido.')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Correo electrónico')).toHaveAccessibleDescription(
      'Ingresa un correo electrónico válido.'
    );
    expect(facade.login).not.toHaveBeenCalled();
  });

  it('signs in, exposes only public session fields, navigates home, and signs out', async () => {
    renderAccess();
    fillLogin(` ${users[0].email.toUpperCase()} `);
    await submitForm('Iniciar sesión');
    expect(
      await screen.findByRole('heading', { name: '¡Ya iniciaste sesión!' })
    ).toBeInTheDocument();
    expect(screen.getByText(users[0].fullName)).toBeInTheDocument();
    expect(useUserSession.getState().user).toEqual({
      id: users[0].id,
      fullName: users[0].fullName,
      email: users[0].email,
    });
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    fireEvent.click(screen.getByRole('link', { name: 'Explorar productos' }));
    expect(screen.getByRole('heading', { name: 'Catálogo' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(useUserSession.getState().user).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Ingresar' }));
    expect(screen.getByRole('form', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it.each([
    ['unknown@example.test', 'No pudimos iniciar sesión'],
    ['usuario0010@example.test', 'Esta cuenta de prueba está bloqueada'],
  ])('handles %s and allows correcting the submission', async (email, message) => {
    renderAccess();
    fillLogin(email);
    await submitForm('Iniciar sesión');
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    fillLogin();
    await submitForm('Iniciar sesión');
    expect(
      await screen.findByRole('heading', { name: '¡Ya iniciaste sesión!' })
    ).toBeInTheDocument();
  });

  it('prevents duplicate submits and disables fields while the mock is pending', async () => {
    vi.useFakeTimers();
    const facade = createUserFacade(createMockUserAdapter(users, { delayMs: 1000 }));
    const login = vi.spyOn(facade, 'login');
    renderAccess('/iniciar-sesion', facade);
    fillLogin();
    await submitForm('Iniciar sesión');
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeDisabled();
    expect(screen.getByLabelText('Correo electrónico')).toBeDisabled();
    expect(screen.getByText('Procesando tu solicitud…')).toBeInTheDocument();
    await submitForm('Iniciar sesión');
    expect(login).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByRole('heading', { name: '¡Ya iniciaste sesión!' })).toBeInTheDocument();
  });

  it('restores the login form when signing out from the login success view', async () => {
    renderAccess();
    fillLogin();
    await submitForm('Iniciar sesión');
    expect(
      await screen.findByRole('heading', { name: '¡Ya iniciaste sesión!' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(screen.getByRole('form', { name: 'Iniciar sesión' })).toBeInTheDocument();
    fillLogin();
    await submitForm('Iniciar sesión');
    expect(
      await screen.findByRole('heading', { name: '¡Ya iniciaste sesión!' })
    ).toBeInTheDocument();
  });

  it('validates registration, confirmation, and linked navigation', async () => {
    renderAccess();
    fireEvent.click(screen.getByRole('link', { name: 'Regístrate' }));
    fillRegistration();
    fill('Confirmación de contraseña', 'different');
    await submitForm('Crear cuenta');
    expect(
      screen.getByLabelText('Confirmación de contraseña', { exact: true })
    ).toHaveAccessibleDescription('Las contraseñas deben coincidir.');
    expect(screen.getByLabelText('Contraseña', { exact: true })).toHaveAccessibleDescription(
      'Usa entre 8 y 128 caracteres.'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar confirmación de contraseña' }));
    expect(screen.getByLabelText('Confirmación de contraseña', { exact: true })).toHaveAttribute(
      'type',
      'text'
    );
    fireEvent.click(screen.getByRole('link', { name: 'Inicia sesión' }));
    expect(screen.getByRole('form', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('registers a new account and logs in through the same mock adapter', async () => {
    renderAccess('/registro');
    fillRegistration();
    await submitForm('Crear cuenta');
    expect(
      await screen.findByRole('heading', { name: '¡Tu cuenta de prueba está lista!' })
    ).toBeInTheDocument();
    expect(useUserSession.getState().user).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Ir a iniciar sesión' }));
    fillLogin('new@example.test');
    await submitForm('Iniciar sesión');
    expect(
      await screen.findByRole('heading', { name: '¡Ya iniciaste sesión!' })
    ).toBeInTheDocument();
    expect(useUserSession.getState().user?.fullName).toBe('María de los Ángeles');
  });

  it('rejects duplicate registration then allows a corrected email', async () => {
    renderAccess('/registro');
    fillRegistration(` ${users[0].email.toUpperCase()} `);
    await submitForm('Crear cuenta');
    expect(await screen.findByRole('alert')).toHaveTextContent('Este correo ya está registrado');
    fill('Correo electrónico', 'unique@example.test');
    await submitForm('Crear cuenta');
    expect(
      await screen.findByRole('heading', { name: '¡Tu cuenta de prueba está lista!' })
    ).toBeInTheDocument();
  });

  it('uses the default composition and keeps a long signed-in name within a bounded element', () => {
    const user = users[5];
    useUserSession.getState().setUser(user);
    render(
      <MemoryRouter>
        <Header />
        <UserAccessScreen mode="login" />
      </MemoryRouter>
    );
    expect(screen.getByTitle(user.fullName)).toHaveClass('truncate');
    fireEvent.click(screen.getByRole('link', { name: 'Botica Ya, inicio' }));
  });
});
