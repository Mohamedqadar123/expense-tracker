import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertTestDatabase } from './testDb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function setup() {
  const envTestPath = path.resolve(__dirname, '../.env.test');
  const result = dotenv.config({ path: envTestPath, override: true });

  // dotenv.config() fails SILENTLY (returns { error }, doesn't throw) when the
  // file is missing. Left unchecked, DATABASE_URL then falls through to
  // whatever app.js's own `import 'dotenv/config'` loads from the real .env —
  // pointing every test at the dev database instead of the isolated test one.
  // This happened once (2026-09-14) and truncated the dev database. Never again.
  if (result.error) {
    throw new Error(
      `Failed to load ${envTestPath}: ${result.error.message}\n` +
      'The backend test suite requires server/.env.test to exist and point at ' +
      'the isolated Docker test database — see server/docker-compose.test.yml.'
    );
  }

  assertTestDatabase();

  return function teardown() {
    // Container lifecycle is handled by the `posttest` npm script, not here.
  };
}
