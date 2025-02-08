// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../user/user.entity';

export interface RolesOptions {
    roles: UserRole[];
    ownerAccess?: boolean;
    requireAll?: boolean;
  }

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);