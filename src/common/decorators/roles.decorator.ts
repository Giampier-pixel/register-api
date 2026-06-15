import { SetMetadata } from '@nestjs/common';
import { UserRol } from '../../users/schemas/user.schema';

export const ROLES_KEY = 'roles';

/** Restringe un endpoint a los roles indicados. */
export const Roles = (...roles: UserRol[]) => SetMetadata(ROLES_KEY, roles);
