export interface User {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegistrationInput extends LoginInput {
  fullName: string;
  passwordConfirmation: string;
}

export type AccessErrorCode =
  'invalid-input' | 'invalid-credentials' | 'account-blocked' | 'email-exists' | 'unavailable';

export type AccessResult =
  | { readonly ok: true; readonly user: User }
  | { readonly ok: false; readonly code: AccessErrorCode };

export interface UserAccessAdapter {
  login(input: LoginInput): Promise<AccessResult>;
  register(input: Omit<RegistrationInput, 'passwordConfirmation'>): Promise<AccessResult>;
}

export interface UserAccessFacade {
  login(input: LoginInput): Promise<AccessResult>;
  register(input: RegistrationInput): Promise<AccessResult>;
}
