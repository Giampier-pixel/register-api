// src/fichas/dto/create-ficha.dto.ts
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  Aseguramiento,
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
import { inicioDeDia } from '../fichas.utils';

class PacienteDto {
  @IsString() @MinLength(1) apellidoPaterno!: string;
  @IsString() @MinLength(1) apellidoMaterno!: string;
  @IsString() @MinLength(1) nombres!: string;
  @IsOptional() @IsString() nroHistoriaClinica?: string;
  @IsString() @MinLength(1) procedencia!: string;
  @IsString() @MinLength(1) lugarNacimiento!: string;
  @Transform(({ value }) =>
    typeof value === 'string' ? inicioDeDia(value) : (value as Date),
  )
  @IsDate()
  fechaNacimiento!: Date;
  @IsInt() @Min(0) @Max(130) edad!: number;
}

class PersonaAcompanaDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() telefono?: string;
}

class MiembroFamiliarDto {
  @IsString() @MinLength(1) nombresApellidos!: string;
  @IsOptional() @IsString() parentesco?: string;
  @IsOptional() @IsInt() @Min(0) @Max(130) edad?: number;
  @IsOptional() @IsString() gradoInstruccion?: string;
  @IsOptional() @IsBoolean() esAsegurado?: boolean;
  @IsOptional() @IsString() ocupacion?: string;
  @IsOptional() @IsNumber() @Min(0) ingreso?: number;
  @IsOptional() @IsString() observaciones?: string;
}

class IngresosGastosDto {
  @IsOptional() @IsNumber() @Min(0) ingresoFamiliar?: number;
  @IsOptional() @IsNumber() @Min(0) ayudasApoyos?: number;
  @IsOptional() @IsNumber() @Min(0) rentas?: number;
  @IsOptional() @IsNumber() @Min(0) otrosIngresos?: number;
  @IsOptional() @IsNumber() @Min(0) gastoAlimentacion?: number;
  @IsOptional() @IsNumber() @Min(0) gastoVivienda?: number;
  @IsOptional() @IsNumber() @Min(0) gastoMovilidad?: number;
  @IsOptional() @IsNumber() @Min(0) otrosGastos?: number;
}

class ViviendaDto {
  @IsEnum(Tenencia) tenencia!: Tenencia;
  @IsEnum(MaterialConstruccion) materialConstruccion!: MaterialConstruccion;
  @IsInt() @Min(0) nroMiembrosHogar!: number;
  @IsInt() @Min(1) nroAmbientesDormir!: number;
  @IsEnum(ServiciosBasicos) serviciosBasicos!: ServiciosBasicos;
}

export class CreateFichaDto {
  @IsOptional() @IsString() servicio?: string;

  @ValidateNested() @Type(() => PacienteDto) paciente!: PacienteDto;

  @IsEnum(GradoInstruccion) gradoInstruccion!: GradoInstruccion;
  @IsEnum(EstadoCivil) estadoCivil!: EstadoCivil;
  @IsEnum(Aseguramiento) aseguramiento!: Aseguramiento;
  @IsOptional() @IsString() aseguramientoOtro?: string;

  @IsOptional() @IsString() ocupacion?: string;
  @IsEnum(CondicionOcupacional) condicionOcupacional!: CondicionOcupacional;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonaAcompanaDto)
  personaAcompana?: PersonaAcompanaDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MiembroFamiliarDto)
  composicionFamiliar?: MiembroFamiliarDto[];
  @IsEnum(GradoDependenciaEconomica)
  gradoDependenciaEconomica!: GradoDependenciaEconomica;

  @IsOptional()
  @ValidateNested()
  @Type(() => IngresosGastosDto)
  ingresosGastos?: IngresosGastosDto;
  @IsEnum(TramoIngreso) tramoIngreso!: TramoIngreso;

  @ValidateNested() @Type(() => ViviendaDto) vivienda!: ViviendaDto;
  @IsEnum(EquipamientoHogar) equipamientoHogar!: EquipamientoHogar;

  @IsOptional() @IsString() factoresRiesgoTexto?: string;
  @IsOptional()
  @IsArray()
  @IsEnum(FactorRiesgo, { each: true })
  factoresRiesgo?: FactorRiesgo[];

  @IsOptional() @IsNumber() puntajeEstudioSocial?: number;
}
