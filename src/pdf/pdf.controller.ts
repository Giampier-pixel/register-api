import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { TarjetasService } from '../tarjetas/tarjetas.service';
import { PdfService } from './pdf.service';

@ApiTags('Tarjetas')
@ApiBearerAuth()
@Controller('tarjetas')
export class PdfController {
  constructor(
    private readonly tarjetasService: TarjetasService,
    private readonly pdfService: PdfService,
  ) {}

  @Get(':id/pdf')
  @ApiOperation({
    summary:
      'Genera y descarga el PDF de la tarjeta al vuelo, sin almacenarlo (RF-030..034)',
  })
  async descargarPdf(
    @Param('id', ParseObjectIdPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const tarjeta = await this.tarjetasService.findEntity(id);
    const pdf = await this.pdfService.generarPdfTarjeta(tarjeta);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="tarjeta-${tarjeta.nroTarjetaSocial}.pdf"`,
    });
    return new StreamableFile(pdf);
  }
}
