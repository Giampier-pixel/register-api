import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
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

class ViviendaPreviewDto {
  @IsOptional() @IsEnum(Tenencia) tenencia?: Tenencia;
  @IsOptional() @IsEnum(MaterialConstruccion) materialConstruccion?: MaterialConstruccion;
  @IsOptional() @IsInt() @Min(0) nroMiembrosHogar?: number;
  @IsOptional() @IsInt() @Min(1) nroAmbientesDormir?: number;
  @IsOptional() @IsEnum(ServiciosBasicos) serviciosBasicos?: ServiciosBasicos;
}

export class PreviewPuntajeDto {
  @IsOptional() @IsInt() @Min(0) edad?: number;
  @IsOptional() @IsEnum(GradoInstruccion) gradoInstruccion?: GradoInstruccion;
  @IsOptional() @IsEnum(EstadoCivil) estadoCivil?: EstadoCivil;
  @IsOptional() @IsEnum(Aseguramiento) aseguramiento?: Aseguramiento;
  @IsOptional() @IsEnum(CondicionOcupacional) condicionOcupacional?: CondicionOcupacional;
  @IsOptional() @IsEnum(GradoDependenciaEconomica) gradoDependenciaEconomica?: GradoDependenciaEconomica;
  @IsOptional() @IsEnum(TramoIngreso) tramoIngreso?: TramoIngreso;
  @IsOptional() @ValidateNested() @Type(() => ViviendaPreviewDto) vivienda?: ViviendaPreviewDto;
  @IsOptional() @IsEnum(EquipamientoHogar) equipamientoHogar?: EquipamientoHogar;
  @IsOptional() @IsArray() @IsEnum(FactorRiesgo, { each: true }) factoresRiesgo?: FactorRiesgo[];
}
