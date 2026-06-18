import {
  Body,
  Controller,
  Delete,
  Get,
  NotImplementedException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateFichaDto } from './dto/create-ficha.dto';
import { QueryFichasDto } from './dto/query-fichas.dto';
import { UpdateFichaDto } from './dto/update-ficha.dto';
import { FichasService } from './fichas.service';

@ApiTags('Fichas')
@ApiBearerAuth()
@Controller('fichas')
export class FichasController {
  constructor(private readonly fichasService: FichasService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar ficha social; asigna folio y asistente social',
  })
  create(@Body() dto: CreateFichaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.fichasService.create(dto, {
      id: user.userId,
      nombre: user.nombre,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listado paginado con búsqueda y filtros' })
  findAll(@Query() query: QueryFichasDto) {
    return this.fichasService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle completo de una ficha social' })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.fichasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar ficha social; registra usuario y fecha' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateFichaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.fichasService.update(id, dto, {
      id: user.userId,
      nombre: user.nombre,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar ficha social — soft delete' })
  deactivate(@Param('id', ParseObjectIdPipe) id: string) {
    return this.fichasService.deactivate(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Reactivar una ficha social desactivada' })
  activate(@Param('id', ParseObjectIdPipe) id: string) {
    return this.fichasService.activate(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generar PDF de ficha social (sub-proyecto 3)' })
  pdf() {
    throw new NotImplementedException('PDF en construcción (sub-proyecto 3)');
  }
}
