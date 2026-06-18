// src/fichas/dto/query-fichas.dto.ts
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Categoria } from '../enums/ficha.enums';

export class QueryFichasDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(Categoria) categoria?: Categoria;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaDesde debe tener formato YYYY-MM-DD',
  })
  fechaDesde?: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaHasta debe tener formato YYYY-MM-DD',
  })
  fechaHasta?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : value === 'true' || value === true,
  )
  activa?: boolean;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page = 1;
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}
