import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateTarjetaDto } from './dto/create-tarjeta.dto';
import { QueryTarjetasDto } from './dto/query-tarjetas.dto';
import { UpdateTarjetaDto } from './dto/update-tarjeta.dto';
import { TarjetasService } from './tarjetas.service';

@ApiTags('Tarjetas')
@ApiBearerAuth()
@Controller('tarjetas')
export class TarjetasController {
  constructor(private readonly tarjetasService: TarjetasService) {}

  @Post()
  @ApiOperation({
    summary:
      'Registrar tarjeta; asigna folio, fecha de inscripción y asistente social (RF-010..013)',
  })
  create(
    @Body() dto: CreateTarjetaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tarjetasService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Listado paginado con búsqueda y filtros (RF-020..023)',
  })
  findAll(@Query() query: QueryTarjetasDto) {
    return this.tarjetasService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle completo de una tarjeta (RF-024)' })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.tarjetasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Editar tarjeta; registra usuario y fecha (RF-014)',
  })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateTarjetaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tarjetasService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar tarjeta — soft delete (RF-015)' })
  deactivate(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tarjetasService.deactivate(id, user);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Reactivar una tarjeta desactivada' })
  activate(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tarjetasService.activate(id, user);
  }
}
