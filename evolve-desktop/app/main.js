// Evolve OS for Mac. Opens the board in its own window and answers the
// board's calls from a database on this machine (step 1) or Supabase (step 2).
'use strict';
const { app, BrowserWindow, ipcMain, protocol, net, shell, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { LocalStore } = require('./store');

const BOARD_DIR = path.join(__dirname, 'board');
const SHIM = fs.readFileSync(path.join(__dirname, 'shim', 'claude-shim.js'), 'utf8');
protocol.registerSchemesAsPrivileged([{ scheme: 'evolve', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);

let store, win;
function dataDir() { return process.env.EVOLVE_DATA_DIR || path.join(app.getPath('userData'), 'board-data'); }

function serveBoard() {
  protocol.handle('evolve', async req => {
    const u = new URL(req.url);
    let rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
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
  const guard = fn => async (_e, a) => { try { return await fn(a || {}); } catch (e) { throw Object.assign(new Error(e.message), { code: e.code || 'unavailable' }); } };
  ipcMain.handle('db:get', guard(a => store.get(a.path)));
  ipcMain.handle('db:set', guard(a => store.set(a.path, a.data)));
  ipcMain.handle('db:update', guard(a => store.update(a.path, a.data)));
  ipcMain.handle('db:delete', guard(a => store.delete(a.path)));
  ipcMain.handle('db:query', guard(a => store.query(a.col, a.q)));
  ipcMain.handle('db:acquire', guard(a => ({ acquired: true, holder: a.opts && a.opts.holder })));
  ipcMain.handle('host:caps', guard(() => ({})));
  ipcMain.handle('dl:save', guard(async a => {
    const r = await dialog.showSaveDialog(win, { defaultPath: path.join(app.getPath('downloads'), path.basename(String(a.filename || 'evolve-file'))) });
    if (r.canceled || !r.filePath) return { saved: false };
    const b = a.body || {};
    fs.writeFileSync(r.filePath, b.b64 != null ? Buffer.from(b.b64, 'base64') : String(b.text || ''));
    return { saved: true };
  }));
  store.onChange(ev => { for (const w of BrowserWindow.getAllWindows()) w.webContents.send('db:changed', ev); });
}

async function importFrom(dir) {
  const n = store.importSnapshot(dir);
  dialog.showMessageBox(win, { message: n + ' records copied in.' });
  if (win) win.reload();
}

function menu() {
  const t = [
    { label: 'Evolve OS', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { type: 'separator' }, { role: 'quit' }] },
    { label: 'File', submenu: [{ label: 'Bring in board data...', click: async () => {
      const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
      if (!r.canceled && r.filePaths[0]) importFrom(r.filePaths[0]);
    } }, { role: 'close' }] },
    { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(t));
}

function open() {
  win = new BrowserWindow({ width: 1440, height: 900, minWidth: 380, minHeight: 600, title: 'Evolve OS', backgroundColor: '#0B0B0C',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:|^tel:|^mailto:/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('evolve://')) { e.preventDefault(); if (/^https?:|^tel:|^mailto:/i.test(url)) shell.openExternal(url); } });
  win.loadURL('evolve://app/index.html');
  // For automated checks only: take a picture of the window and quit.
  if (process.env.EVOLVE_SHOT) win.webContents.once('did-finish-load', () => setTimeout(async () => {
    if (process.env.EVOLVE_EVAL) { await win.webContents.executeJavaScript(process.env.EVOLVE_EVAL).catch(e => fs.writeFileSync(process.env.EVOLVE_SHOT + '.err', String(e))); await new Promise(r => setTimeout(r, 1500)); }
    const img = await win.webContents.capturePage(); fs.writeFileSync(process.env.EVOLVE_SHOT, img.toPNG());
    const info = await win.webContents.executeJavaScript('JSON.stringify({build:typeof BUILD!=="undefined"?BUILD:null,db:!!window.db||typeof db!=="undefined",n:Object.keys((window.S&&S.pstate)||{}).length,conn:(document.getElementById("connt")||{}).textContent||""})').catch(e => String(e));
    fs.writeFileSync(process.env.EVOLVE_SHOT + '.json', info); app.quit();
  }, Number(process.env.EVOLVE_SHOT_WAIT || 6000)));
}

app.whenReady().then(() => {
  store = new LocalStore(dataDir());
  if (store.isEmpty() && process.env.EVOLVE_SNAPSHOT && fs.existsSync(process.env.EVOLVE_SNAPSHOT)) store.importSnapshot(process.env.EVOLVE_SNAPSHOT);
  serveBoard(); wire(); menu(); open();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) open(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
