const { contextBridge, ipcRenderer } = require('electron');
const OK = new Set(['set:state', 'set:claude', 'set:supabase', 'set:signout', 'set:moveup', 'set:google', 'set:googleout', 'set:fda']);
contextBridge.exposeInMainWorld('settings', { call: (ch, a) => (OK.has(ch) ? ipcRenderer.invoke(ch, a) : Promise.reject(new Error('unknown'))) });
