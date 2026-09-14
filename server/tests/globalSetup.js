import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function setup() {
  dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

  return function teardown() {
    // Container lifecycle is handled by the `posttest` npm script, not here.
  };
}
