import {
  EstadoCivil,
  GradoInstruccion,
  Ocupacion,
  SaludFamiliar,
  ServiciosBasicos,
  Vivienda,
} from '../tarjetas/enums/tarjeta.enums';
import type {
  FamiliarConyuge,
  Tarjeta,
} from '../tarjetas/schemas/tarjeta.schema';

function escapeHtml(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const texto = typeof value === 'number' ? value.toString() : value;
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatearFecha(fecha?: Date): string {
  if (!fecha) {
    return '';
  }
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Lima',
  }).format(fecha);
}

/** Lista de opciones con casilla marcada en la(s) seleccionada(s), como en la ficha. */
function checkboxes(opciones: string[], seleccion: string[]): string {
  return opciones
    .map((opcion) => {
      const marcada = seleccion.includes(opcion);
      return `<div class="opcion${marcada ? ' marcada' : ''}">
        <span class="caja">${marcada ? '&#10004;' : '&nbsp;'}</span>
        <span>${escapeHtml(opcion)}</span>
      </div>`;
    })
    .join('');
}

function campo(
  etiqueta: string,
  valor: string | number | undefined | null,
  extraClass = '',
): string {
  return `<div class="campo ${extraClass}">
    <span class="etiqueta">${escapeHtml(etiqueta)}:</span>
    <span class="valor">${escapeHtml(valor) || '&mdash;'}</span>
  </div>`;
}

function seccionFamiliar(titulo: string, familiar?: FamiliarConyuge): string {
  return `<fieldset class="seccion">
    <legend>${escapeHtml(titulo)}</legend>
    ${campo('Nombre', familiar?.nombre)}
    <div class="fila">
      ${campo('Edad', familiar?.edad)}
      ${campo('Grado de Instrucción', familiar?.gradoInstruccion)}
      ${campo('Teléfono', familiar?.telefono)}
    </div>
    <div class="fila">
      ${campo('Ocupación', familiar?.ocupacion)}
      ${campo('Centro de Trabajo', familiar?.centroTrabajo)}
    </div>
  </fieldset>`;
}

export function renderTarjetaHtml(tarjeta: Tarjeta): string {
  const p = tarjeta.paciente;
  const s = tarjeta.socioeconomico;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9px;
    color: #111;
  }
  .encabezado { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .titulos { text-align: center; flex: 1; }
  .titulos h1 { font-size: 13px; letter-spacing: 1px; }
  .titulos h2 { font-size: 11px; font-weight: normal; margin-top: 2px; }
  .folio {
    border: 2px solid #111; padding: 4px 10px; text-align: center; min-width: 110px;
  }
  .folio .numero { font-size: 16px; font-weight: bold; }
  .folio .rotulo { font-size: 8px; text-transform: uppercase; }

  .seccion {
    border: 1px solid #111; border-radius: 2px;
    padding: 5px 7px; margin-bottom: 6px;
  }
  .seccion legend {
    font-weight: bold; font-size: 9px; text-transform: uppercase;
    padding: 0 4px;
  }
  .fila { display: flex; gap: 10px; }
  .fila > .campo { flex: 1; }
  .campo { margin: 2px 0; display: flex; gap: 4px; }
  .etiqueta { font-weight: bold; white-space: nowrap; }
  .valor { border-bottom: 1px dotted #555; flex: 1; min-height: 11px; }

  .columnas { display: flex; gap: 6px; }
  .columnas > .seccion { flex: 1; margin-bottom: 6px; }

  .opciones { display: flex; flex-wrap: wrap; gap: 2px 12px; }
  .opcion { display: flex; align-items: center; gap: 4px; min-width: 30%; }
  .opciones.compacta .opcion { min-width: auto; }
  .caja {
    display: inline-block; width: 10px; height: 10px; line-height: 10px;
    border: 1px solid #111; text-align: center; font-size: 8px;
  }
  .opcion.marcada span:last-child { font-weight: bold; }

  .texto-largo {
    border: none; min-height: 40px; white-space: pre-wrap;
    border-bottom: 1px dotted #555; padding-bottom: 2px;
  }
  .firma { margin-top: 18px; display: flex; justify-content: flex-end; }
  .firma .linea { text-align: center; width: 220px; }
  .firma .linea .raya { border-top: 1px solid #111; padding-top: 3px; }
</style>
</head>
<body>
  <div class="encabezado">
    <div class="titulos">
      <h1>HOSPITAL &quot;DANIEL A. CARRI&Oacute;N&quot;</h1>
      <h2>SERVICIO DE TRABAJO SOCIAL &mdash; TARJETA DE TRABAJO SOCIAL</h2>
    </div>
    <div class="folio">
      <div class="rotulo">N&ordm; Tarjeta Social</div>
      <div class="numero">${escapeHtml(tarjeta.nroTarjetaSocial)}</div>
    </div>
  </div>

  <fieldset class="seccion">
    <legend>Datos del Paciente</legend>
    <div class="fila">
      ${campo('Apellido Paterno', p.apellidoPaterno)}
      ${campo('Apellido Materno', p.apellidoMaterno)}
      ${campo('Nombres', p.nombres)}
    </div>
    <div class="fila">
      ${campo('Nº Historia Clínica', p.nroHistoriaClinica)}
      ${campo('Procedencia', p.procedencia)}
      ${campo('Fecha de Inscripción', formatearFecha(tarjeta.fechaInscripcion))}
    </div>
    <div class="fila">
      ${campo('Transferido (derivado de)', p.transferido)}
      ${campo('Lugar de Nacimiento', p.lugarNacimiento)}
      ${campo('Fecha de Nacimiento', formatearFecha(p.fechaNacimiento))}
      ${campo('Edad', p.edad)}
    </div>
  </fieldset>

  <div class="columnas">
    <fieldset class="seccion">
      <legend>Grado de Instrucción</legend>
      <div class="opciones compacta">
        ${checkboxes(Object.values(GradoInstruccion), [tarjeta.gradoInstruccion])}
      </div>
    </fieldset>
    <fieldset class="seccion">
      <legend>Estado Civil</legend>
      <div class="opciones compacta">
        ${checkboxes(Object.values(EstadoCivil), [tarjeta.estadoCivil])}
      </div>
    </fieldset>
  </div>

  <fieldset class="seccion">
    <legend>Ocupación</legend>
    <div class="opciones">
      ${checkboxes(Object.values(Ocupacion), [tarjeta.ocupacion])}
    </div>
  </fieldset>

  <fieldset class="seccion">
    <legend>Datos Socioeconómicos</legend>
    <div class="fila">
      ${campo('Ingreso Económico (S/)', s.ingresoEconomico)}
      ${campo('Grado de Dependencia Económica', s.gradoDependencia)}
    </div>
    <div class="fila">
      ${campo('Dirección', s.direccion)}
      ${campo('Distrito', s.distrito)}
    </div>
  </fieldset>

  <div class="columnas">
    <fieldset class="seccion">
      <legend>Vivienda</legend>
      <div class="opciones compacta">
        ${checkboxes(Object.values(Vivienda), [tarjeta.vivienda])}
      </div>
    </fieldset>
    <fieldset class="seccion">
      <legend>Servicios Básicos</legend>
      <div class="opciones compacta">
        ${checkboxes(Object.values(ServiciosBasicos), [tarjeta.serviciosBasicos])}
      </div>
    </fieldset>
  </div>

  <div class="columnas">
    ${seccionFamiliar('Padre o Cónyuge', tarjeta.padreConyuge)}
    ${seccionFamiliar('Madre o Cónyuge', tarjeta.madreConyuge)}
  </div>

  <fieldset class="seccion">
    <legend>Datos Familiares</legend>
    ${campo('Número de Hermanos o Hijos', tarjeta.datosFamiliares?.numeroHermanosHijos)}
    ${campo('Observaciones', tarjeta.datosFamiliares?.observaciones)}
  </fieldset>

  <fieldset class="seccion">
    <legend>Salud Familiar y Problemas Sociales</legend>
    <div class="opciones">
      ${checkboxes(Object.values(SaludFamiliar), tarjeta.saludFamiliar ?? [])}
    </div>
  </fieldset>

  <fieldset class="seccion">
    <legend>Diagnóstico (Dx)</legend>
    <div class="texto-largo">${escapeHtml(tarjeta.dx) || '&mdash;'}</div>
  </fieldset>

  <fieldset class="seccion">
    <legend>Pre-Diagnóstico Social</legend>
    <div class="texto-largo">${escapeHtml(tarjeta.preDiagnosticoSocial)}</div>
  </fieldset>

  <div class="firma">
    <div class="linea">
      <div class="raya">${escapeHtml(tarjeta.asistenteSocial)}</div>
      <div>Asistente Social</div>
    </div>
  </div>
</body>
</html>`;
}
