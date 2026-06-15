import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  EstadoCivil,
  GradoInstruccion,
  Ocupacion,
  SaludFamiliar,
  ServiciosBasicos,
  Vivienda,
} from '../enums/tarjeta.enums';

/** Sección 1 — Datos del Paciente */
@Schema({ _id: false })
export class Paciente {
  @Prop({ required: true, trim: true })
  apellidoPaterno!: string;

  @Prop({ required: true, trim: true })
  apellidoMaterno!: string;

  @Prop({ required: true, trim: true })
  nombres!: string;

  @Prop({ trim: true })
  nroHistoriaClinica?: string;

  @Prop({ required: true, trim: true })
  procedencia!: string;

  /** "Transferiso (derivado de)" en la ficha física */
  @Prop({ trim: true })
  transferido?: string;

  @Prop({ required: true, trim: true })
  lugarNacimiento!: string;

  @Prop({ required: true })
  fechaNacimiento!: Date;

  @Prop({ required: true, min: 0, max: 130 })
  edad!: number;
}

/** Sección 5 — Datos Socioeconómicos */
@Schema({ _id: false })
export class Socioeconomico {
  /** Ingreso económico en soles (S/) */
  @Prop({ required: true, min: 0 })
  ingresoEconomico!: number;

  /** Grado de dependencia económica: -3 a +3 */
  @Prop({ required: true, min: -3, max: 3 })
  gradoDependencia!: number;

  @Prop({ required: true, trim: true })
  direccion!: string;

  @Prop({ required: true, trim: true })
  distrito!: string;
}

/** Secciones 8 y 9 — Padre o Cónyuge / Madre o Cónyuge */
@Schema({ _id: false })
export class FamiliarConyuge {
  @Prop({ trim: true })
  nombre?: string;

  @Prop({ min: 0, max: 130 })
  edad?: number;

  @Prop({ trim: true })
  gradoInstruccion?: string;

  @Prop({ trim: true })
  telefono?: string;

  @Prop({ trim: true })
  ocupacion?: string;

  @Prop({ trim: true })
  centroTrabajo?: string;
}

/** Sección 10 — Datos Familiares */
@Schema({ _id: false })
export class DatosFamiliares {
  @Prop({ trim: true })
  numeroHermanosHijos?: string;

  @Prop({ trim: true })
  observaciones?: string;
}

export type TarjetaDocument = HydratedDocument<Tarjeta>;

@Schema({
  collection: 'tarjetas',
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
export class Tarjeta {
  /** Folio autoincremental (RF-011) */
  @Prop({ required: true, unique: true })
  nroTarjetaSocial!: number;

  @Prop({ type: Paciente, required: true })
  paciente!: Paciente;

  @Prop({ type: String, required: true, enum: GradoInstruccion })
  gradoInstruccion!: GradoInstruccion;

  @Prop({ type: String, required: true, enum: EstadoCivil })
  estadoCivil!: EstadoCivil;

  @Prop({ type: String, required: true, enum: Ocupacion })
  ocupacion!: Ocupacion;

  @Prop({ type: Socioeconomico, required: true })
  socioeconomico!: Socioeconomico;

  @Prop({ type: String, required: true, enum: Vivienda })
  vivienda!: Vivienda;

  @Prop({ type: String, required: true, enum: ServiciosBasicos })
  serviciosBasicos!: ServiciosBasicos;

  @Prop({ type: FamiliarConyuge })
  padreConyuge?: FamiliarConyuge;

  @Prop({ type: FamiliarConyuge })
  madreConyuge?: FamiliarConyuge;

  @Prop({ type: DatosFamiliares })
  datosFamiliares?: DatosFamiliares;

  /** Sección 11 — selección múltiple */
  @Prop({ type: [String], enum: SaludFamiliar, default: [] })
  saludFamiliar!: SaludFamiliar[];

  /** Sección 12 — Diagnóstico médico */
  @Prop({ trim: true })
  dx?: string;

  /** Sección 13 — obligatorio */
  @Prop({ required: true, trim: true })
  preDiagnosticoSocial!: string;

  /** Sección 14 — nombre del usuario que registró (auto) */
  @Prop({ required: true, trim: true })
  asistenteSocial!: string;

  /** RF-012 — asignada automáticamente al crear */
  @Prop({ required: true })
  fechaInscripcion!: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creadoPor!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  actualizadoPor?: Types.ObjectId;

  /** RF-015 — soft delete */
  @Prop({ default: true })
  activa!: boolean;
}

export const TarjetaSchema = SchemaFactory.createForClass(Tarjeta);

// Búsqueda por nombre/apellidos, historia clínica y filtros frecuentes (RF-022/023)
TarjetaSchema.index({ 'paciente.apellidoPaterno': 1 });
TarjetaSchema.index({ 'paciente.apellidoMaterno': 1 });
TarjetaSchema.index({ 'paciente.nombres': 1 });
TarjetaSchema.index({ 'paciente.nroHistoriaClinica': 1 });
TarjetaSchema.index({ fechaInscripcion: -1 });
TarjetaSchema.index({ activa: 1 });
