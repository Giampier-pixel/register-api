import {
  calcularEdad,
  escapeRegex,
  esSoloFecha,
  finDeDia,
  inicioDeDia,
  regexInsensibleAcentos,
} from './fichas.utils';

describe('calcularEdad', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    // 15 de junio de 2026 en hora local del proceso
    jest.setSystemTime(new Date(2026, 5, 15, 12, 0, 0));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('cumple años hoy', () => {
    expect(calcularEdad(new Date(1990, 5, 15))).toBe(36);
  });

  it('todavía no cumple años este año', () => {
    expect(calcularEdad(new Date(1990, 5, 16))).toBe(35);
  });

  it('ya cumplió años este año', () => {
    expect(calcularEdad(new Date(1990, 5, 14))).toBe(36);
  });

  it('mes posterior al actual resta un año', () => {
    expect(calcularEdad(new Date(1990, 11, 1))).toBe(35);
  });

  it('nunca devuelve negativo', () => {
    expect(calcularEdad(new Date(2030, 0, 1))).toBe(0);
  });
});

describe('esSoloFecha', () => {
  it('acepta fecha sin hora', () => {
    expect(esSoloFecha('2026-06-10')).toBe(true);
  });

  it('rechaza ISO con hora', () => {
    expect(esSoloFecha('2026-06-10T12:00:00Z')).toBe(false);
  });

  it('rechaza otros formatos', () => {
    expect(esSoloFecha('10/06/2026')).toBe(false);
  });
});

describe('inicioDeDia / finDeDia', () => {
  it('ancla una fecha sin hora al día peruano (-05:00)', () => {
    expect(inicioDeDia('2026-06-10').toISOString()).toBe(
      '2026-06-10T05:00:00.000Z',
    );
    expect(finDeDia('2026-06-10').toISOString()).toBe(
      '2026-06-11T04:59:59.999Z',
    );
  });

  it('respeta un ISO completo tal cual', () => {
    const iso = '2026-06-10T12:34:56.000Z';
    expect(inicioDeDia(iso).toISOString()).toBe(iso);
    expect(finDeDia(iso).toISOString()).toBe(iso);
  });
});

describe('escapeRegex', () => {
  it('escapa los caracteres especiales de regex', () => {
    expect(escapeRegex('a.b*c(d)')).toBe('a\\.b\\*c\\(d\\)');
  });

  it('deja intactas las letras y números', () => {
    expect(escapeRegex('Perez123')).toBe('Perez123');
  });
});

describe('regexInsensibleAcentos', () => {
  const matches = (patron: string, texto: string) =>
    new RegExp(regexInsensibleAcentos(patron), 'i').test(texto);

  it('búsqueda sin tilde encuentra texto con tilde', () => {
    expect(matches('perez', 'Pérez')).toBe(true);
    expect(matches('munoz', 'Muñoz')).toBe(true);
    expect(matches('jose', 'JOSÉ')).toBe(true);
  });

  it('búsqueda con tilde encuentra texto sin tilde', () => {
    expect(matches('pérez', 'Perez')).toBe(true);
    expect(matches('muñoz', 'Munoz')).toBe(true);
  });

  it('soporta texto almacenado en forma NFD', () => {
    const nfd = 'P\u00e9rez'.normalize('NFD'); // e + acento combinante
    expect(matches('perez', nfd)).toBe(true);
  });

  it('no coincide con nombres distintos', () => {
    expect(matches('perez', 'Paredes')).toBe(false);
  });

  it('escapa caracteres especiales sin romper el patrón', () => {
    expect(() => new RegExp(regexInsensibleAcentos('a(b*'))).not.toThrow();
    expect(matches('a(b', 'á(b')).toBe(true);
  });
});
