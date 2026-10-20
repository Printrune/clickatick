import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';

// A task-owned, loopback-only preview. External AI stays off during visual checks.
process.env.AI_ENABLED = 'false';
process.env.LOCAL_MODE = 'false';
async function available(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)));
  });
}
let port = Number(process.argv[2] || 3022);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Choose a valid local preview port.');
while (!await available(port)) port++;
fs.mkdirSync('evidence', {recursive: true});
fs.writeFileSync('evidence/preview-design-process.json', JSON.stringify({
  pid: process.pid,
  command: `node scripts/preview-design.mjs (next dev --hostname 127.0.0.1 --port ${port})`,
  workingFolder: process.cwd(), port, startedAt: new Date().toISOString(),
}, null, 2));
process.argv = [process.execPath, path.resolve('node_modules/next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', String(port)];
await import('../node_modules/next/dist/bin/next');
