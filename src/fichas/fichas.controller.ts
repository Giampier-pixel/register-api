import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { generarFichaPdf } from '../pdf/ficha-pdf';
import { CreateFichaDto } from './dto/create-ficha.dto';
import { PreviewPuntajeDto } from './dto/preview-puntaje.dto';
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

  @Post('preview-puntaje')
  @ApiOperation({ summary: 'Calcula puntaje/categoría sin guardar (preview en vivo)' })
  previewPuntaje(@Body() dto: PreviewPuntajeDto) {
    return this.fichasService.previewPuntaje(dto);
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
  @ApiOperation({
    summary: 'Generar el PDF de la ficha social (fiel al formato oficial)',
  })
  @Header('Content-Type', 'application/pdf')
  async pdf(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<StreamableFile> {
    const ficha = await this.fichasService.findOne(id);
    const bytes = await generarFichaPdf(
      ficha as unknown as Parameters<typeof generarFichaPdf>[0],
    );
    return new StreamableFile(Buffer.from(bytes), {
      type: 'application/pdf',
      disposition: `inline; filename="ficha-${ficha.nroFichaSocial}.pdf"`,
    });
  }
}
