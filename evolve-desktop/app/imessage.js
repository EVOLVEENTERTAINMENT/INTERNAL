// Reading Messages on this Mac, read only. Messages keeps its history in
// ~/Library/Messages/chat.db. macOS only lets an app read it once you give
// the app Full Disk Access (System Settings, Privacy & Security). This file
// never sends anything: it has no way to.
'use strict';
const { execFile } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');
const DB = path.join(os.homedir(), 'Library', 'Messages', 'chat.db');
const APPLE_EPOCH = Date.UTC(2001, 0, 1);
const fail = (code, message) => { const e = new Error(message); e.code = code; return e; };

function available() { return process.platform === 'darwin' && fs.existsSync(DB); }
function sql(q) {
  return new Promise((resolve, reject) => {
    execFile('/usr/bin/sqlite3', ['-readonly', '-json', DB, q], { maxBuffer: 20 * 1024 * 1024 }, (e, out, errOut) => {
      if (e) return reject(/authorization denied|unable to open/i.test(String(errOut)) ? fail('not_granted', 'Give Evolve OS Full Disk Access so it can read Messages.') : fail('upstream_error', String(errOut || e.message).slice(0, 200)));
      try { resolve(out.trim() ? JSON.parse(out) : []); } catch (x) { reject(fail('upstream_error', 'could not read Messages')); }
    });
  });
}
// Newer macOS keeps the text inside a serialized attributed string.
function fromAttributed(hex) {
  if (!hex) return '';
  const b = Buffer.from(hex, 'hex'); let i = b.indexOf('NSString');
  if (i < 0) return '';
  i = b.indexOf(Buffer.from([0x01, 0x2b]), i); if (i < 0) return '';
  i += 2; let len = b[i++];
  if (len === 0x81) { len = b.readUInt16LE(i); i += 2; } else if (len === 0x82) { len = b.readUInt32LE(i); i += 4; }
  return b.slice(i, i + len).toString('utf8');
}
const when = ns => new Date(APPLE_EPOCH + Number(ns) / 1e6).toISOString();
const digits = s => String(s || '').replace(/[^0-9]/g, '').slice(-10);
function rowOut(r) {
  return { from: r.is_from_me ? 'me' : r.handle || '', text: r.text || fromAttributed(r.ab) || '', date: when(r.date), chat: r.chat || '', read: !!r.is_read };
}
const BASE = `select m.ROWID id, m.text, hex(m.attributedBody) ab, m.date, m.is_from_me, m.is_read, h.id handle, c.display_name chat
  from message m left join handle h on h.ROWID = m.handle_id
  left join chat_message_join j on j.message_id = m.ROWID left join chat c on c.ROWID = j.chat_id`;

async function call(tool, a) {
  if (!available()) throw fail('server_not_connected', 'Messages can only be read on your Mac.');
  const limit = Math.max(1, Math.min(Number(a.limit) || 15, 50));
  if (tool === 'get_unread_imessages') {
    const rows = await sql(BASE + ` where m.is_from_me = 0 and m.is_read = 0 and m.date > ${(Date.now() - 14 * 864e5 - APPLE_EPOCH) * 1e6} order by m.date desc limit ${limit}`);
    return { count: rows.length, messages: rows.map(rowOut) };
  }
  if (tool === 'read_imessages') {
    const d = digits(a.phone_number);
    if (d.length < 7) throw fail('bad_request', 'Give a phone number.');
    const rows = await sql(BASE + ` where replace(replace(replace(replace(replace(h.id,'+',''),'-',''),' ',''),'(',''),')','') like '%${d}' order by m.date desc limit ${limit}`);
    return { phone_number: a.phone_number, messages: rows.reverse().map(rowOut) };
  }
  throw fail('not_in_manifest', 'unknown Messages tool ' + tool);
}
module.exports = { call, available, fromAttributed };
