import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRol } from '../schemas/user.schema';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserRol)
  rol!: UserRol;
}
