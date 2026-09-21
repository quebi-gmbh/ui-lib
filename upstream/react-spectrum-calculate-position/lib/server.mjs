import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join} from 'node:path';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript'};
const root = new URL('../public/', import.meta.url).pathname;

/** Serve `public/` on `port`, so the page is a real document with a real origin. */
export function serve(port) {
  const server = createServer(async (req, res) => {
    const path = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    try {
      const body = await readFile(join(root, path));
      res.writeHead(200, {'content-type': TYPES[extname(path)] ?? 'application/octet-stream'});
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}
