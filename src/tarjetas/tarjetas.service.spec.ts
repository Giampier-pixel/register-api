import { NotFoundException } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRol } from '../users/schemas/user.schema';
import { CountersService } from './counters.service';
import { CreateTarjetaDto } from './dto/create-tarjeta.dto';
import { QueryTarjetasDto } from './dto/query-tarjetas.dto';
import {
  EstadoCivil,
  GradoInstruccion,
  Ocupacion,
  ServiciosBasicos,
  Vivienda,
} from './enums/tarjeta.enums';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { Tarjeta, TarjetaSchema } from './schemas/tarjeta.schema';
import { TarjetasService } from './tarjetas.service';

const USUARIO: AuthenticatedUser = {
  userId: '64b7f0f0f0f0f0f0f0f0f0f0',
  email: 'asistente@test.local',
  nombre: 'Carmen Díaz',
  rol: UserRol.TRABAJADOR_SOCIAL,
};

/** El transform de toJSON añade el virtual `id`, que el tipo estático no conoce. */
const idDe = (tarjeta: unknown): string => (tarjeta as { id: string }).id;

function dtoBase(apellidos: [string, string], nombres: string) {
  const dto = new CreateTarjetaDto();
  Object.assign(dto, {
    paciente: {
      apellidoPaterno: apellidos[0],
      apellidoMaterno: apellidos[1],
      nombres,
      nroHistoriaClinica: 'HC-001',
      procedencia: 'Callao',
      lugarNacimiento: 'Lima',
      fechaNacimiento: new Date(2000, 0, 1),
    },
    gradoInstruccion: GradoInstruccion.PRIMARIA,
    estadoCivil: EstadoCivil.SOLTERO,
    ocupacion: Ocupacion.SU_CASA,
    socioeconomico: {
      ingresoEconomico: 1000,
      gradoDependencia: 0,
      direccion: 'Av. Test 123',
      distrito: 'Callao',
    },
    vivienda: Vivienda.PROPIA,
    serviciosBasicos: ServiciosBasicos.COMPLETO,
    preDiagnosticoSocial: 'Evaluación inicial.',
  });
  return dto;
}

function consulta(partes: Partial<QueryTarjetasDto> = {}): QueryTarjetasDto {
  const query = new QueryTarjetasDto();
  Object.assign(query, partes);
  return query;
}

describe('TarjetasService (Mongo en memoria)', () => {
  let mongod: MongoMemoryServer;
  let moduleRef: TestingModule;
  let service: TarjetasService;
  let tarjetaModel: Model<Tarjeta>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri('test_tarjetas')),
        MongooseModule.forFeature([
          { name: Tarjeta.name, schema: TarjetaSchema },
          { name: Counter.name, schema: CounterSchema },
        ]),
      ],
      providers: [TarjetasService, CountersService],
    }).compile();

    service = moduleRef.get(TarjetasService);
    tarjetaModel = moduleRef.get(getModelToken(Tarjeta.name));
  });

  afterAll(async () => {
    await moduleRef.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    const conn = tarjetaModel.db;
    await conn.dropDatabase();
  });

  describe('create', () => {
    it('asigna folios consecutivos y los metadatos automáticos', async () => {
      const primera = await service.create(
        dtoBase(['Pérez', 'García'], 'Juan'),
        USUARIO,
      );
      const segunda = await service.create(
        dtoBase(['Quispe', 'Mamani'], 'Rosa'),
        USUARIO,
      );

      expect(primera.nroTarjetaSocial).toBe(1);
      expect(segunda.nroTarjetaSocial).toBe(2);
      expect(primera.asistenteSocial).toBe('Carmen Díaz');
      expect(primera.activa).toBe(true);
      expect(primera.fechaInscripcion).toBeInstanceOf(Date);
      expect(String(primera.creadoPor)).toBe(USUARIO.userId);
    });

    it('calcula la edad cuando no se envía', async () => {
      const nacimiento = new Date(2000, 0, 1);
      const hoy = new Date();
      let esperada = hoy.getFullYear() - 2000;
      const cumplio =
        hoy.getMonth() > 0 || (hoy.getMonth() === 0 && hoy.getDate() >= 1);
      if (!cumplio) esperada--;

      const dto = dtoBase(['Soto', 'Luna'], 'Ana');
      dto.paciente.fechaNacimiento = nacimiento;
      const creada = await service.create(dto, USUARIO);
      expect(creada.paciente.edad).toBe(esperada);
    });

    it('respeta la edad cuando sí se envía', async () => {
      const dto = dtoBase(['Soto', 'Luna'], 'Ana');
      dto.paciente.edad = 99;
      const creada = await service.create(dto, USUARIO);
      expect(creada.paciente.edad).toBe(99);
    });
  });

  describe('búsqueda (RF-022)', () => {
    beforeEach(async () => {
      await service.create(
        dtoBase(['Pérez', 'García'], 'Juan Alberto'),
        USUARIO,
      );
      const dto = dtoBase(['Quispe', 'Mamani'], 'Rosa');
      dto.paciente.nroHistoriaClinica = 'HC-777';
      await service.create(dto, USUARIO);
    });

    it('encuentra sin tildes lo guardado con tildes', async () => {
      const r = await service.findAll(consulta({ search: 'perez juan' }));
      expect(r.meta.total).toBe(1);
      expect(r.data[0].paciente.apellidoPaterno).toBe('Pérez');
    });

    it('encuentra con tildes lo guardado, en cualquier campo del nombre', async () => {
      const r = await service.findAll(consulta({ search: 'garcía' }));
      expect(r.meta.total).toBe(1);
    });

    it('multi-palabra exige que todas coincidan', async () => {
      const r = await service.findAll(consulta({ search: 'perez rosa' }));
      expect(r.meta.total).toBe(0);
    });

    it('busca por número de tarjeta social', async () => {
      const r = await service.findAll(consulta({ search: '2' }));
      expect(r.meta.total).toBe(1);
      expect(r.data[0].nroTarjetaSocial).toBe(2);
    });

    it('busca por número de historia clínica', async () => {
      const r = await service.findAll(consulta({ search: 'HC-777' }));
      expect(r.meta.total).toBe(1);
      expect(r.data[0].paciente.apellidoPaterno).toBe('Quispe');
    });
  });

  describe('filtros de fecha anclados a Perú (RF-023)', () => {
    it('una fecha sin hora cubre el día peruano completo', async () => {
      const a = await service.create(dtoBase(['Lima', 'Norte'], 'A'), USUARIO);
      const b = await service.create(dtoBase(['Lima', 'Sur'], 'B'), USUARIO);

      // A: 14 mar 23:59 en Perú · B: 15 mar 00:00 en Perú
      await tarjetaModel.updateOne(
        { nroTarjetaSocial: a.nroTarjetaSocial },
        { fechaInscripcion: new Date('2026-03-15T04:59:00.000Z') },
      );
      await tarjetaModel.updateOne(
        { nroTarjetaSocial: b.nroTarjetaSocial },
        { fechaInscripcion: new Date('2026-03-15T05:00:00.000Z') },
      );

      const hasta14 = await service.findAll(
        consulta({ fechaHasta: '2026-03-14' }),
      );
      expect(hasta14.meta.total).toBe(1);
      expect(hasta14.data[0].nroTarjetaSocial).toBe(a.nroTarjetaSocial);

      const desde15 = await service.findAll(
        consulta({ fechaDesde: '2026-03-15' }),
      );
      expect(desde15.meta.total).toBe(1);
      expect(desde15.data[0].nroTarjetaSocial).toBe(b.nroTarjetaSocial);

      const rango = await service.findAll(
        consulta({ fechaDesde: '2026-03-14', fechaHasta: '2026-03-15' }),
      );
      expect(rango.meta.total).toBe(2);
    });
  });

  describe('soft delete y filtro de estado (RF-015/023)', () => {
    it('desactiva sin borrar, filtra por estado y reactiva', async () => {
      const creada = await service.create(
        dtoBase(['Vega', 'Paz'], 'Eva'),
        USUARIO,
      );
      const id = idDe(creada);

      const desactivada = await service.deactivate(id, USUARIO);
      expect(desactivada.activa).toBe(false);
      expect(String(desactivada.actualizadoPor)).toBe(USUARIO.userId);

      expect(
        (await service.findAll(consulta({ activa: true }))).meta.total,
      ).toBe(0);
      expect(
        (await service.findAll(consulta({ activa: false }))).meta.total,
      ).toBe(1);
      // el documento sigue existiendo
      expect(await tarjetaModel.countDocuments()).toBe(1);

      const reactivada = await service.activate(id, USUARIO);
      expect(reactivada.activa).toBe(true);
    });
  });

  describe('update (RF-014)', () => {
    it('reemplaza secciones completas y registra quién actualizó', async () => {
      const creada = await service.create(
        dtoBase(['Ruiz', 'Soto'], 'Leo'),
        USUARIO,
      );
      const id = idDe(creada);

      const actualizada = await service.update(
        id,
        { dx: 'Diagnóstico nuevo' },
        { ...USUARIO, userId: '64b7f0f0f0f0f0f0f0f0f0f1' },
      );

      expect(actualizada.dx).toBe('Diagnóstico nuevo');
      expect(actualizada.paciente.apellidoPaterno).toBe('Ruiz');
      expect(String(actualizada.actualizadoPor)).toBe(
        '64b7f0f0f0f0f0f0f0f0f0f1',
      );
    });

    it('al reemplazar paciente sin historia clínica, la sección queda como se envió', async () => {
      const creada = await service.create(
        dtoBase(['Ruiz', 'Soto'], 'Leo'),
        USUARIO,
      );

      const actualizada = await service.update(
        idDe(creada),
        {
          paciente: {
            apellidoPaterno: 'Ruiz',
            apellidoMaterno: 'Soto',
            nombres: 'Leonardo',
            procedencia: 'Lima',
            lugarNacimiento: 'Ica',
            fechaNacimiento: new Date(1995, 5, 1),
          },
        },
        USUARIO,
      );

      expect(actualizada.paciente.nombres).toBe('Leonardo');
      expect(actualizada.paciente.nroHistoriaClinica).toBeUndefined();
      expect(actualizada.paciente.edad).toBeGreaterThan(0);
    });
  });

  describe('paginación (RF-020)', () => {
    it('pagina y ordena por folio descendente', async () => {
      for (const n of ['Uno', 'Dos', 'Tres']) {
        await service.create(dtoBase(['Pag', 'Test'], n), USUARIO);
      }

      const pagina1 = await service.findAll(consulta({ page: 1, limit: 2 }));
      expect(pagina1.data).toHaveLength(2);
      expect(pagina1.meta).toEqual({
        total: 3,
        page: 1,
        limit: 2,
        totalPages: 2,
      });
      expect(pagina1.data[0].nroTarjetaSocial).toBe(3);

      const pagina2 = await service.findAll(consulta({ page: 2, limit: 2 }));
      expect(pagina2.data).toHaveLength(1);
      expect(pagina2.data[0].nroTarjetaSocial).toBe(1);
    });
  });

  describe('findOne', () => {
    it('lanza 404 para un id inexistente', async () => {
      await expect(
        service.findOne('64b7f0f0f0f0f0f0f0f0f0ff'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
