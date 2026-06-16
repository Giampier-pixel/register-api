import {
  tramoEdadPeso, tramoHacinamientoPeso, tramoRiesgoPeso,
  sugerirTramoIngreso, categoriaDesdePuntaje, calcularPuntajes,
  EntradaScoring,
} from './scoring';
import {
  Aseguramiento, CondicionOcupacional, Categoria, EquipamientoHogar,
  EstadoCivil, FactorRiesgo, GradoDependenciaEconomica, GradoInstruccion,
  MaterialConstruccion, ServiciosBasicos, Tenencia, TramoIngreso,
} from '../enums/ficha.enums';

describe('tramos derivados', () => {
  it('edad: ≤18→5, 19-64→0, 65+→3', () => {
    expect(tramoEdadPeso(18)).toBe(5);
    expect(tramoEdadPeso(40)).toBe(0);
    expect(tramoEdadPeso(65)).toBe(3);
  });
  it('hacinamiento por miembros/ambientes: <3→0, =3→3, >3→5', () => {
    expect(tramoHacinamientoPeso(2, 1)).toBe(0); // ratio 2
    expect(tramoHacinamientoPeso(3, 1)).toBe(3); // ratio 3
    expect(tramoHacinamientoPeso(7, 2)).toBe(5); // ratio 3.5
  });
  it('riesgo por cantidad: 0→0, 1-2→3, 3+→5', () => {
    expect(tramoRiesgoPeso(0)).toBe(0);
    expect(tramoRiesgoPeso(2)).toBe(3);
    expect(tramoRiesgoPeso(3)).toBe(5);
  });
});

describe('sugerirTramoIngreso (SMV=1130)', () => {
  it('0 → Ninguna; 1000 → <1 SMV; 2000 → 1-2 SMV', () => {
    expect(sugerirTramoIngreso(0, 1130)).toBe(TramoIngreso.NINGUNA);
    expect(sugerirTramoIngreso(1000, 1130)).toBe(TramoIngreso.MENOS_1_SMV);
    expect(sugerirTramoIngreso(2000, 1130)).toBe(TramoIngreso.DE_1_A_2_SMV);
  });
});

describe('categoriaDesdePuntaje (umbrales default)', () => {
  const u = [
    { categoria: Categoria.A, max: 18 },
    { categoria: Categoria.B, max: 36 },
    { categoria: Categoria.C, max: 54 },
    { categoria: Categoria.Z, max: Number.MAX_SAFE_INTEGER },
  ];
  it('respeta los cortes y el ancla 36 → B', () => {
    expect(categoriaDesdePuntaje(0, u)).toBe(Categoria.A);
    expect(categoriaDesdePuntaje(18, u)).toBe(Categoria.A);
    expect(categoriaDesdePuntaje(19, u)).toBe(Categoria.B);
    expect(categoriaDesdePuntaje(36, u)).toBe(Categoria.B);
    expect(categoriaDesdePuntaje(55, u)).toBe(Categoria.Z);
  });
});

describe('calcularPuntajes', () => {
  const base: EntradaScoring = {
    edad: 40,
    gradoInstruccion: GradoInstruccion.SECUNDARIA, // 3
    estadoCivil: EstadoCivil.SOLTERO, // 0
    aseguramiento: Aseguramiento.NO, // 5
    condicionOcupacional: CondicionOcupacional.TRABAJADOR_INFORMAL, // 3
    gradoDependenciaEconomica: GradoDependenciaEconomica.HASTA_3, // 1
    tramoIngreso: TramoIngreso.MENOS_1_SMV, // 4
    tenencia: Tenencia.PROPIA, // 1
    materialConstruccion: MaterialConstruccion.RUSTICO, // 4
    nroMiembrosHogar: 1,
    nroAmbientesDormir: 1, // ratio 1 → 0
    serviciosBasicos: ServiciosBasicos.PARCIAL, // 3
    equipamientoHogar: EquipamientoHogar.DE_1_A_2, // 3
    factoresRiesgo: [FactorRiesgo.TUBERCULOSIS, FactorRiesgo.PROSTITUCION], // 2 → 3
  };

  it('suma todos los pesos y deriva la categoría', () => {
    const r = calcularPuntajes(base);
    // edad0 + 3 + 0 + 5 + 3 + 1 + 4 + 1 + 4 + hacin0 + 3 + 3 + riesgo3 = 30
    expect(r.puntajeBasico).toBe(30);
    expect(r.categoria).toBe(Categoria.B);
    expect(r.desglose.gradoInstruccion).toBe(3);
    expect(r.desglose.factoresRiesgo).toBe(3);
  });
});
