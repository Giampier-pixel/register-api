import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryTarjetasDto {
  /** Nombre/apellidos del paciente, Nº Tarjeta Social o Nº Historia Clínica (RF-022) */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Fecha de inscripción desde (RF-023). Una fecha sin hora
   * ("2026-06-10") se interpreta como día completo en hora de Perú.
   */
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  /** Fecha de inscripción hasta, inclusive (RF-023) */
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  /** Filtro por estado; si se omite se devuelven todas (RF-023) */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
