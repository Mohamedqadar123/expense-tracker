import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envTestPath = path.resolve(__dirname, '../.env.test');

// `dotenv -e .env.test -- prisma migrate deploy` fails SILENTLY when the file
// is missing and falls back to whatever the child process (Prisma) loads
// from the real .env — running migrations against the dev database instead
// of the test one. Fail loudly here, before that can happen.
if (!fs.existsSync(envTestPath)) {
  console.error(
    `\nMissing ${envTestPath}\n` +
    'The backend test suite requires server/.env.test to exist and point at ' +
    'the isolated Docker test database — see server/docker-compose.test.yml.\n'
  );
  process.exit(1);
}
