import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRol } from '../../users/schemas/user.schema';
import type { AuthenticatedUser } from '../interfaces/jwt-payload.interface';
import { RolesGuard } from './roles.guard';

function contexto(user?: AuthenticatedUser): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => function handler() {},
    getClass: () => class Clase {},
  } as unknown as ExecutionContext;
}

const trabajadora: AuthenticatedUser = {
  userId: 'u2',
  email: 'carmen@test.pe',
  nombre: 'Carmen',
  rol: UserRol.TRABAJADOR_SOCIAL,
};

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('permite endpoints sin restricción de rol', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contexto(trabajadora))).toBe(true);
  });

  it('permite cuando el rol coincide', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRol.TRABAJADOR_SOCIAL]);
    expect(guard.canActivate(contexto(trabajadora))).toBe(true);
  });

  it('rechaza con 403 cuando el rol no alcanza (RF-002/003)', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRol.ADMIN]);
    expect(() => guard.canActivate(contexto(trabajadora))).toThrow(
      ForbiddenException,
    );
  });

  it('rechaza si no hay usuario en el request', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRol.ADMIN]);
    expect(() => guard.canActivate(contexto(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
