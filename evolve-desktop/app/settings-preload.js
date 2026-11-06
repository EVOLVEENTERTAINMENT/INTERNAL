const { contextBridge, ipcRenderer } = require('electron');
const OK = new Set(['set:state', 'set:claude', 'set:supabase', 'set:signout', 'set:moveup', 'set:google', 'set:googleout', 'set:fda']);
// main.js answers a failed call with {error: {code, message}}; that is the rejection here
const unwrap = r => { if (r && r.error && r.error.code) { const e = new Error(r.error.message); e.code = r.error.code; throw e; } return r; };
contextBridge.exposeInMainWorld('settings', { call: (ch, a) => (OK.has(ch) ? ipcRenderer.invoke(ch, a).then(unwrap) : Promise.reject(new Error('unknown'))) });
