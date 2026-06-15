import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRol } from '../../users/schemas/user.schema';
import { UsersService } from '../../users/users.service';
import type { AuthenticatedUser } from '../interfaces/jwt-payload.interface';
import { AuthGuard } from './auth.guard';

type RequestConUser = {
  headers: Record<string, string | undefined>;
  user?: AuthenticatedUser;
};

function contexto(request: RequestConUser): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class Clase {},
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let jwtService: { verifyAsync: jest.Mock };
  let usersService: { findEntityById: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: AuthGuard;

  const usuarioActivo = {
    id: 'u1',
    email: 'ana@test.pe',
    nombre: 'Ana',
    rol: UserRol.ADMIN,
    activo: true,
  };

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    usersService = { findEntityById: jest.fn() };
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) };
    guard = new AuthGuard(
      jwtService as unknown as JwtService,
      usersService as unknown as UsersService,
      reflector as unknown as Reflector,
    );
  });

  it('deja pasar endpoints @Public sin token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(contexto({ headers: {} }))).resolves.toBe(
      true,
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rechaza peticiones sin token', async () => {
    await expect(
      guard.canActivate(contexto({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza esquemas distintos de Bearer', async () => {
    await expect(
      guard.canActivate(contexto({ headers: { authorization: 'Basic abc' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza tokens inválidos o expirados', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('expirado'));
    await expect(
      guard.canActivate(
        contexto({ headers: { authorization: 'Bearer malo' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza usuarios desactivados aunque el token sea válido (RF-003)', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'u1' });
    usersService.findEntityById.mockResolvedValue({
      ...usuarioActivo,
      activo: false,
    });

    await expect(
      guard.canActivate(
        contexto({ headers: { authorization: 'Bearer valido' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('adjunta el usuario verificado al request', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'u1' });
    usersService.findEntityById.mockResolvedValue(usuarioActivo);

    const request: RequestConUser = {
      headers: { authorization: 'Bearer valido' },
    };
    await expect(guard.canActivate(contexto(request))).resolves.toBe(true);
    expect(request.user).toEqual({
      userId: 'u1',
      email: 'ana@test.pe',
      nombre: 'Ana',
      rol: UserRol.ADMIN,
    });
  });
});
