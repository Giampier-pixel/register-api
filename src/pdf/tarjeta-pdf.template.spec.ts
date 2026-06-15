import {
  EstadoCivil,
  GradoInstruccion,
  Ocupacion,
  SaludFamiliar,
  ServiciosBasicos,
  Vivienda,
} from '../tarjetas/enums/tarjeta.enums';
import type { Tarjeta } from '../tarjetas/schemas/tarjeta.schema';
import { renderTarjetaHtml } from './tarjeta-pdf.template';

const MARCA = '&#10004;';

function tarjetaBase(extra: Partial<Tarjeta> = {}): Tarjeta {
  return {
    nroTarjetaSocial: 7,
    paciente: {
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García',
      nombres: 'Juan',
      procedencia: 'Callao',
      lugarNacimiento: 'Lima',
      fechaNacimiento: new Date('1990-06-15T05:00:00.000Z'),
      edad: 36,
    },
    gradoInstruccion: GradoInstruccion.PRIMARIA,
    estadoCivil: EstadoCivil.CASADO,
    ocupacion: Ocupacion.TRABAJADOR_INFORMAL,
    socioeconomico: {
      ingresoEconomico: 1200,
      gradoDependencia: -2,
      direccion: 'Av. Test 123',
      distrito: 'Callao',
    },
    vivienda: Vivienda.ALQUILADA,
    serviciosBasicos: ServiciosBasicos.PARCIAL,
    saludFamiliar: [],
    preDiagnosticoSocial: 'Evaluación.',
    asistenteSocial: 'Carmen Díaz',
    // 15 mar 2026 00:00 en Perú
    fechaInscripcion: new Date('2026-03-15T05:00:00.000Z'),
    activa: true,
    ...extra,
  } as Tarjeta;
}

describe('renderTarjetaHtml', () => {
  it('escapa HTML de los datos del paciente', () => {
    const html = renderTarjetaHtml(
      tarjetaBase({
        paciente: {
          ...tarjetaBase().paciente,
          nombres: '<script>alert(1)</script>',
        },
        dx: 'Dx con "comillas" & <b>negrita</b>',
      }),
    );

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;comillas&quot; &amp;');
  });

  it('marca exactamente una casilla por sección de selección única', () => {
    const html = renderTarjetaHtml(tarjetaBase());
    // 5 secciones de selección única, sin salud familiar seleccionada
    const marcas = html.split(MARCA).length - 1;
    expect(marcas).toBe(5);
    expect(html).toContain('Primaria');
    expect(html).toContain('Trabajador Informal');
  });

  it('marca todas las opciones elegidas de salud familiar', () => {
    const html = renderTarjetaHtml(
      tarjetaBase({
        saludFamiliar: [SaludFamiliar.TBC, SaludFamiliar.VIOLENCIA_FAMILIAR],
      }),
    );
    const marcas = html.split(MARCA).length - 1;
    expect(marcas).toBe(5 + 2);
  });

  it('formatea las fechas en hora de Perú', () => {
    const html = renderTarjetaHtml(tarjetaBase());
    expect(html).toContain('15/03/2026'); // inscripción
    expect(html).toContain('15/06/1990'); // nacimiento
  });

  it('muestra el folio y al asistente social', () => {
    const html = renderTarjetaHtml(tarjetaBase());
    expect(html).toContain('>7<');
    expect(html).toContain('Carmen Díaz');
  });

  it('rinde guiones en secciones opcionales vacías sin fallar', () => {
    const html = renderTarjetaHtml(tarjetaBase());
    expect(html).toContain('&mdash;');
    expect(html).toContain('Padre o Cónyuge');
    expect(html).toContain('Madre o Cónyuge');
  });
});
