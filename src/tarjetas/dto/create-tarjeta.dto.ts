import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  EstadoCivil,
  GradoInstruccion,
  Ocupacion,
  SaludFamiliar,
  ServiciosBasicos,
  Vivienda,
} from '../enums/tarjeta.enums';
import { inicioDeDia } from '../tarjetas.utils';

export class PacienteDto {
  @IsString()
  @IsNotEmpty()
  apellidoPaterno!: string;

  @IsString()
  @IsNotEmpty()
  apellidoMaterno!: string;

  @IsString()
  @IsNotEmpty()
  nombres!: string;

  @IsOptional()
  @IsString()
  nroHistoriaClinica?: string;

  @IsString()
  @IsNotEmpty()
  procedencia!: string;

  @IsOptional()
  @IsString()
  transferido?: string;

  @IsString()
  @IsNotEmpty()
  lugarNacimiento!: string;

  // Una fecha sin hora ("1985-03-15") se ancla al día peruano para que
  // no se corra al día anterior al mostrarla en hora de Lima.
  @Transform(({ value }) =>
    typeof value === 'string' ? inicioDeDia(value) : (value as Date),
  )
  @IsDate()
  fechaNacimiento!: Date;

  /** Si se omite, se calcula a partir de la fecha de nacimiento. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(130)
  edad?: number;
}

export class SocioeconomicoDto {
  @IsNumber()
  @Min(0)
  ingresoEconomico!: number;

  @IsInt()
  @Min(-3)
  @Max(3)
  gradoDependencia!: number;

  @IsString()
  @IsNotEmpty()
  direccion!: string;

  @IsString()
  @IsNotEmpty()
  distrito!: string;
}

export class FamiliarConyugeDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(130)
  edad?: number;

  @IsOptional()
  @IsString()
  gradoInstruccion?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  ocupacion?: string;

  @IsOptional()
  @IsString()
  centroTrabajo?: string;
}

export class DatosFamiliaresDto {
  @IsOptional()
  @IsString()
  numeroHermanosHijos?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CreateTarjetaDto {
  @ValidateNested()
  @Type(() => PacienteDto)
  paciente!: PacienteDto;

  @IsEnum(GradoInstruccion)
  gradoInstruccion!: GradoInstruccion;

  @IsEnum(EstadoCivil)
  estadoCivil!: EstadoCivil;

  @IsEnum(Ocupacion)
  ocupacion!: Ocupacion;

  @ValidateNested()
  @Type(() => SocioeconomicoDto)
  socioeconomico!: SocioeconomicoDto;

  @IsEnum(Vivienda)
  vivienda!: Vivienda;

  @IsEnum(ServiciosBasicos)
  serviciosBasicos!: ServiciosBasicos;

  @IsOptional()
  @ValidateNested()
  @Type(() => FamiliarConyugeDto)
  padreConyuge?: FamiliarConyugeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FamiliarConyugeDto)
  madreConyuge?: FamiliarConyugeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DatosFamiliaresDto)
  datosFamiliares?: DatosFamiliaresDto;

  @IsOptional()
  @IsArray()
  @IsEnum(SaludFamiliar, { each: true })
  saludFamiliar?: SaludFamiliar[];

  @IsOptional()
  @IsString()
  dx?: string;

  @IsString()
  @IsNotEmpty()
  preDiagnosticoSocial!: string;
}
