import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum UserRol {
  ADMIN = 'ADMIN',
  TRABAJADOR_SOCIAL = 'TRABAJADOR_SOCIAL',
}

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: 'users',
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret.passwordHash;
      delete ret._id;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ type: String, required: true, enum: UserRol })
  rol!: UserRol;

  @Prop({ default: true })
  activo!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
