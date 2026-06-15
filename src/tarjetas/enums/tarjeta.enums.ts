/**
 * Opciones de selección de la ficha física de Trabajo Social
 * (Hospital "Daniel A. Carrión"). Los valores se almacenan tal como
 * se imprimen en la tarjeta.
 */

export enum GradoInstruccion {
  ILETRADO = 'Iletrado',
  PRIMARIA = 'Primaria',
  SECUNDARIA_COMPLETA = 'Secundaria Completa',
  SUPERIOR_TECNICO = 'Superior Técnico',
  SUPERIOR_UNIVERSIDAD = 'Superior Universidad',
}

export enum EstadoCivil {
  SOLTERO = 'Soltero',
  CONVIVIENTE = 'Conviviente',
  CASADO = 'Casado',
  VIUDO = 'Viudo',
  DIVORCIADO_SEPARADO = 'Divorciado / Separado',
}

export enum Ocupacion {
  TRABAJADOR_PROFESIONAL_INDEPENDIENTE = 'Trabajador Profesional / Independiente',
  TRABAJADOR_PROFESIONAL_DEPENDIENTE = 'Trabajador Profesional Dependiente',
  TECNICO_MANDO_MEDIO = 'Técnico / Mando Medio',
  TRABAJADOR_INFORMAL = 'Trabajador Informal',
  PENSIONISTA = 'Pensionista',
  SU_CASA = 'Su Casa',
  SIN_OCUPACION = 'Sin Ocupación',
  EVENTUAL = 'Eventual',
  PERMANENTE = 'Permanente',
}

export enum Vivienda {
  PROPIA = 'Propia',
  ALQUILADA = 'Alquilada',
  INVASION = 'Invasión',
  GUARDIANIA = 'Guardianía',
  ALOJADO = 'Alojado',
}

export enum ServiciosBasicos {
  COMPLETO = 'Completo',
  PARCIAL = 'Parcial',
  SIN_SERVICIOS_BASICOS = 'Sin Servicios Básicos',
}

export enum SaludFamiliar {
  DESNUTRICION = 'Desnutrición',
  TBC = 'TBC',
  ETS_SIDA = 'ETS / SIDA',
  INCAPACIDAD_FISICA_MENTAL = 'Incapacidad Física / Mental',
  PROSTITUCION = 'Prostitución',
  ANTECEDENTES_PENALES = 'Antecedentes Penales',
  FARMACO_DEPENDENCIA = 'Fármaco-Dependencia',
  ABANDONO_FAMILIAR = 'Abandono Familiar',
  VIOLENCIA_FAMILIAR = 'Violencia Familiar',
}
