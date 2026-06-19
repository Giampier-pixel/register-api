import { Test } from '@nestjs/testing';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Types } from 'mongoose';
import { FichasService } from './fichas.service';
import { FichaSocial, FichaSocialSchema } from './schemas/ficha.schema';
import {
  Aseguramiento,
  CondicionOcupacional,
  Categoria,
  EquipamientoHogar,
  EstadoCivil,
  GradoDependenciaEconomica,
  GradoInstruccion,
  MaterialConstruccion,
  ServiciosBasicos,
  Tenencia,
  TramoIngreso,
} from './enums/ficha.enums';
import { CreateFichaDto } from './dto/create-ficha.dto';

const dto = (): CreateFichaDto => ({
  paciente: {
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'Huamán',
    nombres: 'Juan',
    procedencia: 'Huancayo',
    lugarNacimiento: 'Huancayo',
    fechaNacimiento: new Date('1980-01-01T05:00:00.000Z'),
    edad: 46,
  },
  gradoInstruccion: GradoInstruccion.SECUNDARIA,
  estadoCivil: EstadoCivil.SOLTERO,
  aseguramiento: Aseguramiento.NO,
  condicionOcupacional: CondicionOcupacional.TRABAJADOR_INFORMAL,
  gradoDependenciaEconomica: GradoDependenciaEconomica.HASTA_3,
  tramoIngreso: TramoIngreso.MENOS_1_SMV,
  vivienda: {
    tenencia: Tenencia.PROPIA,
    materialConstruccion: MaterialConstruccion.RUSTICO,
    nroMiembrosHogar: 1,
    nroAmbientesDormir: 1,
    serviciosBasicos: ServiciosBasicos.PARCIAL,
  },
  equipamientoHogar: EquipamientoHogar.DE_1_A_2,
  factoresRiesgo: [],
});

describe('FichasService', () => {
  let mongod: MongoMemoryServer;
  let service: FichasService;
  let connection: Connection;
  const usuario = { id: new Types.ObjectId().toString(), nombre: 'Lic. María' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri()),
        MongooseModule.forFeature([
          { name: FichaSocial.name, schema: FichaSocialSchema },
        ]),
      ],
      providers: [FichasService],
    }).compile();
    service = moduleRef.get(FichasService);
    connection = moduleRef.get(getConnectionToken());
  });

  afterAll(async () => {
    await connection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    await connection.collection('fichas').deleteMany({});
    await connection.collection('counters').deleteMany({});
  });

  it('crea con folio 1, calcula puntaje/categoría y guarda al usuario', async () => {
    const ficha = await service.create(dto(), usuario);
    expect(ficha.nroFichaSocial).toBe(1);
    expect(ficha.trabajadoraSocial).toBe('Lic. María');
    expect(ficha.puntajes.puntajeBasico).toBeGreaterThan(0);
    expect(Object.values(Categoria)).toContain(ficha.puntajes.categoria);
  });

  it('el folio autoincrementa', async () => {
    const a = await service.create(dto(), usuario);
    const b = await service.create(dto(), usuario);
    expect(b.nroFichaSocial).toBe(a.nroFichaSocial + 1);
  });

  it('recalcula el puntaje al editar', async () => {
    const ficha = await service.create(dto(), usuario);
    const antes = ficha.puntajes.puntajeBasico;
    const editada = await service.update(
      ficha.id,
      { gradoInstruccion: GradoInstruccion.ILETRADO }, // peso 5 (antes 3)
      usuario,
    );
    expect(editada.puntajes.puntajeBasico).toBe(antes + 2);
  });

  it('filtra por categoría', async () => {
    await service.create(dto(), usuario);
    const creada = await service.create(dto(), usuario);
    const res = await service.findAll({
      categoria: creada.puntajes.categoria,
      page: 1,
      limit: 10,
    });
    expect(res.meta.total).toBeGreaterThanOrEqual(1);
    expect(
      res.data.every((f) => f.puntajes.categoria === creada.puntajes.categoria),
    ).toBe(true);
  });

  describe('previewPuntaje', () => {
    it('calcula puntaje/categoría desde datos parciales sin guardar', () => {
      const r = service.previewPuntaje({
        edad: 40,
        gradoInstruccion: GradoInstruccion.ILETRADO, // 5
        aseguramiento: Aseguramiento.NO, // 5
      });
      expect(r.puntajeBasico).toBe(10);
      expect(r.categoria).toBe(Categoria.A);
      expect(typeof r.desglose).toBe('object');
    });

    it('no escribe en la base', async () => {
      service.previewPuntaje({ edad: 70 });
      const total = await connection.collection('fichas').countDocuments({});
      expect(total).toBe(0);
    });
  });
});
