#!/usr/bin/env node
// Runs the feature checks: a made up board, the fake connectors and the fake
// Claude, then the real app in check mode (under xvfb-run when there is no
// display, straight on a Mac). Prints one line per check and exits with the
// app's own code. Usage: node test/check/run.js
//   EVOLVE_CHECK_WORK=<dir>   keep everything in this dir instead of a temp one
//   EVOLVE_APP=<binary>       run a built app instead of npx electron
//   EVOLVE_SHOT_WAIT=<ms>     wait after the page loads (6000)
//   EVOLVE_CHECK_TIMEOUT=<ms> stop the app after this long (420000)
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..');
const work = process.env.EVOLVE_CHECK_WORK || fs.mkdtempSync(path.join(os.tmpdir(), 'evolve-check-'));
const dir = n => { const p = path.join(work, n); fs.rmSync(p, { recursive: true, force: true }); fs.mkdirSync(p, { recursive: true }); return p; };
const sample = dir('sample'), data = dir('data'), out = dir('out'), downloads = dir('downloads'), fx = dir('fixtures');

const made = spawnSync(process.execPath, [path.join(root, 'test', 'make-sample-board.js'), sample], { stdio: 'inherit' });
if (made.status !== 0) { console.error('check: could not make the sample board'); process.exit(1); }
const files = require('./fixtures').write(fx);

const env = Object.assign({}, process.env, {
  EVOLVE_DATA_DIR: data, EVOLVE_SNAPSHOT: sample, EVOLVE_CHECK: out, EVOLVE_DOWNLOADS: downloads,
  EVOLVE_FAKE_MCP: files.mcp, EVOLVE_FAKE_AI: files.ai, EVOLVE_BRING_IN: files.bringIn,
  EVOLVE_SHOT_WAIT: process.env.EVOLVE_SHOT_WAIT || '6000'
});
let cmd, args;
if (process.env.EVOLVE_APP) { cmd = process.env.EVOLVE_APP; args = []; }
else { cmd = require('electron'); args = ['--no-sandbox', root]; }
if (process.platform !== 'darwin' && !process.env.DISPLAY) {
  const x = spawnSync('xvfb-run', ['--help'], { stdio: 'ignore' });
  if (!x.error) { args = ['-a', cmd].concat(args); cmd = 'xvfb-run'; }
  else console.error('check: no DISPLAY and no xvfb-run, trying without');
}
console.log('check: work dir ' + work);
const logFile = path.join(work, 'app.log');
const log = fs.openSync(logFile, 'w');
const child = spawn(cmd, args, { env, stdio: ['ignore', log, log] });
const limit = Number(process.env.EVOLVE_CHECK_TIMEOUT || 420000);
const timer = setTimeout(() => { console.error('check: no answer after ' + limit + ' ms, stopping the app'); child.kill('SIGKILL'); }, limit);
child.on('error', e => { clearTimeout(timer); console.error('check: could not start the app: ' + e.message); process.exit(1); });
child.on('exit', (code, sig) => { clearTimeout(timer); report(code, sig); });

function tail() {
  try { const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(l => !/ERROR:bus\.cc|ffmpeg_common|viz_main_impl/.test(l)); console.log(lines.slice(-25).join('\n')); } catch (e) {}
}
function report(code, sig) {
  let j = null;
  try { j = JSON.parse(fs.readFileSync(path.join(out, 'check.json'), 'utf8')); } catch (e) {}
  if (!j) { console.log('check: no check.json was written (app exit ' + (code == null ? sig : code) + '). Log: ' + logFile); tail(); process.exit(1); }
  for (const r of j.results) {
    const mark = r.skipped ? 'skip ' : r.ok ? 'ok   ' : r.known ? 'known' : 'FAIL ';
    const why = r.skipped ? '  (' + r.skipped + ')' : r.known ? '  (' + r.known + ')' : (!r.ok && r.detail) ? '  ' + r.detail : '';
    console.log(mark + ' ' + r.name + why);
  }
  for (const e of j.errors) console.log('ERROR ' + e);
  console.log(j.passed + ' passed, ' + j.failed + ' failed, ' + j.skipped + ' skipped, ' + j.known + ' known failures, ' + j.errors.length + ' console errors. Build ' + j.build + '. Screenshots and check.json in ' + out);
  if (!j.done) { console.log('check: the run did not finish. Log: ' + logFile); tail(); }
  // The verdict is the app's own (check.json ok), which is what its exit code
  // carries too; xvfb-run can replace that code with its own when it fails to
  // clean up its temp dir, so the file is trusted over the process code.
  if (j.done && j.ok) process.exit(0);
  if (code != null && code !== 0) process.exit(code);
  process.exit(1);
}
