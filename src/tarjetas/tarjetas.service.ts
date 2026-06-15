import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreateTarjetaDto } from './dto/create-tarjeta.dto';
import { QueryTarjetasDto } from './dto/query-tarjetas.dto';
import { UpdateTarjetaDto } from './dto/update-tarjeta.dto';
import { CountersService } from './counters.service';
import { Tarjeta, TarjetaDocument } from './schemas/tarjeta.schema';
import {
  calcularEdad,
  finDeDia,
  inicioDeDia,
  regexInsensibleAcentos,
} from './tarjetas.utils';

export const SECUENCIA_TARJETAS = 'tarjetaSocial';

@Injectable()
export class TarjetasService {
  constructor(
    @InjectModel(Tarjeta.name) private readonly tarjetaModel: Model<Tarjeta>,
    private readonly countersService: CountersService,
  ) {}

  async create(dto: CreateTarjetaDto, user: AuthenticatedUser) {
    const nroTarjetaSocial =
      await this.countersService.next(SECUENCIA_TARJETAS);

    const tarjeta = new this.tarjetaModel({
      ...dto,
      paciente: {
        ...dto.paciente,
        edad: dto.paciente.edad ?? calcularEdad(dto.paciente.fechaNacimiento),
      },
      nroTarjetaSocial,
      fechaInscripcion: new Date(),
      asistenteSocial: user.nombre,
      creadoPor: new Types.ObjectId(user.userId),
    });

    await tarjeta.save();
    return tarjeta.toJSON();
  }

  async findAll(query: QueryTarjetasDto) {
    const filter = this.buildFilter(query);
    const skip = (query.page - 1) * query.limit;

    const [data, total] = await Promise.all([
      this.tarjetaModel
        .find(filter)
        .sort({ nroTarjetaSocial: -1 })
        .skip(skip)
        .limit(query.limit)
        .exec(),
      this.tarjetaModel.countDocuments(filter).exec(),
    ]);

    return {
      data: data.map((tarjeta) => tarjeta.toJSON()),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async findOne(id: string) {
    const tarjeta = await this.findEntity(id);
    return tarjeta.toJSON();
  }

  async findEntity(id: string): Promise<TarjetaDocument> {
    const tarjeta = await this.tarjetaModel.findById(id).exec();
    if (!tarjeta) {
      throw new NotFoundException('Tarjeta no encontrada');
    }
    return tarjeta;
  }

  async update(id: string, dto: UpdateTarjetaDto, user: AuthenticatedUser) {
    const tarjeta = await this.findEntity(id);

    if (dto.paciente) {
      tarjeta.set('paciente', {
        ...dto.paciente,
        edad: dto.paciente.edad ?? calcularEdad(dto.paciente.fechaNacimiento),
      });
    }

    for (const key of [
      'gradoInstruccion',
      'estadoCivil',
      'ocupacion',
      'socioeconomico',
      'vivienda',
      'serviciosBasicos',
      'padreConyuge',
      'madreConyuge',
      'datosFamiliares',
      'saludFamiliar',
      'dx',
      'preDiagnosticoSocial',
    ] as const) {
      if (dto[key] !== undefined) {
        tarjeta.set(key, dto[key]);
      }
    }

    tarjeta.actualizadoPor = new Types.ObjectId(user.userId);
    await tarjeta.save();
    return tarjeta.toJSON();
  }

  /** RF-015: nunca se elimina, solo se desactiva. */
  async deactivate(id: string, user: AuthenticatedUser) {
    return this.setActiva(id, false, user);
  }

  async activate(id: string, user: AuthenticatedUser) {
    return this.setActiva(id, true, user);
  }

  private async setActiva(
    id: string,
    activa: boolean,
    user: AuthenticatedUser,
  ) {
    const tarjeta = await this.findEntity(id);
    tarjeta.activa = activa;
    tarjeta.actualizadoPor = new Types.ObjectId(user.userId);
    await tarjeta.save();
    return tarjeta.toJSON();
  }

  private buildFilter(query: QueryTarjetasDto): QueryFilter<TarjetaDocument> {
    const filter: QueryFilter<TarjetaDocument> = {};

    if (query.activa !== undefined) {
      filter.activa = query.activa;
    }

    if (query.fechaDesde || query.fechaHasta) {
      const rango: { $gte?: Date; $lte?: Date } = {};
      if (query.fechaDesde) {
        rango.$gte = inicioDeDia(query.fechaDesde);
      }
      if (query.fechaHasta) {
        rango.$lte = finDeDia(query.fechaHasta);
      }
      filter.fechaInscripcion = rango;
    }

    const search = query.search?.trim();
    if (search) {
      const regex = (value: string) => ({
        $regex: regexInsensibleAcentos(value),
        $options: 'i',
      });

      const orClauses: QueryFilter<TarjetaDocument>[] = [
        { 'paciente.nroHistoriaClinica': regex(search) },
        {
          // Cada palabra debe coincidir con algún campo del nombre,
          // así "perez juan" encuentra a Juan Pérez.
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
        orClauses.push({ nroTarjetaSocial: Number(search) });
      }

      filter.$or = orClauses;
    }

    return filter;
  }
}
