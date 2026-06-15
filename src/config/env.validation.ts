const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET'] as const;

/** Falla rápido y con mensaje claro si el .env está incompleto. */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_VARS.filter((key) => {
    const value = config[key];
    return value === undefined || value === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables requeridas en el .env: ${missing.join(', ')}. ` +
        'Copia .env.example a .env y completa los valores.',
    );
  }
  return config;
}
