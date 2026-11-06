// The evolve:// file server: whole files, byte ranges, suffix ranges, a range
// past the end, HEAD, a missing file, and the content type by extension.
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { serveFile } = require('../app/serve-file');

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'evolve-serve-'));
  const f = path.join(dir, 'clip.mp4');
  const bytes = Buffer.from('0123456789abcdefghij');          // 20 bytes
  fs.writeFileSync(f, bytes);
  const req = (headers, method) => new Request('evolve://app/media/clip.mp4', { method: method || 'GET', headers: headers || {} });

  let r = serveFile(req(), f);
  assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'video/mp4');
  assert.equal(r.headers.get('accept-ranges'), 'bytes'); assert.equal(r.headers.get('content-length'), '20');
  assert.equal(Buffer.from(await r.arrayBuffer()).toString(), '0123456789abcdefghij');

  r = serveFile(req({ range: 'bytes=0-' }), f);
  assert.equal(r.status, 206); assert.equal(r.headers.get('content-range'), 'bytes 0-19/20');
  assert.equal(Buffer.from(await r.arrayBuffer()).toString(), '0123456789abcdefghij');

  r = serveFile(req({ range: 'bytes=5-9' }), f);
  assert.equal(r.status, 206); assert.equal(r.headers.get('content-range'), 'bytes 5-9/20'); assert.equal(r.headers.get('content-length'), '5');
  assert.equal(Buffer.from(await r.arrayBuffer()).toString(), '56789');

  r = serveFile(req({ range: 'bytes=15-99' }), f);
  assert.equal(r.status, 206); assert.equal(r.headers.get('content-range'), 'bytes 15-19/20');
  assert.equal(Buffer.from(await r.arrayBuffer()).toString(), 'fghij');

  r = serveFile(req({ range: 'bytes=-4' }), f);
  assert.equal(r.status, 206); assert.equal(r.headers.get('content-range'), 'bytes 16-19/20');
  assert.equal(Buffer.from(await r.arrayBuffer()).toString(), 'ghij');

  r = serveFile(req({ range: 'bytes=20-' }), f);
  assert.equal(r.status, 416); assert.equal(r.headers.get('content-range'), 'bytes */20');

  r = serveFile(req({ range: 'bytes=2-4' }, 'HEAD'), f);
  assert.equal(r.status, 206); assert.equal(r.headers.get('content-length'), '3'); assert.equal(r.body, null);

  r = serveFile(req(), path.join(dir, 'missing.png'));
  assert.equal(r.status, 404);
  r = serveFile(req(), dir);
  assert.equal(r.status, 404, 'a folder is not a file');

  fs.writeFileSync(path.join(dir, 'empty.txt'), '');
  r = serveFile(req(), path.join(dir, 'empty.txt'));
  assert.equal(r.status, 200); assert.equal(r.headers.get('content-length'), '0');
  r = serveFile(req({ range: 'bytes=0-' }), path.join(dir, 'empty.txt'));
  assert.equal(r.status, 416);

  fs.writeFileSync(path.join(dir, 'x.webm'), 'ab'); fs.writeFileSync(path.join(dir, 'x.bin'), 'ab');
  assert.equal(serveFile(req(), path.join(dir, 'x.webm')).headers.get('content-type'), 'video/webm');
  assert.equal(serveFile(req(), path.join(dir, 'x.bin')).headers.get('content-type'), 'application/octet-stream');
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('serve-file ok');
})().catch(e => { console.error(e); process.exit(1); });
