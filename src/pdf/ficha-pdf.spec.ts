import { generarFichaPdf, FichaLike } from './ficha-pdf';

const fichaCompleta: FichaLike = {
  nroFichaSocial: 42,
  servicio: '529-B',
  paciente: {
    apellidoPaterno: 'Pérez', apellidoMaterno: 'Huamán', nombres: 'Juan Carlos',
    nroHistoriaClinica: 'HC-2026-0042', procedencia: 'Huancayo',
    lugarNacimiento: 'Huancayo', fechaNacimiento: new Date('1985-03-15T05:00:00Z'), edad: 41,
  },
  gradoInstruccion: 'Secundaria', estadoCivil: 'Soltero', aseguramiento: 'No',
  condicionOcupacional: 'Trabajador Informal', ocupacion: 'Agricultor',
  direccion: 'Jr. Los Andes', telefono: '987654321',
  personaAcompana: { nombre: 'Herlinda', direccion: 'Jr. Los Andes', telefono: '912' },
  composicionFamiliar: [
    { nombresApellidos: 'Fredy Pérez', parentesco: 'Hijo', edad: 50, gradoInstruccion: 'Secundaria', esAsegurado: true, ocupacion: 'Docente', ingreso: 1600, observaciones: 'x' },
  ],
  gradoDependenciaEconomica: 'Hasta 3 miembros',
  ingresosGastos: { ingresoFamiliar: 900, gastoAlimentacion: 400 },
  tramoIngreso: 'Menos de 1 SMV',
  vivienda: { tenencia: 'Propia', materialConstruccion: 'Rústico', nroMiembrosHogar: 1, nroAmbientesDormir: 1, serviciosBasicos: 'Parcial' },
  equipamientoHogar: '1 a 2',
  factoresRiesgoTexto: 'Estudio social', factoresRiesgo: ['Tuberculosis', 'Prostitución'],
  puntajes: { puntajeBasico: 36, puntajeEstudioSocial: undefined, categoria: 'B' },
  trabajadoraSocial: 'Lic. María Quispe', fechaInscripcion: new Date('2026-06-15T05:00:00Z'),
};

const fichaMinima: FichaLike = {
  nroFichaSocial: 1,
  paciente: {
    apellidoPaterno: 'A', apellidoMaterno: 'B', nombres: 'C', procedencia: 'X',
    lugarNacimiento: 'Y', fechaNacimiento: new Date('2000-01-01T05:00:00Z'), edad: 26,
  },
  gradoInstruccion: 'Primaria', estadoCivil: 'Soltero', aseguramiento: 'Sí',
  condicionOcupacional: 'Su casa',
  composicionFamiliar: [],
  gradoDependenciaEconomica: 'Hasta 3 miembros',
  tramoIngreso: 'Ninguna',
  vivienda: { tenencia: 'Propia', materialConstruccion: 'Mixto', nroMiembrosHogar: 1, nroAmbientesDormir: 1, serviciosBasicos: 'Completo' },
  equipamientoHogar: '3 a más',
  factoresRiesgo: [],
  puntajes: { puntajeBasico: 7, categoria: 'A' },
  trabajadoraSocial: 'Lic. X', fechaInscripcion: new Date('2026-06-01T05:00:00Z'),
};

const esPdf = (b: Uint8Array) =>
  b.length > 1000 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; // %PDF

describe('generarFichaPdf', () => {
  it('genera un PDF válido para una ficha completa', async () => {
    const bytes = await generarFichaPdf(fichaCompleta);
    expect(esPdf(bytes)).toBe(true);
  });
  it('no se cae con opcionales vacíos (familia vacía, sin ingresosGastos/personaAcompana)', async () => {
    const bytes = await generarFichaPdf(fichaMinima);
    expect(esPdf(bytes)).toBe(true);
  });
});
