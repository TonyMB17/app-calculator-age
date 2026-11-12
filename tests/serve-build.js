import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

// Serve the production output under a real repository-like subpath.
const root = resolve('dist');
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (!path.startsWith('/calculadora/')) {
    res.writeHead(404).end();
    return;
  }
  const file = resolve(root, path.slice('/calculadora/'.length) || 'index.html');
  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.setHeader(
      'Content-Type',
      {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
      }[extname(file)] || 'application/octet-stream',
    );
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(4173, '127.0.0.1');
