import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const root = process.cwd(); const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
createServer(async (req,res) => { try { let path = decodeURIComponent((req.url || '/').split('?')[0]); if(path==='/') path='/index.html'; const file=normalize(join(root,path)); if(!file.startsWith(root)) throw Error('bad path'); await stat(file); res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream'); res.end(await readFile(file)); } catch { res.statusCode=404; res.end('Not found'); } }).listen(port,()=>console.log(`Orbitalna Przesyłka: http://localhost:${port}`));
