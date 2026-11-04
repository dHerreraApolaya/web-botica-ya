export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly roles: readonly string[];
}

export interface PublicUser {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly documentType: string | null;
  readonly documentNumber: string | null;
  readonly roles: readonly string[];
}
