import { UserRol } from '../../users/schemas/user.schema';

/** Contenido firmado dentro del JWT. */
export interface JwtPayload {
  /** id del usuario */
  sub: string;
  email: string;
  nombre: string;
  rol: UserRol;
}

/** Usuario adjuntado al request por el AuthGuard (verificado contra la BD). */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  nombre: string;
  rol: UserRol;
}
