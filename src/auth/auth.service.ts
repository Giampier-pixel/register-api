import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findEntityByEmail(dto.email);
    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: user.toJSON(),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findEntityById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const passwordOk = await bcrypt.compare(
      dto.passwordActual,
      user.passwordHash,
    );
    if (!passwordOk) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    await this.usersService.setPassword(userId, dto.passwordNueva);
    return { message: 'Contraseña actualizada correctamente' };
  }
}
