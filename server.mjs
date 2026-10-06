import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5173);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep)) { response.writeHead(403);response.end('Forbidden');return; }
    if (!['GET','HEAD'].includes(request.method)) {response.writeHead(405,{'Allow':'GET, HEAD'});response.end();return;}
    const body = await readFile(file);
    response.writeHead(200, {'Content-Type': mime[extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : 404);
    response.end(error instanceof URIError ? 'Bad request' : 'Not found');
  }
});
server.on('error', error => {console.error('Server could not start:',error.message);process.exitCode=1;});
server.listen(port, '127.0.0.1', () => console.log('Duri village: http://localhost:' + port));

