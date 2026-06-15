import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter } from './schemas/counter.schema';

@Injectable()
export class CountersService {
  constructor(
    @InjectModel(Counter.name) private readonly counterModel: Model<Counter>,
  ) {}

  /** Siguiente valor de la secuencia, de forma atómica (seguro ante concurrencia). */
  async next(sequenceId: string): Promise<number> {
    const counter = await this.counterModel
      .findOneAndUpdate(
        { _id: sequenceId },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();
    return counter.seq;
  }
}
