import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types, QueryFilter } from 'mongoose';
import { FichaSocial, FichaSocialDocument } from './schemas/ficha.schema';
import { CreateFichaDto } from './dto/create-ficha.dto';
import { UpdateFichaDto } from './dto/update-ficha.dto';
import { QueryFichasDto } from './dto/query-fichas.dto';
import { calcularPuntajes, EntradaScoring } from './scoring/scoring';
import {
  esSoloFecha,
  inicioDeDia,
  finDeDia,
  regexInsensibleAcentos,
} from './fichas.utils';

export interface UsuarioActual {
  id: string;
  nombre: string;
}

const SECUENCIA = 'fichaSocial';

type EntradaScoringSource = Pick<
  CreateFichaDto,
  | 'gradoInstruccion'
  | 'estadoCivil'
  | 'aseguramiento'
  | 'condicionOcupacional'
  | 'gradoDependenciaEconomica'
  | 'tramoIngreso'
  | 'equipamientoHogar'
> & {
  paciente: { edad: number };
  vivienda: {
    tenencia: CreateFichaDto['vivienda']['tenencia'];
    materialConstruccion: CreateFichaDto['vivienda']['materialConstruccion'];
    nroMiembrosHogar: number;
    nroAmbientesDormir: number;
    serviciosBasicos: CreateFichaDto['vivienda']['serviciosBasicos'];
  };
  factoresRiesgo?: EntradaScoring['factoresRiesgo'];
};

@Injectable()
export class FichasService {
  constructor(
    @InjectModel(FichaSocial.name)
    private readonly model: Model<FichaSocialDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private buildEntradaScoring(f: EntradaScoringSource): EntradaScoring {
    return {
      edad: f.paciente.edad,
      gradoInstruccion: f.gradoInstruccion,
      estadoCivil: f.estadoCivil,
      aseguramiento: f.aseguramiento,
      condicionOcupacional: f.condicionOcupacional,
      gradoDependenciaEconomica: f.gradoDependenciaEconomica,
      tramoIngreso: f.tramoIngreso,
      tenencia: f.vivienda.tenencia,
      materialConstruccion: f.vivienda.materialConstruccion,
      nroMiembrosHogar: f.vivienda.nroMiembrosHogar,
      nroAmbientesDormir: f.vivienda.nroAmbientesDormir,
      serviciosBasicos: f.vivienda.serviciosBasicos,
      equipamientoHogar: f.equipamientoHogar,
      factoresRiesgo: f.factoresRiesgo ?? [],
    };
  }

  private async siguienteFolio(): Promise<number> {
    const counter = await this.connection
      .collection<{ _id: string; seq: number }>('counters')
      .findOneAndUpdate(
        { _id: SECUENCIA },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' },
      );
    // counter is the updated document (returnDocument: 'after')
    return (counter as { seq: number }).seq;
  }

  async create(
    dto: CreateFichaDto,
    usuario: UsuarioActual,
  ): Promise<FichaSocialDocument> {
    const { puntajeBasico, categoria } = calcularPuntajes(
      this.buildEntradaScoring(dto),
    );
    const ficha = new this.model({
      ...dto,
      nroFichaSocial: await this.siguienteFolio(),
      puntajes: {
        puntajeBasico,
        categoria,
        puntajeEstudioSocial: dto.puntajeEstudioSocial,
      },
      trabajadoraSocial: usuario.nombre,
      fechaInscripcion: new Date(),
      creadoPor: new Types.ObjectId(usuario.id),
    });
    return ficha.save();
  }

  async findAll(query: QueryFichasDto) {
    const filter: QueryFilter<FichaSocialDocument> = {};

    if (query.activa !== undefined) filter.activa = query.activa;
    if (query.categoria) filter['puntajes.categoria'] = query.categoria;

    if (query.search) {
      const search = query.search.trim();
      const regex = (value: string) => ({
        $regex: regexInsensibleAcentos(value),
        $options: 'i',
      });

      const orClauses: QueryFilter<FichaSocialDocument>[] = [
        { 'paciente.nroHistoriaClinica': regex(search) },
        {
          $and: search.split(/\s+/).map((token) => ({
            $or: [
              { 'paciente.apellidoPaterno': regex(token) },
              { 'paciente.apellidoMaterno': regex(token) },
              { 'paciente.nombres': regex(token) },
            ],
          })),
        },
      ];

      if (/^\d+$/.test(search)) {
        orClauses.push({ nroFichaSocial: Number(search) });
      }

      filter.$or = orClauses;
    }

    if (query.fechaDesde || query.fechaHasta) {
      const rango: { $gte?: Date; $lte?: Date } = {};
      if (query.fechaDesde && esSoloFecha(query.fechaDesde)) {
        rango.$gte = inicioDeDia(query.fechaDesde);
      }
      if (query.fechaHasta && esSoloFecha(query.fechaHasta)) {
        rango.$lte = finDeDia(query.fechaHasta);
      }
      filter.fechaInscripcion = rango;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ fechaInscripcion: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<FichaSocialDocument> {
    const ficha = await this.model.findById(id).exec();
    if (!ficha) throw new NotFoundException('Ficha no encontrada');
    return ficha;
  }

  async update(
    id: string,
    dto: UpdateFichaDto,
    usuario: UsuarioActual,
  ): Promise<FichaSocialDocument> {
    const ficha = await this.findOne(id);

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) ficha.set(key, value);
    }

    const { puntajeBasico, categoria } = calcularPuntajes(
      this.buildEntradaScoring(ficha),
    );
    ficha.set('puntajes', {
      puntajeBasico,
      categoria,
      puntajeEstudioSocial:
        dto.puntajeEstudioSocial ?? ficha.puntajes?.puntajeEstudioSocial,
    });
    ficha.set('actualizadoPor', new Types.ObjectId(usuario.id));

    return ficha.save();
  }

  async deactivate(id: string): Promise<FichaSocialDocument> {
    const ficha = await this.findOne(id);
    ficha.set('activa', false);
    return ficha.save();
  }

  async activate(id: string): Promise<FichaSocialDocument> {
    const ficha = await this.findOne(id);
    ficha.set('activa', true);
    return ficha.save();
  }
}
