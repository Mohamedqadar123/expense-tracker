import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertTestDatabase } from './testDb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envTestPath = path.resolve(__dirname, '../.env.test');
const result = dotenv.config({ path: envTestPath, override: true });

if (result.error) {
  throw new Error(
    `Failed to load ${envTestPath}: ${result.error.message}\n` +
    'The backend test suite requires server/.env.test to exist and point at ' +
    'the isolated Docker test database — see server/docker-compose.test.yml.'
  );
}

assertTestDatabase();
