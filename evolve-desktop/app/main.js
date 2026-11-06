// Evolve OS for Mac. Opens the board in its own window and answers the
// board's calls: the database (on this Mac, or Supabase once you sign in),
// Claude on your own key, and file saves.
'use strict';
const { app, BrowserWindow, ipcMain, protocol, net, shell, dialog, Menu, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { LocalStore } = require('./store');
const { SupabaseStore } = require('./supabase-store');
const { create: makeConfig } = require('./config');
const ai = require('./ai');
const { readExport } = require('./importer');
const { Google } = require('./google');
const imessage = require('./imessage');
const linkCatch = require('./link-catch');

const BOARD_DIR = path.join(__dirname, 'board');
const SHIM = fs.readFileSync(path.join(__dirname, 'shim', 'claude-shim.js'), 'utf8');
protocol.registerSchemesAsPrivileged([{ scheme: 'evolve', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);

let store, local, cfg, google, win, settingsWin, unhook = null;
const GC = 'Google Calendar', GM = 'Gmail', IM = 'host:Read_and_Send_iMessages';
const home = () => process.env.EVOLVE_DATA_DIR || path.join(app.getPath('userData'), 'board-data');

// Your EVOLVE OPS project. Both are public by design (the database only opens
// for your sign in), so they ship with the app and you only type your email.
const SUPABASE_DEFAULT = { url: 'https://agjtcdbxlqomlgqgoutd.supabase.co', anon: 'sb_publishable_euJcVW3q5ZSRZyMIQ8H3hg_P_MXSs64' };
function useStore(s) {
  if (unhook) unhook();
  store = s;
  unhook = store.onChange(ev => { for (const w of BrowserWindow.getAllWindows()) w.webContents.send('db:changed', ev); });
}
async function connectSupabase() {
  const c = cfg.get();
  if (!c.supabaseUrl || !c.supabaseAnon) return false;
  const sb = new SupabaseStore({ url: c.supabaseUrl, anonKey: c.supabaseAnon, storage: cfg.authStorage() });
  const who = await sb.who().catch(() => null);
  if (!who) return false;
  sb.live(); useStore(sb); return true;
}
function where() { return store instanceof SupabaseStore ? 'supabase' : 'mac'; }

function serveBoard() {
  protocol.handle('evolve', async req => {
    const u = new URL(req.url);
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const full = path.normalize(path.join(BOARD_DIR, rel));
    if (!full.startsWith(BOARD_DIR)) return new Response('not found', { status: 404 });
    if (rel === 'index.html') {
      // The doorway goes in first, before any of the board's own scripts run.
      const html = fs.readFileSync(full, 'utf8').replace('<head>', '<head><script>' + SHIM.replace(/<\/script/gi, '<\\/script') + '</script>');
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }
    return net.fetch(pathToFileURL(full).toString());
  });
}

function wire() {
  const guard = fn => async (_e, a) => {
    try { return await fn(a || {}); }
    catch (e) { const x = new Error(e.message); x.code = e.code || 'unavailable'; throw x; }
  };
  ipcMain.handle('db:get', guard(a => store.get(a.path)));
  ipcMain.handle('db:set', guard(a => store.set(a.path, a.data)));
  ipcMain.handle('db:update', guard(a => store.update(a.path, a.data)));
  ipcMain.handle('db:delete', guard(a => store.delete(a.path)));
  ipcMain.handle('db:query', guard(a => store.query(a.col, a.q)));
  ipcMain.handle('db:acquire', guard(a => ({ acquired: true, holder: a.opts && a.opts.holder })));
  ipcMain.handle('host:caps', guard(() => ({ sample: cfg.hasSecret('anthropic'), mcp: google.connected() || imessage.available(), store: where() })));
  ipcMain.handle('mcp:list', guard(() => {
    const servers = [];
    if (google.connected()) {
      servers.push({ server: GC, kind: 'connector', authStatus: 'connected', tools: ['list_events', 'get_event', 'create_event', 'update_event', 'delete_event'].map(name => ({ name, description: '' })) });
      servers.push({ server: GM, kind: 'connector', authStatus: 'connected', tools: ['search_threads', 'get_thread'].map(name => ({ name, description: '' })) });
    }
    if (imessage.available()) servers.push({ server: IM, kind: 'connector', authStatus: 'connected', tools: ['get_unread_imessages', 'read_imessages'].map(name => ({ name, description: '' })) });
    return { servers };
  }));
  ipcMain.handle('mcp:call', guard(a => {
    if (a.server === GC) return google.calendar(a.tool, a.input || {});
    if (a.server === GM) return google.gmail(a.tool, a.input || {});
    if (a.server === IM) return imessage.call(a.tool, a.input || {});
    const e = new Error(a.server + ' is not connected in this app yet.'); e.code = 'server_not_connected'; throw e;
  }));
  ipcMain.handle('ai:messages', guard(a => ai.messages(cfg.secret('anthropic'), a)));
  ipcMain.handle('dl:save', guard(async a => {
    const r = await dialog.showSaveDialog(win, { defaultPath: path.join(app.getPath('downloads'), path.basename(String(a.filename || 'evolve-file'))) });
    if (r.canceled || !r.filePath) return { saved: false };
    const b = a.body || {};
    fs.writeFileSync(r.filePath, b.b64 != null ? Buffer.from(b.b64, 'base64') : String(b.text || ''));
    return { saved: true };
  }));

  // Settings window
  ipcMain.handle('set:state', guard(async () => {
    const c = cfg.get();
    let who = null;
    if (store instanceof SupabaseStore) who = await store.who().catch(() => null);
    return { claude: cfg.hasSecret('anthropic'), encrypted: cfg.encrypted(), supabaseUrl: c.supabaseUrl || SUPABASE_DEFAULT.url, supabaseAnon: c.supabaseAnon || !c.supabaseUrl ? 'saved' : '',
      store: where(), who: who && who.email, localCount: localCount(),
      google: google.connected(), googleEmail: google.email(), googleClientId: c.googleClientId || '', mac: process.platform === 'darwin', messages: imessage.available() };
  }));
  ipcMain.handle('set:claude', guard(async a => {
    const k = String(a.key || '').trim();
    if (k) await ai.messages(k, { tier: 'quick', messages: [{ role: 'user', content: 'Reply with the word ok.' }], maxTokens: 5 });
    cfg.setSecret('anthropic', k || null); reloadBoard(); return { ok: true };
  }));
  ipcMain.handle('set:supabase', guard(async a => {
    const url = String(a.url || '').trim().replace(/\/+$/, ''), anon = String(a.anon || '').trim();
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) { const e = new Error('That does not look like a Supabase project URL.'); e.code = 'bad_request'; throw e; }
    const keep = cfg.get();
    cfg.set({ supabaseUrl: url, supabaseAnon: anon || keep.supabaseAnon || (url === SUPABASE_DEFAULT.url ? SUPABASE_DEFAULT.anon : '') });
    const sb = new SupabaseStore({ url, anonKey: cfg.get().supabaseAnon, storage: cfg.authStorage() });
    const redirect = await linkCatch.waitForLink(async code => {
      await sb.finishLink(code); useStore(sb); reloadBoard();
      for (const w of [settingsWin, win]) if (w && !w.isDestroyed()) { w.show(); w.focus(); }
    });
    try { await sb.sendLink(String(a.email || '').trim(), redirect); } catch (e) { linkCatch.stop(); throw e; }
    return { ok: true, sent: true };
  }));
  ipcMain.handle('set:google', guard(async a => {
    if (a.clientId) cfg.set({ googleClientId: String(a.clientId).trim() });
    if (a.clientSecret) cfg.setSecret('googleClientSecret', String(a.clientSecret).trim());
    const r = await google.signIn(url => shell.openExternal(url));
    reloadBoard(); return { ok: true, email: r.email };
  }));
  ipcMain.handle('set:googleout', guard(async () => { google.signOut(); reloadBoard(); return { ok: true }; }));
  ipcMain.handle('set:fda', guard(async () => { await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles'); return { ok: true }; }));
  ipcMain.handle('set:signout', guard(async () => {
    if (store instanceof SupabaseStore) await store.signOut();
    useStore(local); reloadBoard(); return { ok: true };
  }));
  ipcMain.handle('set:moveup', guard(async () => {
    if (!(store instanceof SupabaseStore)) { const e = new Error('Sign in to Supabase first.'); e.code = 'bad_request'; throw e; }
    const rows = [];
    for (const f of fs.readdirSync(local.dir).filter(f => f.endsWith('.json'))) {
      const col = decodeURIComponent(f.slice(0, -5));
      for (const r of local.query(col)) rows.push({ col, id: r.id, data: r.data, version: r.version });
    }
    const n = await store.importRows(rows); reloadBoard(); return { ok: true, n };
  }));
}
function localCount() {
  try { return fs.readdirSync(local.dir).filter(f => f.endsWith('.json')).reduce((n, f) => n + Object.keys(JSON.parse(fs.readFileSync(path.join(local.dir, f), 'utf8'))).length, 0); }
  catch (e) { return 0; }
}
function reloadBoard() { if (win && !win.isDestroyed()) win.reload(); }

async function bringIn() {
  const r = await dialog.showOpenDialog(win, { title: 'Bring in board data', properties: ['openFile', 'openDirectory'],
    filters: [{ name: 'Evolve OS export', extensions: ['json'] }] });
  if (r.canceled || !r.filePaths[0]) return;
  try {
    const p = r.filePaths[0];
    let n;
    if (fs.statSync(p).isDirectory()) n = store.importSnapshot ? store.importSnapshot(p) : 0;
    else {
      const rows = readExport(fs.readFileSync(p, 'utf8'));
      if (store.importRows) n = await store.importRows(rows);
      else { n = 0; for (const x of rows) { store.set(x.col + '/' + x.id, x.data); n++; } }
    }
    await dialog.showMessageBox(win, { message: n + ' records brought in.' });
    reloadBoard();
  } catch (e) { dialog.showErrorBox('Could not bring that in', String(e.message || e)); }
}

function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.focus(); return; }
  settingsWin = new BrowserWindow({ width: 560, height: 720, title: 'Evolve OS Settings', parent: win, backgroundColor: '#0B0B0C',
    webPreferences: { preload: path.join(__dirname, 'settings-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  settingsWin.loadFile(path.join(__dirname, 'settings.html'));
}

function menu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Evolve OS', submenu: [{ role: 'about' }, { type: 'separator' },
      { label: 'Settings...', accelerator: 'Cmd+,', click: openSettings }, { type: 'separator' },
      { role: 'hide' }, { role: 'hideOthers' }, { type: 'separator' }, { role: 'quit' }] },
    { label: 'File', submenu: [{ label: 'Bring in board data...', click: bringIn }, { role: 'close' }] },
    { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }
  ]));
}

function open() {
  win = new BrowserWindow({ width: 1440, height: 900, minWidth: 380, minHeight: 600, title: 'Evolve OS', backgroundColor: '#0B0B0C',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  const external = url => /^https?:|^tel:|^mailto:/i.test(url) && shell.openExternal(url);
  win.webContents.setWindowOpenHandler(({ url }) => { external(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('evolve://')) { e.preventDefault(); external(url); } });
  win.loadURL('evolve://app/index.html');
  // For automated checks only: run a script, take a picture of the window and quit.
  if (process.env.EVOLVE_SHOT) win.webContents.once('did-finish-load', () => setTimeout(async () => {
    if (process.env.EVOLVE_EVAL) { await win.webContents.executeJavaScript(process.env.EVOLVE_EVAL).catch(e => fs.writeFileSync(process.env.EVOLVE_SHOT + '.err', String(e))); await new Promise(r => setTimeout(r, 1500)); }
    const img = await win.webContents.capturePage(); fs.writeFileSync(process.env.EVOLVE_SHOT, img.toPNG());
    const info = await win.webContents.executeJavaScript('JSON.stringify({build:typeof BUILD!=="undefined"?BUILD:null,sample:!!(typeof sample!=="undefined"&&sample),conn:(document.getElementById("connt")||{}).textContent||"",title:document.title})').catch(e => String(e));
    fs.writeFileSync(process.env.EVOLVE_SHOT + '.json', info); app.quit();
  }, Number(process.env.EVOLVE_SHOT_WAIT || 6000)));
}

app.whenReady().then(async () => {
  cfg = makeConfig(path.join(home(), '..', 'settings'), safeStorage);
  local = new LocalStore(home());
  google = new Google(cfg);
  if (local.isEmpty() && process.env.EVOLVE_SNAPSHOT && fs.existsSync(process.env.EVOLVE_SNAPSHOT)) local.importSnapshot(process.env.EVOLVE_SNAPSHOT);
  useStore(local);
  await connectSupabase().catch(() => false);
  serveBoard(); wire(); menu(); open();
  if (process.env.EVOLVE_SETTINGS_SHOT) setTimeout(() => { openSettings(); settingsWin.webContents.once('did-finish-load', () => setTimeout(async () => { const i = await settingsWin.webContents.capturePage(); fs.writeFileSync(process.env.EVOLVE_SETTINGS_SHOT, i.toPNG()); }, 800)); }, 1500);
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) open(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
