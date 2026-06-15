import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UserRol } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<
    Pick<UsersService, 'findEntityByEmail' | 'findEntityById' | 'setPassword'>
  >;
  let passwordHash: string;

  const usuario = () => ({
    id: 'u1',
    email: 'ana@test.pe',
    nombre: 'Ana',
    rol: UserRol.ADMIN,
    activo: true,
    passwordHash,
    toJSON: () => ({ id: 'u1', email: 'ana@test.pe', nombre: 'Ana' }),
  });

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('Secreta123', 4);
  });

  beforeEach(async () => {
    usersService = {
      findEntityByEmail: jest.fn(),
      findEntityById: jest.fn(),
      setPassword: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('token-firmado') },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('login (RF-001)', () => {
    it('devuelve token y usuario con credenciales válidas', async () => {
      usersService.findEntityByEmail.mockResolvedValue(usuario() as never);

      const resultado = await service.login({
        email: 'ana@test.pe',
        password: 'Secreta123',
      });

      expect(resultado.accessToken).toBe('token-firmado');
      expect(resultado.user).toMatchObject({ email: 'ana@test.pe' });
    });

    it('rechaza contraseña incorrecta', async () => {
      usersService.findEntityByEmail.mockResolvedValue(usuario() as never);

      await expect(
        service.login({ email: 'ana@test.pe', password: 'Equivocada1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rechaza usuarios inexistentes', async () => {
      usersService.findEntityByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nadie@test.pe', password: 'Secreta123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rechaza cuentas desactivadas', async () => {
      usersService.findEntityByEmail.mockResolvedValue({
        ...usuario(),
        activo: false,
      } as never);

      await expect(
        service.login({ email: 'ana@test.pe', password: 'Secreta123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('changePassword (RF-005)', () => {
    it('exige la contraseña actual correcta', async () => {
      usersService.findEntityById.mockResolvedValue(usuario() as never);

      await expect(
        service.changePassword('u1', {
          passwordActual: 'Equivocada1',
          passwordNueva: 'NuevaClave99',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(usersService.setPassword).not.toHaveBeenCalled();
    });

    it('cambia la contraseña cuando la actual es válida', async () => {
      usersService.findEntityById.mockResolvedValue(usuario() as never);

      await service.changePassword('u1', {
        passwordActual: 'Secreta123',
        passwordNueva: 'NuevaClave99',
      });

      expect(usersService.setPassword).toHaveBeenCalledWith(
        'u1',
        'NuevaClave99',
      );
    });
  });
});
