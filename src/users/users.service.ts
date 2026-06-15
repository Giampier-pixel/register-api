import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(dto: CreateUserDto) {
    await this.ensureEmailDisponible(dto.email);
    const user = new this.userModel({
      nombre: dto.nombre,
      email: dto.email,
      rol: dto.rol,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
    });
    await user.save();
    return user.toJSON();
  }

  async findAll() {
    const users = await this.userModel.find().sort({ createdAt: -1 }).exec();
    return users.map((user) => user.toJSON());
  }

  async findById(id: string) {
    const user = await this.findEntityById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user.toJSON();
  }

  /** Documento completo (incluye passwordHash); uso interno de auth. */
  async findEntityById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /** Documento completo (incluye passwordHash); uso interno de auth. */
  async findEntityByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findEntityById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      await this.ensureEmailDisponible(dto.email);
      user.email = dto.email;
    }
    if (dto.nombre !== undefined) {
      user.nombre = dto.nombre;
    }
    if (dto.rol !== undefined) {
      user.rol = dto.rol;
    }
    if (dto.password !== undefined) {
      user.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }

    await user.save();
    return user.toJSON();
  }

  async setActivo(id: string, activo: boolean, currentUserId: string) {
    if (!activo && id === currentUserId) {
      throw new BadRequestException('No puede desactivar su propia cuenta');
    }
    const user = await this.findEntityById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    user.activo = activo;
    await user.save();
    return user.toJSON();
  }

  async setPassword(id: string, password: string) {
    const user = await this.findEntityById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await user.save();
  }

  private async ensureEmailDisponible(email: string) {
    const existing = await this.findEntityByEmail(email);
    if (existing) {
      throw new ConflictException(
        `Ya existe un usuario con el correo ${email.toLowerCase()}`,
      );
    }
  }
}
