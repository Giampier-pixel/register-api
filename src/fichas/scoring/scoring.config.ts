// src/fichas/scoring/scoring.config.ts
import {
  Aseguramiento, CondicionOcupacional, Categoria, EquipamientoHogar,
  EstadoCivil, GradoDependenciaEconomica, GradoInstruccion,
  MaterialConstruccion, ServiciosBasicos, Tenencia, TramoIngreso,
} from '../enums/ficha.enums';

export const PESOS = {
  gradoInstruccion: {
    [GradoInstruccion.ILETRADO]: 5,
    [GradoInstruccion.PRIMARIA]: 4,
    [GradoInstruccion.SECUNDARIA]: 3,
    [GradoInstruccion.SUPERIOR_TECNICO]: 2,
    [GradoInstruccion.SUPERIOR_UNIVERSITARIO]: 1,
  },
  estadoCivil: {
    [EstadoCivil.SOLTERO]: 0,
    [EstadoCivil.CONVIVIENTE_CASADO]: 3,
    [EstadoCivil.VIUDO]: 5,
    [EstadoCivil.DIVORCIADO_SEPARADO]: 4,
  },
  aseguramiento: {
    [Aseguramiento.SI]: 0,
    [Aseguramiento.NO]: 5,
    [Aseguramiento.ES_SALUD]: 0,
    [Aseguramiento.OTRO]: 0,
  },
  condicionOcupacional: {
    [CondicionOcupacional.PROFESIONAL_INDEPENDIENTE]: 0,
    [CondicionOcupacional.PROFESIONAL_DEPENDIENTE]: 1,
    [CondicionOcupacional.TECNICO_MANDO_MEDIO]: 2,
    [CondicionOcupacional.TRABAJADOR_INFORMAL]: 3,
    [CondicionOcupacional.EVENTUAL]: 5,
    [CondicionOcupacional.PENSIONISTA]: 4,
    [CondicionOcupacional.SU_CASA]: 5,
    [CondicionOcupacional.PERMANENTE]: 0,
    [CondicionOcupacional.SIN_OCUPACION]: 6,
  },
  gradoDependenciaEconomica: {
    [GradoDependenciaEconomica.HASTA_3]: 1,
    [GradoDependenciaEconomica.MAS_DE_3]: 5,
  },
  tramoIngreso: {
    [TramoIngreso.NINGUNA]: 5,
    [TramoIngreso.MENOS_1_SMV]: 4,
    [TramoIngreso.DE_1_A_2_SMV]: 3,
    [TramoIngreso.DE_2_A_3_SMV]: 2,
    [TramoIngreso.DE_3_A_4_SMV]: 1,
    [TramoIngreso.MAS_DE_SMV]: 0,
  },
  tenencia: {
    [Tenencia.PROPIA]: 1,
    [Tenencia.ALQUILADA]: 2,
    [Tenencia.INVASION]: 3,
    [Tenencia.GUARDIANIA]: 4,
    [Tenencia.ALOJADO]: 5,
  },
  materialConstruccion: {
    [MaterialConstruccion.NOBLE_ACABADO]: 1,
    [MaterialConstruccion.NOBLE_SIN_ACABAR]: 2,
    [MaterialConstruccion.MIXTO]: 3,
    [MaterialConstruccion.RUSTICO]: 4,
    [MaterialConstruccion.PRECARIO]: 5,
  },
  serviciosBasicos: {
    [ServiciosBasicos.COMPLETO]: 0,
    [ServiciosBasicos.PARCIAL]: 3,
    [ServiciosBasicos.SIN_SERVICIOS]: 5,
  },
  equipamientoHogar: {
    [EquipamientoHogar.NO_CUENTA]: 5,
    [EquipamientoHogar.DE_1_A_2]: 3,
    [EquipamientoHogar.DE_3_A_MAS]: 0,
  },
} as const;

export interface UmbralCategoria {
  categoria: Categoria;
  max: number; // puntaje máximo (inclusive) para esta categoría
}

const UMBRALES_DEFAULT: UmbralCategoria[] = [
  { categoria: Categoria.A, max: 18 },
  { categoria: Categoria.B, max: 36 },
  { categoria: Categoria.C, max: 54 },
  { categoria: Categoria.Z, max: Number.MAX_SAFE_INTEGER },
];

export function umbralesCategoria(): UmbralCategoria[] {
  const raw = process.env.SCORING_UMBRALES_CATEGORIA;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as UmbralCategoria[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      /* JSON inválido → usa default */
    }
  }
  return UMBRALES_DEFAULT;
}

/** Sueldo Mínimo Vital (Perú), para sugerir el tramo de ingreso. */
export const SMV = Number(process.env.SMV ?? 1130);
