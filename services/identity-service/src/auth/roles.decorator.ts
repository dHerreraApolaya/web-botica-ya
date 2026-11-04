import { SetMetadata } from '@nestjs/common';

export const REQUIRED_ROLES = 'requiredRoles';
export const Roles = (...roles: readonly string[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(REQUIRED_ROLES, roles);
