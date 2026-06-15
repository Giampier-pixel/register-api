import { existsSync } from 'node:fs';

// Usa el mongod del sistema si existe; si no, mongodb-memory-server
// descargará su propio binario.
if (!process.env.MONGOMS_SYSTEM_BINARY && existsSync('/usr/bin/mongod')) {
  process.env.MONGOMS_SYSTEM_BINARY = '/usr/bin/mongod';
}
