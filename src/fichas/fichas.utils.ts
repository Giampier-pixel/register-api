/** Zona horaria del hospital (Perú no tiene horario de verano). */
export const OFFSET_PERU = '-05:00';

export const esSoloFecha = (valor: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(valor);

/**
 * Una fecha sin hora se ancla al día peruano, sin importar la zona
 * horaria del servidor; un ISO completo se respeta tal cual.
 */
export function inicioDeDia(fecha: string): Date {
  return esSoloFecha(fecha)
    ? new Date(`${fecha}T00:00:00.000${OFFSET_PERU}`)
    : new Date(fecha);
}

export function finDeDia(fecha: string): Date {
  return esSoloFecha(fecha)
    ? new Date(`${fecha}T23:59:59.999${OFFSET_PERU}`)
    : new Date(fecha);
}

export function calcularEdad(fechaNacimiento: Date): number {
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mes = hoy.getMonth() - fechaNacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }
  return Math.max(0, edad);
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Patrón que ignora tildes y diéresis en ambas direcciones:
 * "perez" encuentra "Pérez" y "pérez" encuentra "Perez".
 * El resultado se evalúa en MongoDB (PCRE2), que no entiende la
 * sintaxis \uXXXX: los escapes de abajo son de JS, así el patrón
 * lleva los caracteres combinantes reales.
 */
export function regexInsensibleAcentos(value: string): string {
  const clases: Record<string, string> = {
    a: '[aáàäâã]',
    e: '[eéèëê]',
    i: '[iíìïî]',
    o: '[oóòöôõ]',
    u: '[uúùüû]',
    n: '[nñ]',
    c: '[cç]',
  };
  const sinAcentos = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return escapeRegex(sinAcentos).replace(
    /[aeiounc]/gi,
    // sufijo opcional por si el dato quedó almacenado en forma NFD
    (letra) => `${clases[letra.toLowerCase()]}[\u0300-\u036f]?`,
  );
}
