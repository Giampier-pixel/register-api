import { PartialType } from '@nestjs/swagger';
import { CreateTarjetaDto } from './create-tarjeta.dto';

/**
 * Actualización parcial a nivel de sección: cada sección enviada
 * reemplaza por completo a la existente (el formulario de edición
 * siempre envía secciones completas).
 */
export class UpdateTarjetaDto extends PartialType(CreateTarjetaDto) {}
