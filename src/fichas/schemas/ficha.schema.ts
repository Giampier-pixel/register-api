// src/fichas/schemas/ficha.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  Aseguramiento,
  Categoria,
  CondicionOcupacional,
  EquipamientoHogar,
  EstadoCivil,
  FactorRiesgo,
  GradoDependenciaEconomica,
  GradoInstruccion,
  MaterialConstruccion,
  ServiciosBasicos,
  Tenencia,
  TramoIngreso,
} from '../enums/ficha.enums';

@Schema({ _id: false })
export class Paciente {
  @Prop({ required: true, trim: true }) apellidoPaterno!: string;
  @Prop({ required: true, trim: true }) apellidoMaterno!: string;
  @Prop({ required: true, trim: true }) nombres!: string;
  @Prop({ trim: true }) nroHistoriaClinica?: string;
  @Prop({ required: true, trim: true }) procedencia!: string;
  @Prop({ required: true, trim: true }) lugarNacimiento!: string;
  @Prop({ required: true }) fechaNacimiento!: Date;
  @Prop({ required: true, min: 0, max: 130 }) edad!: number;
}

@Schema({ _id: false })
export class PersonaAcompana {
  @Prop({ trim: true }) nombre?: string;
  @Prop({ trim: true }) direccion?: string;
  @Prop({ trim: true }) telefono?: string;
}

@Schema({ _id: false })
export class MiembroFamiliar {
  @Prop({ required: true, trim: true }) nombresApellidos!: string;
  @Prop({ trim: true }) parentesco?: string;
  @Prop({ min: 0, max: 130 }) edad?: number;
  @Prop({ trim: true }) gradoInstruccion?: string;
  @Prop({ default: false }) esAsegurado?: boolean;
  @Prop({ trim: true }) ocupacion?: string;
  @Prop({ min: 0 }) ingreso?: number;
  @Prop({ trim: true }) observaciones?: string;
}

@Schema({ _id: false })
export class IngresosGastos {
  @Prop({ min: 0 }) ingresoFamiliar?: number;
  @Prop({ min: 0 }) ayudasApoyos?: number;
  @Prop({ min: 0 }) rentas?: number;
  @Prop({ min: 0 }) otrosIngresos?: number;
  @Prop({ min: 0 }) gastoAlimentacion?: number;
  @Prop({ min: 0 }) gastoVivienda?: number;
  @Prop({ min: 0 }) gastoMovilidad?: number;
  @Prop({ min: 0 }) otrosGastos?: number;
}

@Schema({ _id: false })
export class Vivienda {
  @Prop({ type: String, required: true, enum: Tenencia }) tenencia!: Tenencia;
  @Prop({ type: String, required: true, enum: MaterialConstruccion })
  materialConstruccion!: MaterialConstruccion;
  @Prop({ required: true, min: 0 }) nroMiembrosHogar!: number;
  @Prop({ required: true, min: 1 }) nroAmbientesDormir!: number;
  @Prop({ type: String, required: true, enum: ServiciosBasicos })
  serviciosBasicos!: ServiciosBasicos;
}

@Schema({ _id: false })
export class Puntajes {
  @Prop({ required: true }) puntajeBasico!: number;
  @Prop() puntajeEstudioSocial?: number;
  @Prop({ type: String, required: true, enum: Categoria })
  categoria!: Categoria;
}

export type FichaSocialDocument = HydratedDocument<FichaSocial>;

@Schema({
  collection: 'fichas',
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret._id;
      return ret;
    },
  },
})
export class FichaSocial {
  @Prop({ required: true, unique: true }) nroFichaSocial!: number;
  @Prop({ trim: true }) servicio?: string;

  @Prop({ type: Paciente, required: true }) paciente!: Paciente;
  @Prop({ type: String, required: true, enum: GradoInstruccion })
  gradoInstruccion!: GradoInstruccion;
  @Prop({ type: String, required: true, enum: EstadoCivil })
  estadoCivil!: EstadoCivil;
  @Prop({ type: String, required: true, enum: Aseguramiento })
  aseguramiento!: Aseguramiento;
  @Prop({ trim: true }) aseguramientoOtro?: string;

  @Prop({ trim: true }) ocupacion?: string;
  @Prop({ type: String, required: true, enum: CondicionOcupacional })
  condicionOcupacional!: CondicionOcupacional;
  @Prop({ trim: true }) direccion?: string;
  @Prop({ trim: true }) telefono?: string;
  @Prop({ type: PersonaAcompana }) personaAcompana?: PersonaAcompana;

  @Prop({ type: [MiembroFamiliar], default: [] })
  composicionFamiliar!: MiembroFamiliar[];
  @Prop({ type: String, required: true, enum: GradoDependenciaEconomica })
  gradoDependenciaEconomica!: GradoDependenciaEconomica;

  @Prop({ type: IngresosGastos }) ingresosGastos?: IngresosGastos;
  @Prop({ type: String, required: true, enum: TramoIngreso })
  tramoIngreso!: TramoIngreso;

  @Prop({ type: Vivienda, required: true }) vivienda!: Vivienda;
  @Prop({ type: String, required: true, enum: EquipamientoHogar })
  equipamientoHogar!: EquipamientoHogar;

  @Prop({ trim: true }) factoresRiesgoTexto?: string;
  @Prop({ type: [String], enum: FactorRiesgo, default: [] })
  factoresRiesgo!: FactorRiesgo[];

  @Prop({ type: Puntajes, required: true }) puntajes!: Puntajes;

  @Prop({ required: true, trim: true }) trabajadoraSocial!: string;
  @Prop({ required: true }) fechaInscripcion!: Date;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creadoPor!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' }) actualizadoPor?: Types.ObjectId;
  @Prop({ default: true }) activa!: boolean;
}

export const FichaSocialSchema = SchemaFactory.createForClass(FichaSocial);

FichaSocialSchema.index({ 'paciente.apellidoPaterno': 1 });
FichaSocialSchema.index({ 'paciente.apellidoMaterno': 1 });
FichaSocialSchema.index({ 'paciente.nombres': 1 });
FichaSocialSchema.index({ 'paciente.nroHistoriaClinica': 1 });
FichaSocialSchema.index({ fechaInscripcion: -1 });
FichaSocialSchema.index({ 'puntajes.categoria': 1 });
FichaSocialSchema.index({ activa: 1 });
