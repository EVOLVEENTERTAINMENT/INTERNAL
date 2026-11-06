// Hooks for automated checks. Everything in here stays off unless one of
// these is set, so a normal run of the app never touches it.
//
//   EVOLVE_TOUR=<dir>       open every tab, screenshot each, write tour.json, quit
//                           (exit 1 when a console error was seen or a tab did not open)
//   EVOLVE_SHOT=<png>       one screenshot after EVOLVE_EVAL (page JS), then quit
//   EVOLVE_CHECK=<dir>      run test/check/*.check.js against the board, write
//                           check.json and one screenshot per check file, quit
//                           (exit 1 when a check failed or a console error was seen)
//   EVOLVE_SHOT_WAIT=<ms>   how long to wait after the page loads (6000)
//   EVOLVE_DOWNLOADS=<dir>  a file save lands here, no dialog
//   EVOLVE_FAKE_MCP=<json>  the connectors answer from this file
//   EVOLVE_FAKE_AI=<json>   Claude answers from this file
//   EVOLVE_BRING_IN=<file>  File > Bring in board data picks this file, no dialog
//
// The fakes sit in front of the real handlers in main.js by wrapping
// ipcMain.handle, so main.js keeps its own code and preload.js keeps its
// list of channels. Every connector call and every Claude call is written
// to <out dir>/mcp-calls.json and ai-calls.json so a check can read what
// the board sent.
'use strict';
const fs = require('fs');
const path = require('path');
const { app, ipcMain, dialog, Menu } = require('electron');

const env = process.env;
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const fail = (code, message) => { const e = new Error(message); e.code = code; return e; };
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const wait = ms => new Promise(r => setTimeout(r, ms));
async function until(pred, ms, every) {
  const end = Date.now() + (ms || 8000);
  while (Date.now() < end) {
    let v = false;
    try { v = await pred(); } catch (e) { v = false; }
    if (v) return v;
    await wait(every || 150);
  }
  return false;
}
// Where the call logs go: the check dir, the tour dir, or next to the fixture.
function outDir() {
  return env.EVOLVE_CHECK || env.EVOLVE_TOUR || (env.EVOLVE_SHOT && path.dirname(env.EVOLVE_SHOT))
    || (env.EVOLVE_FAKE_MCP && path.dirname(env.EVOLVE_FAKE_MCP)) || (env.EVOLVE_FAKE_AI && path.dirname(env.EVOLVE_FAKE_AI)) || null;
}
function writeLog(name, rows) {
  const d = outDir(); if (!d) return;
  try { fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, name), JSON.stringify(rows, null, 1)); } catch (e) {}
}

/* ---- the fake connectors ------------------------------------------------
   Fixture file:
   { "servers": [ {server, kind, authStatus, tools:[{name}]} ],      what mcp:list returns
     "calendar": { "<calendarId>": [ google events ] },               a small Google Calendar kept in memory
     "captures": [ {id, at, text, via, from, state} ],                the Capture Line, kept in memory
     "tools": { "<server>": { "<tool>": result } } }                  anything else, canned
   A canned result may be {"$seq":[r1,r2]} (answered in order, the last one
   repeats) or {"$error":{code,message}} (the call fails with that code). */
class FakeMcp {
  constructor(fx) {
    this.fx = fx || {}; this.calls = []; this.seq = {}; this.n = 0;
    this.cal = {};
    for (const id of Object.keys(this.fx.calendar || {})) this.cal[id] = (this.fx.calendar[id] || []).map(clone);
    this.captures = (this.fx.captures || []).map(clone);
  }
  list() { return { servers: clone(this.fx.servers || []) }; }
  async call(a) {
    const rec = { at: new Date().toISOString(), server: a.server, tool: a.tool, input: clone(a.input || {}) };
    this.calls.push(rec);
    try {
      if (!(this.fx.servers || []).some(s => s.server === a.server)) throw fail('server_not_connected', a.server + ' is not in the fixture');
      const r = this.answer(a.server, a.tool, a.input || {});
      rec.ok = true; return r;
    } catch (e) { rec.error = e.code || 'tool_error'; throw e; }
    finally { writeLog('mcp-calls.json', this.calls); }
  }
  answer(server, tool, input) {
    if (server === 'Google Calendar' && this.fx.calendar) return this.calendar(tool, input);
    if (server === 'Capture Line' && this.fx.captures) return this.capture(tool, input);
    const t = ((this.fx.tools || {})[server] || {})[tool];
    if (t === undefined) throw fail('tool_error', 'no fixture for ' + server + ' ' + tool);
    if (t && typeof t === 'object' && !Array.isArray(t)) {
      if (t.$error) throw fail(t.$error.code || 'tool_error', t.$error.message || 'fixture error');
      if (Array.isArray(t.$seq)) { const k = server + '/' + tool, i = this.seq[k] || 0; this.seq[k] = i + 1; return clone(t.$seq[Math.min(i, t.$seq.length - 1)]); }
    }
    return clone(t);
  }
  // Same shapes google.js hands back, kept in memory so a create shows up in
  // the next list and an undo finds what it made.
  calendar(tool, a) {
    const id = a.calendarId || 'primary';
    const evs = this.cal[id] || (this.cal[id] = []);
    const now = new Date().toISOString();
    const when = t => (t ? { dateTime: t, timeZone: a.timeZone || 'America/Chicago' } : undefined);
    const side = s => +new Date((s && (s.dateTime || s.date)) || 0);
    if (tool === 'list_events') {
      const lo = a.startTime ? +new Date(a.startTime) : -Infinity, hi = a.endTime ? +new Date(a.endTime) : Infinity;
      const out = evs.filter(e => e.status !== 'cancelled' && side(e.end) > lo && side(e.start) < hi).map(clone);
      const r = { timeZone: a.timeZone || 'America/Chicago', updated: now };
      if (out.length) r.events = out;
      return r;
    }
    const find = () => evs.filter(e => e.id === a.eventId)[0];
    if (tool === 'get_event') { const e = find(); if (!e) throw fail('tool_error', 'Not Found'); return clone(e); }
    if (tool === 'create_event') {
      this.n++;
      const e = { id: 'fakeev' + this.n + Date.now().toString(36), status: 'confirmed', summary: a.summary || '', description: a.description || '',
        location: a.location || '', start: when(a.startTime), end: when(a.endTime), updated: now, created: now,
        htmlLink: 'https://calendar.google.com/calendar/event?eid=fake' + this.n, organizer: { self: true }, attendees: [] };
      evs.push(e); return clone(e);
    }
    if (tool === 'update_event') {
      const e = find(); if (!e) throw fail('tool_error', 'Not Found');
      ['summary', 'description', 'location'].forEach(k => { if (a[k] !== undefined) e[k] = a[k]; });
      if (a.startTime) e.start = when(a.startTime); if (a.endTime) e.end = when(a.endTime);
      e.updated = now; return clone(e);
    }
    if (tool === 'delete_event') { const e = find(); if (!e) throw fail('tool_error', 'Not Found'); e.status = 'cancelled'; e.updated = now; return {}; }
    throw fail('not_in_manifest', 'unknown calendar tool ' + tool);
  }
  // Same answers capture.js gives.
  capture(tool, a) {
    if (tool === 'get_pending') return { items: this.captures.filter(c => c.state !== 'filed').slice(0, 100).map(c => ({ id: c.id, at: c.at, text: c.text, via: c.via, from: c.from })) };
    if (tool === 'mark_filed') {
      let n = 0;
      for (const id of (Array.isArray(a.ids) ? a.ids : [])) { const c = this.captures.filter(x => x.id === id)[0]; if (c && c.state !== 'filed') { c.state = 'filed'; c.filed_at = new Date().toISOString(); n++; } }
      return { filed: n };
    }
    throw fail('tool_error', 'Capture Line has no tool ' + tool);
  }
}

/* ---- the fake Claude ----------------------------------------------------
   Fixture file:
   { "responses": [ { "when": {prompt, last, afterTool, round, tier}, "once": false,
                      "content": [ Anthropic content blocks ], "stop_reason": "end_turn" } ],
     "fallback": { "content": [...] } }
   The first response whose "when" matches answers. prompt and last are
   substrings of the first and the last user message, afterTool is the name
   of the tool whose result the last message carries, round counts the
   assistant turns so far plus one. A tool_use block makes the shim run the
   board's tool and come back for the next round. */
class FakeAi {
  constructor(fx) { this.fx = fx || {}; this.calls = []; this.used = new Set(); }
  async answer(a) {
    const msgs = Array.isArray(a.messages) ? a.messages : [];
    const textOf = m => (typeof m.content === 'string' ? m.content
      : (m.content || []).map(c => (c.type === 'text' ? c.text : c.type === 'tool_result' ? String(c.content || '') : '')).join('\n'));
    const users = msgs.filter(m => m.role === 'user');
    const first = users.length ? textOf(users[0]) : '', lastM = msgs[msgs.length - 1], last = lastM ? textOf(lastM) : '';
    const round = msgs.filter(m => m.role === 'assistant').length + 1;
    let afterTool = '';
    if (lastM && Array.isArray(lastM.content)) {
      const ids = lastM.content.filter(c => c.type === 'tool_result').map(c => c.tool_use_id);
      const prev = msgs[msgs.length - 2];
      if (prev && Array.isArray(prev.content)) prev.content.forEach(c => { if (c.type === 'tool_use' && ids.indexOf(c.id) >= 0) afterTool = c.name; });
    }
    const list = this.fx.responses || [];
    let hit = -1;
    for (let i = 0; i < list.length; i++) {
      const r = list[i], w = r.when || {};
      if (r.once && this.used.has(i)) continue;
      if (w.prompt && first.indexOf(w.prompt) < 0) continue;
      if (w.last && last.indexOf(w.last) < 0) continue;
      if (w.afterTool && w.afterTool !== afterTool) continue;
      if (w.round && w.round !== round) continue;
      if (w.tier && w.tier !== a.tier) continue;
      hit = i; break;
    }
    const r = hit >= 0 ? list[hit] : (this.fx.fallback || { content: [{ type: 'text', text: '{}' }] });
    if (hit >= 0) this.used.add(hit);
    // hits: which "when.prompt" markers the prompt carries, so a check can tell the flows apart
    const hits = list.map(x => x.when && x.when.prompt).filter((p, i, arr) => p && arr.indexOf(p) === i && first.indexOf(p) >= 0);
    this.calls.push({ at: new Date().toISOString(), tier: a.tier, round, afterTool, matched: hit, hits,
      tools: (a.tools || []).map(t => t.name), prompt: first.slice(0, 200), last: last.slice(0, 200) });
    writeLog('ai-calls.json', this.calls);
    const content = clone(r.content || []);
    return { content, stop_reason: r.stop_reason || (content.some(c => c.type === 'tool_use') ? 'tool_use' : 'end_turn'), usage: {}, model: 'fake' };
  }
}

const api = { fakes: {}, downloads: [], dialogs: [], fixtures: {} };

// Called once from main.js when it loads, before wire() registers the real
// handlers. Patches ipcMain.handle only when a fake is asked for.
function install() {
  // the board self update has no place in a check run, so its first look is pushed back an hour
  if (env.EVOLVE_CHECK && !env.EVOLVE_UPDATE_FIRST) env.EVOLVE_UPDATE_FIRST = String(3600000);
  if (env.EVOLVE_FAKE_MCP) { api.fixtures.mcp = readJson(env.EVOLVE_FAKE_MCP); api.fakes.mcp = new FakeMcp(api.fixtures.mcp); }
  if (env.EVOLVE_FAKE_AI) { api.fixtures.ai = readJson(env.EVOLVE_FAKE_AI); api.fakes.ai = new FakeAi(api.fixtures.ai); }
  const dl = env.EVOLVE_DOWNLOADS;
  if (api.fakes.mcp || api.fakes.ai || dl) {
    const real = ipcMain.handle.bind(ipcMain);
    ipcMain.handle = (ch, fn) => real(ch, wrap(ch, fn, dl));
  }
  if (env.EVOLVE_BRING_IN) {
    const file = env.EVOLVE_BRING_IN;
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] });
    dialog.showMessageBox = async (w, o) => { api.dialogs.push({ kind: 'message', text: String((o && o.message) || '') }); return { response: 0 }; };
    dialog.showErrorBox = (t, c) => { api.dialogs.push({ kind: 'error', text: String(t) + ': ' + String(c) }); };
  }
  return module.exports;
}
// Same answer main.js gives for a failed call: {error: {code, message}}, so
// the page sees the code. The fakes sit in front of that guard, so they
// need it here too.
const guarded = fn => async (e, a) => {
  try { return await fn(e, a); }
  catch (x) { return { error: { code: (x && x.code) || 'unavailable', message: String((x && x.message) || x) } }; }
};
function wrap(ch, fn, dl) {
  const f = api.fakes;
  if (ch === 'host:caps') return async (e, a) => { const r = await fn(e, a); if (f.mcp) r.mcp = true; if (f.ai) r.sample = true; return r; };
  // a check may clear api.fakes.mcp for a moment to reach the real handler
  if (ch === 'mcp:list' && f.mcp) return guarded((e, a) => (f.mcp ? f.mcp.list() : fn(e, a)));
  if (ch === 'mcp:call' && f.mcp) return guarded((e, a) => (f.mcp ? f.mcp.call(a || {}) : fn(e, a)));
  if (ch === 'ai:messages' && f.ai) return guarded((e, a) => f.ai.answer(a || {}));
  if (ch === 'dl:save' && dl) return guarded(async (e, a) => {
    a = a || {};
    const name = path.basename(String(a.filename || 'evolve-file')), b = a.body || {};
    fs.mkdirSync(dl, { recursive: true });
    const file = path.join(dl, name);
    fs.writeFileSync(file, b.b64 != null ? Buffer.from(b.b64, 'base64') : String(b.text || ''));
    api.downloads.push({ at: new Date().toISOString(), file, bytes: fs.statSync(file).size });
    return { saved: true };
  });
  return fn;
}

// Called from main.js once the board window exists.
function attach(win, o) {
  const errors = [];
  if (env.EVOLVE_TOUR || env.EVOLVE_CHECK) {
    win.webContents.on('console-message', (e, level, message, line, src) => { if (level >= 3) errors.push(String(message).slice(0, 300) + ' @' + path.basename(String(src || '')) + ':' + line); });
    win.webContents.on('render-process-gone', (e, d) => errors.push('renderer gone: ' + d.reason));
  }
  const waitMs = Number(env.EVOLVE_SHOT_WAIT || 6000);
  const js = s => win.webContents.executeJavaScript(s, true);
  const quiet = s => js(s).catch(e => 'ERR ' + e);
  if (env.EVOLVE_TOUR) win.webContents.once('did-finish-load', () => setTimeout(() => tour(win, o, errors, quiet).catch(e => { console.error('tour', e); app.exit(1); }), waitMs));
  if (env.EVOLVE_SHOT) win.webContents.once('did-finish-load', () => setTimeout(async () => {
    if (env.EVOLVE_EVAL) { await js(env.EVOLVE_EVAL).catch(e => fs.writeFileSync(env.EVOLVE_SHOT + '.err', String(e))); await wait(1500); }
    fs.writeFileSync(env.EVOLVE_SHOT, (await win.webContents.capturePage()).toPNG());
    const info = await js('JSON.stringify({build:typeof BUILD!=="undefined"?BUILD:null,sample:!!(typeof sample!=="undefined"&&sample),conn:(document.getElementById("connt")||{}).textContent||"",title:document.title})').catch(e => String(e));
    fs.writeFileSync(env.EVOLVE_SHOT + '.json', info); app.quit();
  }, waitMs));
  if (env.EVOLVE_CHECK) win.webContents.once('did-finish-load', () => setTimeout(() => checks(win, o, errors, js).catch(e => { console.error('check', e); app.exit(1); }), waitMs));
}

// Tour: every tab, one screenshot each, then the Settings window.
async function tour(win, o, errors, js) {
  const dir = env.EVOLVE_TOUR;
  fs.mkdirSync(dir, { recursive: true });
  const tabs = await js('[...document.querySelectorAll("#modes button[data-m]")].map(b=>({m:b.dataset.m,label:b.textContent.replace(/\\s+/g," ").trim()}))');
  const seen = [];
  for (const [i, t] of (Array.isArray(tabs) ? tabs : []).entries()) {
    await js('document.querySelector("#modes button[data-m=\'' + t.m + '\']").click()');
    await wait(1800);
    const shot = String(i + 1).padStart(2, '0') + '-' + t.m + '.png';
    fs.writeFileSync(path.join(dir, shot), (await win.webContents.capturePage()).toPNG());
    seen.push(Object.assign({ shot, current: await js('(document.querySelector("#modes button[aria-current=true]")||{}).dataset?.m||""') }, t));
  }
  o.openSettings();
  await wait(2500);
  const sw = o.settingsWin();
  if (sw && !sw.isDestroyed()) fs.writeFileSync(path.join(dir, '99-settings.png'), (await sw.webContents.capturePage()).toPNG());
  const info = await js('({build:typeof BUILD!=="undefined"?BUILD:null,title:document.title})');
  const wrong = seen.filter(t => t.current !== t.m).map(t => t.m);
  const ok = !errors.length && !wrong.length && seen.length > 0 && !!(info && info.build);
  fs.writeFileSync(path.join(dir, 'tour.json'), JSON.stringify({ app: app.getVersion(), platform: process.platform, arch: process.arch, info, tabs: seen, errors, wrong, ok }, null, 1));
  console.log('tour ' + (ok ? 'ok' : 'FAILED') + ': ' + seen.length + ' tabs, ' + errors.length + ' console errors' + (wrong.length ? ', did not open: ' + wrong.join(', ') : ''));
  app.exit(ok ? 0 : 1);
}

/* ---- the check run ------------------------------------------------------
   A check file exports one of:
     a string            page JS, resolves to [{name, ok, detail}]
     a function          runs in the page as fn(H), H.t(name, ok, detail) records
     { main: async ctx => ... }   runs in the main process; ctx.page(fn, arg)
                         runs a page function, ctx.t records, ctx.readCol reads
                         what is on disk, ctx.mcpCalls() lists connector calls
   and may export KNOWN_FAILURES = [{name, why}]: a failed check with that
   name is reported as known and does not fail the run. */
const HELPERS = String(function () {
  const results = [];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const until = async (pred, ms, every) => {
    const end = Date.now() + (ms || 8000);
    while (Date.now() < end) { let v = false; try { v = await pred(); } catch (e) { v = false; } if (v) return v; await wait(every || 120); }
    return false;
  };
  const t = (name, ok, detail) => { results.push({ name: String(name), ok: !!ok, detail: detail === undefined || detail === null ? '' : String(detail).slice(0, 300) }); return !!ok; };
  const skip = (name, why) => { results.push({ name: String(name), ok: true, skipped: String(why || 'skipped') }); };
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.prototype.slice.call(document.querySelectorAll(sel));
  const text = sel => ((typeof sel === 'string' ? $(sel) : sel) || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim();
  const has = (sel, s) => text(sel).indexOf(s) >= 0;
  const click = sel => { const el = typeof sel === 'string' ? $(sel) : sel; if (!el) return false; el.click(); return true; };
  const button = (label, root) => $$((root || '#stage') + ' button').filter(b => b.textContent.replace(/\s+/g, ' ').trim() === label)[0] || null;
  const tab = async m => { click('#modes button[data-m="' + m + '"]'); await wait(300); };
  // the prompt2 form: fields are #p2f-0, #p2f-1 ... in the order the board lists them
  const fill = vals => { let n = 0; Object.keys(vals).forEach(k => { const el = $('#p2f-' + k); if (!el) return; el.value = vals[k]; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); n++; }); return n; };
  const modal = label => { const m = $('.veil .modal'); if (!m) return false; const b = $$('.veil .modal button').filter(x => x.textContent.trim() === (label || 'Save'))[0]; if (!b) return false; b.click(); return true; };
  const section = title => $$('#stage .dsec').filter(s => { const h = s.querySelector('.hd h3'); return h && h.textContent.trim() === title; })[0] || null;
  const rows = title => { const s = section(title); return s ? $$('.rw').filter(r => s.contains(r)).map(r => ({ nm: text(r.querySelector('.nm')), sb: text(r.querySelector('.sb')), tag: text(r.querySelector('.tag')), el: r })) : []; };
  const toasts = () => $$('#toast .tst').map(x => x.textContent.replace(/\s+/g, ' ').trim());
  return { results, wait, until, t, skip, $, $$, text, has, click, button, tab, fill, modal, section, rows, toasts };
});
function pageCode(fn, arg) {
  const src = typeof fn === 'string' ? '(async function(H){' + fn + '})' : '(' + fn.toString() + ')';
  // a throw inside the page function keeps the results recorded before it
  return '(async()=>{const H=(' + HELPERS + ')();let r=null,err=null;try{r=await ' + src + '(H,' + JSON.stringify(arg === undefined ? null : arg) + ');}'
    + 'catch(e){err=String((e&&e.stack)||e).slice(0,400);}'
    + 'return {results:H.results.concat(Array.isArray(r)?r:[]),value:(Array.isArray(r)||r===undefined)?null:r,error:err};})()';
}
function withTimeout(p, ms, what) {
  let t; const guard = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(what + ' took more than ' + ms + ' ms')), ms); });
  return Promise.race([p, guard]).finally(() => clearTimeout(t));
}
async function checks(win, o, errors, js) {
  const dir = env.EVOLVE_CHECK;
  fs.mkdirSync(dir, { recursive: true });
  const checkDir = env.EVOLVE_CHECK_DIR || path.resolve(__dirname, '..', 'test', 'check');
  const dataDir = env.EVOLVE_DATA_DIR || path.join(app.getPath('userData'), 'board-data');
  const files = fs.existsSync(checkDir) ? fs.readdirSync(checkDir).filter(f => f.endsWith('.check.js')).sort() : [];
  const results = [];
  const ready = ms => until(() => js('typeof BUILD!=="undefined"&&!!document.getElementById("modes")&&typeof S!=="undefined"&&!!S.migrated'), ms || 30000, 250);
  const info = await js('({build:typeof BUILD!=="undefined"?BUILD:null,title:document.title})').catch(() => ({ build: null, title: '' }));
  const write = (done) => {
    const failed = results.filter(r => !r.ok && !r.known).length;
    const passed = results.filter(r => r.ok && !r.skipped).length;
    const skipped = results.filter(r => r.skipped).length, known = results.filter(r => r.known).length;
    const ok = done && !failed && !errors.length;
    fs.writeFileSync(path.join(dir, 'check.json'), JSON.stringify({ app: app.getVersion(), build: (info && info.build) || null, platform: process.platform, arch: process.arch,
      done, ok, passed, failed, skipped, known, files: files.length, results, errors }, null, 1));
    return ok;
  };
  if (!(await ready())) results.push({ file: '', name: 'board did not get ready', ok: false, detail: JSON.stringify(info) });
  const menuClick = label => {
    const walk = items => { for (const it of items || []) { if (it.label === label && typeof it.click === 'function') { it.click(it, win, {}); return true; } if (it.submenu && walk(it.submenu.items)) return true; } return false; };
    const m = Menu.getApplicationMenu(); return !!(m && walk(m.items));
  };
  for (const [i, file] of files.entries()) {
    const base = file.replace(/\.check\.js$/, '');
    const got = [];
    const ctx = {
      win, dir, dataDir, env, js, wait, until, ready, results: got, menuClick,
      fixtures: api.fixtures, dialogs: api.dialogs, downloads: api.downloads,
      mcpCalls: () => (api.fakes.mcp ? api.fakes.mcp.calls.slice() : []),
      aiCalls: () => (api.fakes.ai ? api.fakes.ai.calls.slice() : []),
      t: (name, ok, detail) => { got.push({ name: String(name), ok: !!ok, detail: detail === undefined || detail === null ? '' : String(detail).slice(0, 300) }); return !!ok; },
      skip: (name, why) => { got.push({ name: String(name), ok: true, skipped: String(why || 'skipped') }); },
      page: async (fn, arg) => {
        const r = await js(pageCode(fn, arg));
        got.push(...((r && r.results) || []));
        if (r && r.error) got.push({ name: base + ': page', ok: false, detail: r.error.slice(0, 300) });
        return r ? r.value : null;
      },
      readCol: col => { try { return JSON.parse(fs.readFileSync(path.join(dataDir, encodeURIComponent(col) + '.json'), 'utf8')); } catch (e) { return {}; } },
      nextLoad: ms => new Promise(res => { let done = false; const fin = v => { if (!done) { done = true; res(v); } }; win.webContents.once('did-finish-load', () => fin(true)); setTimeout(() => fin(false), ms || 20000); }),
      shot: async name => { fs.writeFileSync(path.join(dir, name), (await win.webContents.capturePage()).toPNG()); }
    };
    let mod = null;
    try { mod = require(path.join(checkDir, file)); } catch (e) { got.push({ name: base + ': load', ok: false, detail: String(e && e.stack || e).slice(0, 300) }); }
    const t0 = Date.now();
    if (mod) {
      try {
        await withTimeout((async () => {
          if (typeof mod === 'string' || typeof mod === 'function') await ctx.page(mod);
          else if (mod && typeof mod === 'object') {
            if (mod.page) await ctx.page(mod.page);
            if (typeof mod.main === 'function') { const extra = await mod.main(ctx); if (Array.isArray(extra)) got.push(...extra); }
          }
        })(), Number(env.EVOLVE_CHECK_FILE_MS || 120000), base);
      } catch (e) { got.push({ name: base + ': run', ok: false, detail: String(e && e.message || e).slice(0, 300) }); }
    }
    const known = (mod && Array.isArray(mod.KNOWN_FAILURES)) ? mod.KNOWN_FAILURES : [];
    for (const r of got) {
      r.file = file;
      if (!r.ok) { const k = known.filter(x => x && x.name === r.name)[0]; if (k) r.known = String(k.why || 'known'); }
    }
    results.push(...got);
    try { fs.writeFileSync(path.join(dir, String(i + 1).padStart(2, '0') + '-' + base + '.png'), (await win.webContents.capturePage()).toPNG()); } catch (e) {}
    const bad = got.filter(r => !r.ok && !r.known).length;
    console.log('check ' + base + ': ' + got.length + ' checks, ' + bad + ' failed, ' + (Date.now() - t0) + ' ms');
    write(false);
    await ready();
  }
  const ok = write(true);
  console.log('check ' + (ok ? 'ok' : 'FAILED') + ': ' + results.filter(r => r.ok && !r.skipped).length + ' passed, '
    + results.filter(r => !r.ok && !r.known).length + ' failed, ' + results.filter(r => r.skipped).length + ' skipped, '
    + results.filter(r => r.known).length + ' known, ' + errors.length + ' console errors');
  app.exit(ok ? 0 : 1);
}

module.exports = { install, attach, api, FakeMcp, FakeAi };
