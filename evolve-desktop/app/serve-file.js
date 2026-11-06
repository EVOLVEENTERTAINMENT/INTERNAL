// Serves one file from the board folder for the evolve:// protocol, with
// byte ranges. Chromium asks for ranges when it plays a video or reloads a
// page it has seen, and an answer that ignores the range can leave the page
// loading for ever. Small files, so a range is read straight into a buffer.
'use strict';
const fs = require('fs');
const path = require('path');

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };

function serveFile(req, full) {
  let st;
  try { st = fs.statSync(full); } catch (e) { return new Response('not found', { status: 404 }); }
  if (!st.isFile()) return new Response('not found', { status: 404 });
  const size = st.size, type = TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream';
  let start = 0, end = size - 1, status = 200;
  const m = /^bytes=(\d*)-(\d*)$/.exec((req.headers && req.headers.get && req.headers.get('range')) || '');
  if (m && (m[1] || m[2])) {
    if (m[1]) { start = Number(m[1]); end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1; }
    else start = Math.max(0, size - Number(m[2]));
    if (size === 0 || start > end || start >= size) return new Response(null, { status: 416, headers: { 'content-range': 'bytes */' + size, 'accept-ranges': 'bytes' } });
    status = 206;
  }
  const length = size === 0 ? 0 : end - start + 1;
  const headers = { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': String(length), 'cache-control': 'no-cache' };
  if (status === 206) headers['content-range'] = 'bytes ' + start + '-' + end + '/' + size;
  if (req.method === 'HEAD' || length === 0) return new Response(null, { status, headers });
  const buf = Buffer.alloc(length);
  const fd = fs.openSync(full, 'r');
  try { fs.readSync(fd, buf, 0, length, start); } finally { fs.closeSync(fd); }
  return new Response(buf, { status, headers });
}

module.exports = { serveFile, TYPES };
