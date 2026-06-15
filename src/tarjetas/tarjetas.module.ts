import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CountersService } from './counters.service';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { Tarjeta, TarjetaSchema } from './schemas/tarjeta.schema';
import { TarjetasController } from './tarjetas.controller';
import { TarjetasService } from './tarjetas.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tarjeta.name, schema: TarjetaSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [TarjetasController],
  providers: [TarjetasService, CountersService],
  exports: [TarjetasService],
})
export class TarjetasModule {}
