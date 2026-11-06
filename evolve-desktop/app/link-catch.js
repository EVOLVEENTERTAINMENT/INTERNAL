// Catches the sign-in link from the Supabase email. The link opens your
// browser at a page on this Mac (127.0.0.1, fixed port so Supabase can allow
// it), carrying a one time code the app trades for your sign in.
'use strict';
const http = require('http');

const PORT = Number(process.env.EVOLVE_LINK_PORT || 45813);
const REDIRECT = 'http://127.0.0.1:' + PORT + '/signed-in';
const page = (title, line) => '<!doctype html><meta charset="utf-8"><title>Evolve OS</title>' +
  '<body style="margin:0;background:#0B0B0C;color:#F2F2F4;font:16px/1.5 -apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh">' +
  '<div style="max-width:380px;padding:24px"><h1 style="font-size:20px;margin:0 0 8px">' + title + '</h1><p style="color:#ABABB2;margin:0">' + line + '</p></div>';

let srv = null, timer = null;
// Waits for one link click. onCode(code) returns a promise; the browser page
// says whether it worked. Starting again replaces the earlier wait.
function waitForLink(onCode, ms = 20 * 60 * 1000) {
  stop();
  return new Promise((resolve, reject) => {
    srv = http.createServer(async (req, res) => {
      const u = new URL(req.url, REDIRECT);
      if (u.pathname !== '/signed-in') { res.writeHead(404); res.end(); return; }
      const code = u.searchParams.get('code');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      if (!code) { res.end(page('That link did not work', 'Ask for a new one in Evolve OS Settings.')); return; }
      try { await onCode(code); res.end(page('Signed in', 'You can close this tab and go back to Evolve OS.')); stop(); }
      catch (e) { res.end(page('That link did not work', 'Ask for a new one in Evolve OS Settings.')); }
    });
    srv.on('error', e => { srv = null; reject(Object.assign(new Error('Another app is using the sign-in port. Quit it and try again.'), { code: 'busy' })); });
    srv.listen(PORT, '127.0.0.1', () => resolve(REDIRECT));
    timer = setTimeout(stop, ms);
  });
}
function stop() { if (timer) clearTimeout(timer); timer = null; if (srv) srv.close(); srv = null; }
module.exports = { waitForLink, stop, REDIRECT, PORT };
