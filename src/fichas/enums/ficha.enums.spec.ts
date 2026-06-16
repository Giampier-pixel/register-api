import {
  GradoInstruccion, EstadoCivil, Aseguramiento, CondicionOcupacional,
  GradoDependenciaEconomica, TramoIngreso, Tenencia, MaterialConstruccion,
  ServiciosBasicos, EquipamientoHogar, FactorRiesgo, Categoria,
} from './ficha.enums';

describe('ficha.enums', () => {
  it('grado de instrucción tiene las 5 opciones del formato', () => {
    expect(Object.values(GradoInstruccion)).toEqual([
      'Iletrado', 'Primaria', 'Secundaria',
      'Superior Técnico', 'Superior Universitario',
    ]);
  });
  it('factores de riesgo tiene los 9 del formato', () => {
    expect(Object.values(FactorRiesgo)).toHaveLength(9);
  });
  it('categoría son A/B/C/Z', () => {
    expect(Object.values(Categoria)).toEqual(['A', 'B', 'C', 'Z']);
  });
});
