const { contextBridge, ipcRenderer } = require('electron');
const OK = new Set(['set:state', 'set:claude', 'set:supabase', 'set:signout', 'set:moveup']);
contextBridge.exposeInMainWorld('settings', { call: (ch, a) => (OK.has(ch) ? ipcRenderer.invoke(ch, a) : Promise.reject(new Error('unknown'))) });
