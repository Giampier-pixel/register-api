import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FichaSocial, FichaSocialSchema } from './schemas/ficha.schema';
import { FichasService } from './fichas.service';
import { FichasController } from './fichas.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FichaSocial.name, schema: FichaSocialSchema },
    ]),
  ],
  controllers: [FichasController],
  providers: [FichasService],
})
export class FichasModule {}
