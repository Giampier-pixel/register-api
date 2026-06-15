import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/** El admin puede modificar nombre, correo, rol y/o restablecer la contraseña. */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
