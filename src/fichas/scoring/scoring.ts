import {
  Aseguramiento, CondicionOcupacional, Categoria, EquipamientoHogar,
  EstadoCivil, FactorRiesgo, GradoDependenciaEconomica, GradoInstruccion,
  MaterialConstruccion, ServiciosBasicos, Tenencia, TramoIngreso,
} from '../enums/ficha.enums';
import { PESOS, SMV, UmbralCategoria, umbralesCategoria } from './scoring.config';

export interface EntradaScoring {
  edad: number;
  gradoInstruccion: GradoInstruccion;
  estadoCivil: EstadoCivil;
  aseguramiento: Aseguramiento;
  condicionOcupacional: CondicionOcupacional;
  gradoDependenciaEconomica: GradoDependenciaEconomica;
  tramoIngreso: TramoIngreso;
  tenencia: Tenencia;
  materialConstruccion: MaterialConstruccion;
  nroMiembrosHogar: number;
  nroAmbientesDormir: number;
  serviciosBasicos: ServiciosBasicos;
  equipamientoHogar: EquipamientoHogar;
  factoresRiesgo: FactorRiesgo[];
}

export interface ResultadoScoring {
  puntajeBasico: number;
  categoria: Categoria;
  desglose: Record<string, number>;
}

export function tramoEdadPeso(edad: number): number {
  if (edad <= 18) return 5;
  if (edad <= 64) return 0;
  return 3;
}

export function tramoHacinamientoPeso(miembros: number, ambientes: number): number {
  const ratio = ambientes > 0 ? miembros / ambientes : miembros;
  if (ratio < 3) return 0;
  if (ratio === 3) return 3;
  return 5;
}

export function tramoRiesgoPeso(cantidad: number): number {
  if (cantidad === 0) return 0;
  if (cantidad <= 2) return 3;
  return 5;
}

export function sugerirTramoIngreso(ingresoFamiliar: number, smv = SMV): TramoIngreso {
  if (ingresoFamiliar <= 0) return TramoIngreso.NINGUNA;
  const x = ingresoFamiliar / smv;
  if (x < 1) return TramoIngreso.MENOS_1_SMV;
  if (x <= 2) return TramoIngreso.DE_1_A_2_SMV;
  if (x <= 3) return TramoIngreso.DE_2_A_3_SMV;
  if (x <= 4) return TramoIngreso.DE_3_A_4_SMV;
  return TramoIngreso.MAS_DE_SMV;
}

export function categoriaDesdePuntaje(
  puntaje: number,
  umbrales: UmbralCategoria[] = umbralesCategoria(),
): Categoria {
  const ordenados = [...umbrales].sort((a, b) => a.max - b.max);
  for (const u of ordenados) if (puntaje <= u.max) return u.categoria;
  return ordenados[ordenados.length - 1].categoria;
}

export function calcularPuntajes(
  e: EntradaScoring,
  umbrales: UmbralCategoria[] = umbralesCategoria(),
): ResultadoScoring {
  const desglose: Record<string, number> = {
    edad: tramoEdadPeso(e.edad),
    gradoInstruccion: PESOS.gradoInstruccion[e.gradoInstruccion] ?? 0,
    estadoCivil: PESOS.estadoCivil[e.estadoCivil] ?? 0,
    aseguramiento: PESOS.aseguramiento[e.aseguramiento] ?? 0,
    condicionOcupacional: PESOS.condicionOcupacional[e.condicionOcupacional] ?? 0,
    gradoDependenciaEconomica:
      PESOS.gradoDependenciaEconomica[e.gradoDependenciaEconomica] ?? 0,
    tramoIngreso: PESOS.tramoIngreso[e.tramoIngreso] ?? 0,
    tenencia: PESOS.tenencia[e.tenencia] ?? 0,
    materialConstruccion: PESOS.materialConstruccion[e.materialConstruccion] ?? 0,
    hacinamiento: tramoHacinamientoPeso(e.nroMiembrosHogar, e.nroAmbientesDormir),
    serviciosBasicos: PESOS.serviciosBasicos[e.serviciosBasicos] ?? 0,
    equipamientoHogar: PESOS.equipamientoHogar[e.equipamientoHogar] ?? 0,
    factoresRiesgo: tramoRiesgoPeso(e.factoresRiesgo?.length ?? 0),
  };
  const puntajeBasico = Object.values(desglose).reduce((a, b) => a + b, 0);
  return { puntajeBasico, categoria: categoriaDesdePuntaje(puntajeBasico, umbrales), desglose };
}
