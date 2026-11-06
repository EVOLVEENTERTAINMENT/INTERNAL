// The only bridge between the board page and the app. The page gets two
// calls: invoke (ask the app for something) and on (hear that data changed).
// It never gets Node or the file system.
const { contextBridge, ipcRenderer } = require('electron');
const ALLOWED = new Set(['db:get', 'db:set', 'db:update', 'db:delete', 'db:query', 'db:acquire', 'dl:save', 'host:caps', 'ai:messages', 'mcp:call', 'mcp:list']);
contextBridge.exposeInMainWorld('evolveHost', {
  kind: 'mac',
  invoke: (ch, args) => (ALLOWED.has(ch) ? ipcRenderer.invoke(ch, args) : Promise.reject({ code: 'bad_request', message: 'unknown call ' + ch })),
  on: (ch, cb) => { if (ch === 'db:changed') ipcRenderer.on(ch, (_e, d) => cb(d)); }
});
