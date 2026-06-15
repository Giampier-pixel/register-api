import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserRol } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';

/**
 * Crea el administrador inicial a partir del .env:
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD y opcionalmente SEED_ADMIN_NOMBRE.
 * Uso: npm run seed
 */
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const config = app.get(ConfigService);
    const usersService = app.get(UsersService);

    const email = config.get<string>('SEED_ADMIN_EMAIL');
    const password = config.get<string>('SEED_ADMIN_PASSWORD');
    if (!email || !password) {
      throw new Error(
        'Define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en el .env antes de ejecutar el seed.',
      );
    }

    const existing = await usersService.findEntityByEmail(email);
    if (existing) {
      console.log(
        `El usuario administrador ${email} ya existe; nada que hacer.`,
      );
      return;
    }

    await usersService.create({
      nombre: config.get<string>('SEED_ADMIN_NOMBRE') ?? 'Administrador',
      email,
      password,
      rol: UserRol.ADMIN,
    });
    console.log(`Administrador creado: ${email}`);
  } finally {
    await app.close();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
