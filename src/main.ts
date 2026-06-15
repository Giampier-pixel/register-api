import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // En producción se restringe a los orígenes de CORS_ORIGIN (coma-separados,
  // p. ej. la URL de Vercel). Sin esa variable, refleja cualquier origen.
  const origenes = process.env.CORS_ORIGIN?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origenes && origenes.length > 0 ? origenes : true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API — Tarjetas de Trabajo Social')
    .setDescription(
      'Registro, búsqueda y generación de PDF de tarjetas de trabajo social ' +
        'del Hospital "Daniel A. Carrión".',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  // '0.0.0.0' para que Render (y cualquier contenedor) pueda enrutar al puerto.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

void bootstrap();
