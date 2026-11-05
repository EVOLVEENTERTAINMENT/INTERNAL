// Settings kept on this Mac. Plain settings go in config.json. Secrets (the
// Claude key, the Supabase sign in session) are encrypted with the Mac's
// keychain through Electron safeStorage before they touch the disk.
'use strict';
const fs = require('fs');
const path = require('path');

function create(dir, safe) {
  fs.mkdirSync(dir, { recursive: true });
  const cfgFile = path.join(dir, 'config.json'), secFile = path.join(dir, 'secrets.bin');
  const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } };
  const write = (f, v) => { fs.writeFileSync(f + '.tmp', JSON.stringify(v, null, 1)); fs.renameSync(f + '.tmp', f); };
  const secrets = () => {
    try { const b = fs.readFileSync(secFile); return JSON.parse(safe && safe.isEncryptionAvailable() ? safe.decryptString(b) : b.toString('utf8')); }
    catch (e) { return {}; }
  };
  const saveSecrets = v => {
    const s = JSON.stringify(v);
    fs.writeFileSync(secFile, safe && safe.isEncryptionAvailable() ? safe.encryptString(s) : Buffer.from(s, 'utf8'));
  };
  return {
    get: () => read(cfgFile, {}),
    set: patch => { const c = Object.assign(read(cfgFile, {}), patch); write(cfgFile, c); return c; },
    secret: k => secrets()[k],
    setSecret: (k, v) => { const s = secrets(); if (v == null || v === '') delete s[k]; else s[k] = v; saveSecrets(s); },
    hasSecret: k => !!secrets()[k],
    encrypted: () => !!(safe && safe.isEncryptionAvailable()),
    // a storage adapter for supabase-js, so the sign in survives a restart
    authStorage: () => ({
      getItem: k => { const v = secrets()['sb:' + k]; return v == null ? null : v; },
      setItem: (k, v) => { const s = secrets(); s['sb:' + k] = v; saveSecrets(s); },
      removeItem: k => { const s = secrets(); delete s['sb:' + k]; saveSecrets(s); }
    })
  };
}
module.exports = { create };
