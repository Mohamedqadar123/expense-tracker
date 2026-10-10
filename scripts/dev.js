// Starts the Vite frontend and the API server together for `npm run dev`.
// Both are spawned directly with node (no shell), so this works even when
// cmd.exe isn't resolvable from PATH.
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const commands = [
  { name: 'web', args: [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')], cwd: root },
  { name: 'api', args: ['--watch', 'src/index.js'], cwd: path.join(root, 'server') },
];

let shuttingDown = false;

function killTree(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === 'win32') {
    // child.kill() would orphan the process `node --watch` supervises.
    const taskkill = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe');
    spawnSync(taskkill, ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach(killTree);
  process.exit(code);
}

const children = commands.map(({ name, args, cwd }) => {
  const child = spawn(process.execPath, args, { cwd, stdio: 'inherit' });
  child.on('error', (err) => {
    console.error(`[${name}] failed to start: ${err.message}`);
    shutdown(1);
  });
  child.on('exit', (code) => {
    if (shuttingDown) return;
    console.error(`[${name}] exited with code ${code}`);
    shutdown(code ?? 1);
  });
  return child;
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
