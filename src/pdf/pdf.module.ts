import { Module } from '@nestjs/common';
import { TarjetasModule } from '../tarjetas/tarjetas.module';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';

@Module({
  imports: [TarjetasModule],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule {}
