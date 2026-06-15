import { BadRequestException, ConflictException } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';
import { User, UserRol, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';

const idDe = (user: unknown): string => (user as { id: string }).id;

describe('UsersService (Mongo en memoria)', () => {
  let mongod: MongoMemoryServer;
  let moduleRef: TestingModule;
  let service: UsersService;
  let userModel: Model<User>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri('test_users')),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UsersService],
    }).compile();

    service = moduleRef.get(UsersService);
    userModel = moduleRef.get(getModelToken(User.name));
  });

  afterAll(async () => {
    await moduleRef.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  it('crea usuarios sin exponer el hash y normaliza el correo', async () => {
    const creado = await service.create({
      nombre: 'Ana Torres',
      email: 'Ana.Torres@Hospital.PE',
      password: 'Secreta123',
      rol: UserRol.ADMIN,
    });

    expect(creado.email).toBe('ana.torres@hospital.pe');
    expect(creado.rol).toBe(UserRol.ADMIN);
    expect(creado.activo).toBe(true);
    expect(creado).not.toHaveProperty('passwordHash');

    const entity = await service.findEntityByEmail('ANA.TORRES@hospital.pe');
    expect(entity).not.toBeNull();
    expect(await bcrypt.compare('Secreta123', entity!.passwordHash)).toBe(true);
  });

  it('rechaza correos duplicados con 409', async () => {
    await service.create({
      nombre: 'Ana',
      email: 'ana@test.pe',
      password: 'Secreta123',
      rol: UserRol.ADMIN,
    });

    await expect(
      service.create({
        nombre: 'Otra Ana',
        email: 'ANA@test.pe',
        password: 'Secreta123',
        rol: UserRol.TRABAJADOR_SOCIAL,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('actualiza datos y puede restablecer la contraseña', async () => {
    const creado = await service.create({
      nombre: 'Ana',
      email: 'ana@test.pe',
      password: 'Secreta123',
      rol: UserRol.TRABAJADOR_SOCIAL,
    });

    const actualizado = await service.update(idDe(creado), {
      nombre: 'Ana María',
      rol: UserRol.ADMIN,
      password: 'NuevaClave99',
    });

    expect(actualizado.nombre).toBe('Ana María');
    expect(actualizado.rol).toBe(UserRol.ADMIN);

    const entity = await service.findEntityByEmail('ana@test.pe');
    expect(await bcrypt.compare('NuevaClave99', entity!.passwordHash)).toBe(
      true,
    );
  });

  it('impide cambiar el correo a uno ya usado', async () => {
    await service.create({
      nombre: 'A',
      email: 'a@test.pe',
      password: 'Secreta123',
      rol: UserRol.ADMIN,
    });
    const b = await service.create({
      nombre: 'B',
      email: 'b@test.pe',
      password: 'Secreta123',
      rol: UserRol.ADMIN,
    });

    await expect(
      service.update(idDe(b), { email: 'a@test.pe' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('no permite que un admin se desactive a sí mismo', async () => {
    const admin = await service.create({
      nombre: 'Root',
      email: 'root@test.pe',
      password: 'Secreta123',
      rol: UserRol.ADMIN,
    });
    const id = idDe(admin);

    await expect(service.setActivo(id, false, id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('desactiva y reactiva a otros usuarios', async () => {
    const admin = await service.create({
      nombre: 'Root',
      email: 'root@test.pe',
      password: 'Secreta123',
      rol: UserRol.ADMIN,
    });
    const otro = await service.create({
      nombre: 'Otro',
      email: 'otro@test.pe',
      password: 'Secreta123',
      rol: UserRol.TRABAJADOR_SOCIAL,
    });

    const desactivado = await service.setActivo(idDe(otro), false, idDe(admin));
    expect(desactivado.activo).toBe(false);

    const reactivado = await service.setActivo(idDe(otro), true, idDe(admin));
    expect(reactivado.activo).toBe(true);
  });
});
