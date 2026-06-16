// src/fichas/dto/query-fichas.dto.ts
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Categoria } from '../enums/ficha.enums';

export class QueryFichasDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(Categoria) categoria?: Categoria;
  @IsOptional() @IsDateString() fechaDesde?: string;
  @IsOptional() @IsDateString() fechaHasta?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === 'true' || value === true))
  activa?: boolean;

  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1)
  page = 1;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100)
  limit = 10;
}
