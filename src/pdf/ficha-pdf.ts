import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';

// ---- Tipo estructural de lo que el PDF lee (no importa el doc Mongoose) ----
export interface MiembroLike {
  nombresApellidos: string; parentesco?: string; edad?: number; gradoInstruccion?: string;
  esAsegurado?: boolean; ocupacion?: string; ingreso?: number; observaciones?: string;
}
export interface FichaLike {
  nroFichaSocial: number; servicio?: string;
  paciente: {
    apellidoPaterno: string; apellidoMaterno: string; nombres: string;
    nroHistoriaClinica?: string; procedencia: string; lugarNacimiento: string;
    fechaNacimiento: Date | string; edad: number;
  };
  gradoInstruccion: string; estadoCivil: string; aseguramiento: string; aseguramientoOtro?: string;
  ocupacion?: string; condicionOcupacional: string; direccion?: string; telefono?: string;
  personaAcompana?: { nombre?: string; direccion?: string; telefono?: string };
  composicionFamiliar: MiembroLike[]; gradoDependenciaEconomica: string;
  ingresosGastos?: Record<string, number | undefined>; tramoIngreso: string;
  vivienda: { tenencia: string; materialConstruccion: string; nroMiembrosHogar: number; nroAmbientesDormir: number; serviciosBasicos: string };
  equipamientoHogar: string;
  factoresRiesgoTexto?: string; factoresRiesgo: string[];
  puntajes: { puntajeBasico: number; puntajeEstudioSocial?: number; categoria: string };
  trabajadoraSocial: string; fechaInscripcion: Date | string;
}

const A4 = { w: 595.28, h: 841.89 };
const NEGRO = rgb(0, 0, 0);

// Lienzo: coordenadas con y DESDE ARRIBA (más cómodo). Convierte a las de pdf-lib.
class Lienzo {
  constructor(
    public page: PDFPage,
    public font: PDFFont,
    public bold: PDFFont,
  ) {}
  private Y(yTop: number) { return A4.h - yTop; }

  texto(x: number, yTop: number, s: string, o: { size?: number; bold?: boolean } = {}) {
    const size = o.size ?? 8;
    this.page.drawText(s ?? '', { x, y: this.Y(yTop) - size, size, font: o.bold ? this.bold : this.font, color: NEGRO });
  }
  linea(x1: number, yTop: number, x2: number) {
    this.page.drawLine({ start: { x: x1, y: this.Y(yTop) }, end: { x: x2, y: this.Y(yTop) }, thickness: 0.6, color: NEGRO });
  }
  caja(x: number, yTop: number, w: number, h: number) {
    this.page.drawRectangle({ x, y: this.Y(yTop) - h, width: w, height: h, borderColor: NEGRO, borderWidth: 0.6 });
  }
  // etiqueta + valor con línea de subrayado: "Label: valor______"
  campo(x: number, yTop: number, label: string, valor: string | number | undefined, anchoLinea: number) {
    this.texto(x, yTop, label, { bold: true });
    const lx = x + this.bold.widthOfTextAtSize(label, 8) + 3;
    this.texto(lx, yTop, valor != null ? String(valor) : '');
    this.linea(lx, yTop + 1.5, lx + anchoLinea);
  }
  // opción tipo "Label ( ) ②" con ✕ si marcada
  opcion(x: number, yTop: number, label: string, marcada: boolean, peso?: number): number {
    this.texto(x, yTop, label);
    const bx = x + this.font.widthOfTextAtSize(label, 8) + 4;
    this.caja(bx, yTop - 6.5, 8, 8);
    if (marcada) this.texto(bx + 1, yTop, 'X', { bold: true });
    let fin = bx + 11;
    if (peso !== undefined) { this.texto(fin, yTop, `(${peso})`); fin += this.font.widthOfTextAtSize(`(${peso})`, 8) + 4; }
    return fin; // x donde termina, por si encadenas
  }
}

const fmtFecha = (d: Date | string | undefined): string => {
  if (!d) return '';
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Lima' }).format(new Date(d));
};

export async function generarFichaPdf(f: FichaLike): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([A4.w, A4.h]);
  let L = new Lienzo(page, font, bold);
  const M = 28; // margen
  let y = 34;

  // ---- Encabezado ----
  L.texto(M, y, 'HOSPITAL NACIONAL DEL CENTRO', { bold: true, size: 8 });
  L.texto(M, y + 9, '"DANIEL ALCIDES CARRIÓN" — HUANCAYO', { bold: true, size: 8 });
  L.texto(A4.w / 2 - 55, y + 2, 'FICHA SOCIAL', { bold: true, size: 18 });
  L.campo(A4.w - 200, y, 'Nº de Ficha Social:', f.nroFichaSocial, 70);
  L.campo(A4.w - 200, y + 11, 'H. Clínica:', f.paciente.nroHistoriaClinica, 95);
  y += 26;
  L.campo(M, y, 'Servicio:', f.servicio, 150);
  y += 14;

  // ---- I. DATOS GENERALES ----
  L.texto(M, y, 'I.- DATOS GENERALES', { bold: true, size: 9 });
  L.linea(M, y + 11, A4.w - M); y += 16;
  L.campo(M, y, 'Nombres y Apellidos:', `${f.paciente.apellidoPaterno} ${f.paciente.apellidoMaterno}, ${f.paciente.nombres}`, 330); y += 13;
  L.campo(M, y, 'Lugar y Fecha de Nacimiento:', `${f.paciente.lugarNacimiento}   ${fmtFecha(f.paciente.fechaNacimiento)}`, 300); y += 14;

  // Edad + tramo (derivado de edad)
  const edad = f.paciente.edad;
  L.campo(M, y, 'Edad:', edad, 30);
  L.opcion(M + 70, y, '0-18', edad <= 18, 5);
  L.opcion(M + 130, y, '19-64', edad >= 19 && edad <= 64, 0);
  L.opcion(M + 200, y, '65+', edad >= 65, 3);
  y += 14;

  // Grado de Instrucción (columna izq) y Estado Civil (columna der)
  L.texto(M, y, 'Grado de Instrucción', { bold: true });
  L.texto(220, y, 'Estado Civil', { bold: true });
  L.texto(390, y, '¿Está Asegurado?', { bold: true }); y += 11;
  const gi: [string, number][] = [['Iletrado',5],['Primaria',4],['Secundaria',3],['Superior Técnico',2],['Superior Universitario',1]];
  gi.forEach(([lab, p], i) => L.opcion(M, y + i * 11, lab, f.gradoInstruccion === lab, p));
  const ec: [string, number][] = [['Soltero',0],['Conviviente/Casado',3],['Viudo',5],['Divorciado/Separado',4]];
  ec.forEach(([lab, p], i) => L.opcion(220, y + i * 11, lab, f.estadoCivil === lab, p));
  L.opcion(390, y, 'Sí', f.aseguramiento === 'Sí', 0);
  L.opcion(440, y, 'No', f.aseguramiento === 'No', 5);
  L.opcion(390, y + 11, 'EsSalud', f.aseguramiento === 'EsSalud');
  L.opcion(390, y + 22, 'Otro', f.aseguramiento === 'Otro');
  L.campo(390, y + 36, 'Procedencia:', f.paciente.procedencia, 120);
  y += 5 * 11 + 6;

  // Ocupación
  L.campo(M, y, 'Ocupación:', f.ocupacion, 150); y += 12;
  const oc: [string, number][] = [
    ['Profesional/Independiente',0],['Profesional/Dependiente',1],['Técnico Mando Medio',2],
    ['Trabajador Informal',3],['Eventual',5],['Pensionista',4],['Su casa',5],['Permanente',0],['Sin ocupación',6],
  ];
  oc.forEach(([lab, p], i) => { const col = i % 3; const row = Math.floor(i / 3); L.opcion(M + col * 175, y + row * 11, lab, f.condicionOcupacional === lab, p); });
  y += 3 * 11 + 4;
  L.campo(M, y, 'Dirección:', f.direccion, 230); L.campo(330, y, 'Telf.:', f.telefono, 90); y += 12;
  L.campo(M, y, 'Persona que acompaña:', f.personaAcompana?.nombre, 260); y += 14;

  // ---- II. COMPOSICIÓN FAMILIAR ----
  L.texto(M, y, 'II.- COMPOSICIÓN FAMILIAR', { bold: true, size: 9 });
  L.linea(M, y + 11, A4.w - M); y += 16;

  const colsFam: [string, number][] = [
    ['Nombres y Apellidos', 105], ['Parentesco', 60], ['Edad', 28], ['G. de Inst.', 55],
    ['Es asegurado', 50], ['Ocupación', 65], ['Ingreso', 45], ['Observaciones', 60],
  ];
  const anchoTablaFam = colsFam.reduce((s, [, w]) => s + w, 0);
  const filaAltoFam = 12;
  const filasMinFam = 6;
  const filasFam = Math.max(filasMinFam, f.composicionFamiliar.length);

  const dibujarCabeceraFam = (yy: number) => {
    let cx = M;
    colsFam.forEach(([lab, w]) => { L.texto(cx + 2, yy + 8, lab, { bold: true, size: 7 }); cx += w; });
    L.caja(M, yy, anchoTablaFam, filaAltoFam);
    return yy + filaAltoFam;
  };
  const dibujarFilaFam = (yy: number, m: MiembroLike | undefined) => {
    let cx = M;
    const valores = [
      m?.nombresApellidos ?? '', m?.parentesco ?? '', m?.edad != null ? String(m.edad) : '',
      m?.gradoInstruccion ?? '', m ? (m.esAsegurado ? 'Sí' : 'No') : '', m?.ocupacion ?? '',
      m?.ingreso != null ? String(m.ingreso) : '', m?.observaciones ?? '',
    ];
    colsFam.forEach(([, w], i) => { L.texto(cx + 2, yy + 8, valores[i], { size: 7 }); cx += w; });
    L.caja(M, yy, anchoTablaFam, filaAltoFam);
    return yy + filaAltoFam;
  };

  y = dibujarCabeceraFam(y);
  for (let i = 0; i < filasFam; i++) {
    if (y + filaAltoFam > A4.h - 40) {
      // overflow: continuar en una segunda página
      page = doc.addPage([A4.w, A4.h]);
      L = new Lienzo(page, font, bold);
      y = 34;
      L.texto(M, y, 'II.- COMPOSICIÓN FAMILIAR (continuación)', { bold: true, size: 9 });
      y += 16;
      y = dibujarCabeceraFam(y);
    }
    y = dibujarFilaFam(y, f.composicionFamiliar[i]);
  }
  y += 8;

  L.texto(M, y, 'Grado Dependencia Económica', { bold: true }); y += 11;
  const gde: [string, number][] = [['Hasta 3 miembros', 1], ['Más de 3 miembros', 5]];
  gde.forEach(([lab, p], i) => L.opcion(M + i * 150, y, lab, f.gradoDependenciaEconomica === lab, p));
  y += 16;

  // ---- III. INGRESO ECONÓMICO / GASTO FAMILIAR ----
  L.texto(M, y, 'III.- INGRESO ECONÓMICO / GASTO FAMILIAR', { bold: true, size: 9 });
  L.linea(M, y + 11, A4.w - M); y += 16;

  const ig = f.ingresosGastos ?? {};
  L.campo(M, y, 'Ingreso Familiar:', ig.ingresoFamiliar, 60);
  L.campo(M + 140, y, 'Ayudas/Apoyos:', ig.ayudasApoyos, 60);
  L.campo(M + 280, y, 'Rentas:', ig.rentas, 60);
  L.campo(M + 400, y, 'Otros Ingresos:', ig.otrosIngresos, 60);
  y += 13;
  L.campo(M, y, 'Gasto Alimentación:', ig.gastoAlimentacion, 60);
  L.campo(M + 140, y, 'Gasto Vivienda:', ig.gastoVivienda, 60);
  L.campo(M + 280, y, 'Gasto Movilidad:', ig.gastoMovilidad, 60);
  L.campo(M + 400, y, 'Otros Gastos:', ig.otrosGastos, 60);
  y += 14;

  L.texto(M, y, 'Tramo de Ingreso', { bold: true }); y += 11;
  const ti: [string, number][] = [
    ['Ninguna', 5], ['Menos de 1 SMV', 4], ['De 1 a 2 SMV', 3],
    ['De 2 a 3 SMV', 2], ['De 3 a 4 SMV', 1], ['Más de SMV', 0],
  ];
  ti.forEach(([lab, p], i) => { const col = i % 3; const row = Math.floor(i / 3); L.opcion(M + col * 175, y + row * 11, lab, f.tramoIngreso === lab, p); });
  y += 2 * 11 + 6;

  // ---- IV. VIVIENDA ----
  L.texto(M, y, 'IV.- VIVIENDA', { bold: true, size: 9 });
  L.linea(M, y + 11, A4.w - M); y += 16;

  L.texto(M, y, 'Tenencia', { bold: true });
  L.texto(220, y, 'Material de Construcción', { bold: true }); y += 11;
  const ten: [string, number][] = [['Propia',1],['Alquilada',2],['Invasión',3],['Guardianía',4],['Alojado',5]];
  ten.forEach(([lab, p], i) => L.opcion(M, y + i * 11, lab, f.vivienda.tenencia === lab, p));
  const mat: [string, number][] = [['Noble/Acabado',1],['Noble sin acabar',2],['Mixto',3],['Rústico',4],['Precario',5]];
  mat.forEach(([lab, p], i) => L.opcion(220, y + i * 11, lab, f.vivienda.materialConstruccion === lab, p));
  y += 5 * 11 + 6;

  L.campo(M, y, 'Nº Miembros del Hogar:', f.vivienda.nroMiembrosHogar, 30);
  L.campo(M + 190, y, 'Nº Ambientes para Dormir:', f.vivienda.nroAmbientesDormir, 30);
  y += 13;
  const ratio = f.vivienda.nroAmbientesDormir > 0 ? f.vivienda.nroMiembrosHogar / f.vivienda.nroAmbientesDormir : Infinity;
  L.texto(M, y, 'Hacinamiento', { bold: true });
  L.opcion(M + 80, y, '<3', ratio < 3, 0);
  L.opcion(M + 140, y, '=3', ratio === 3, 3);
  L.opcion(M + 200, y, '>3', ratio > 3, 5);
  y += 14;

  L.texto(M, y, 'Servicios Básicos', { bold: true }); y += 11;
  const sb: [string, number][] = [['Completo', 0], ['Parcial', 3], ['Sin servicios básicos', 5]];
  sb.forEach(([lab, p], i) => L.opcion(M + i * 175, y, lab, f.vivienda.serviciosBasicos === lab, p));
  y += 16;

  // ---- V. EQUIPAMIENTO ----
  L.texto(M, y, 'V.- EQUIPAMIENTO DEL HOGAR', { bold: true, size: 9 });
  L.linea(M, y + 11, A4.w - M); y += 16;
  const eq: [string, number][] = [['No cuenta con artefactos', 5], ['1 a 2', 3], ['3 a más', 0]];
  eq.forEach(([lab, p], i) => L.opcion(M + i * 175, y, lab, f.equipamientoHogar === lab, p));
  y += 16;

  // ---- VI. FACTORES DE RIESGO ----
  L.texto(M, y, 'VI.- FACTORES DE RIESGO', { bold: true, size: 9 });
  L.linea(M, y + 11, A4.w - M); y += 16;
  L.campo(M, y, 'Estudio Social:', f.factoresRiesgoTexto, 400); y += 14;

  const factores = [
    'Niños Desnutridos', 'Tuberculosis', 'ETS-Sida', 'Incapacidad Física o Mental', 'Antecedentes Penales',
    'Fármaco Dependencia', 'Abandono Familiar', 'Violencia Familiar', 'Prostitución',
  ];
  factores.forEach((lab, i) => {
    const col = i % 3; const row = Math.floor(i / 3);
    L.opcion(M + col * 175, y + row * 11, lab, f.factoresRiesgo.includes(lab));
  });
  y += 3 * 11 + 6;

  const nRiesgos = f.factoresRiesgo.length;
  L.texto(M, y, 'Tramo de Riesgo', { bold: true }); y += 11;
  L.opcion(M, y, 'Sin Riesgo', nRiesgos === 0, 0);
  L.opcion(M + 130, y, '1 a 2 Riesgos', nRiesgos >= 1 && nRiesgos <= 2, 3);
  L.opcion(M + 280, y, '3 a más', nRiesgos >= 3, 5);
  y += 18;

  // ---- CIERRE: Puntaje / Categoría / Fecha / Firma ----
  if (y > A4.h - 90) {
    page = doc.addPage([A4.w, A4.h]);
    L = new Lienzo(page, font, bold);
    y = 34;
  }
  L.linea(M, y, A4.w - M); y += 14;
  L.campo(M, y, 'Puntaje Básico:', f.puntajes.puntajeBasico, 40);
  L.campo(M + 160, y, 'Puntaje c/ Estudio Social:', f.puntajes.puntajeEstudioSocial ?? '', 40);
  y += 14;

  L.texto(M, y, 'Categorización:', { bold: true });
  const categorias = ['A', 'B', 'C', 'Z'];
  categorias.forEach((cat, i) => L.opcion(M + 90 + i * 40, y, cat, f.puntajes.categoria === cat));
  y += 16;

  L.campo(M, y, 'Fecha:', fmtFecha(f.fechaInscripcion), 80); y += 16;
  L.campo(M, y, 'Trabajadora Social ó Asistente Profesional, Nombre:', f.trabajadoraSocial, 150); y += 20;
  L.texto(M, y, 'Firma: ____________________________');

  const bytes = await doc.save();
  return bytes;
}
