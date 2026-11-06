// The money engine's own self test (evolve-os/engine/metest.js, B10 tests) runs
// under npm test, so the engine keeps passing as the app changes. The test is
// spawned as its own node process on the repo relative path and this fails on
// a non zero exit or a missing "0 failed" line.
const { spawnSync } = require('child_process'); const fs = require('fs'); const path = require('path');
const repo = path.join(__dirname, '..', '..');
const rel = { test: path.join('evolve-os', 'engine', 'metest.js'), me: path.join('evolve-os', 'engine', 'me.js') };
for (const k of Object.keys(rel)) {
  if (!fs.existsSync(path.join(repo, rel[k]))) { console.error('engine file missing: ' + rel[k]); process.exit(1); }
}
// metest.js takes the engine file as its first argument and requires it, so the path must be absolute or start with ./
const r = spawnSync(process.execPath, [rel.test, path.join(repo, rel.me)], { cwd: repo, encoding: 'utf8' });
const out = (r.stdout || '').trim(), lines = out ? out.split('\n') : [];
const summary = lines.length ? lines[lines.length - 1] : '(no output)';
if (r.error || r.status !== 0 || !/\b0 failed\b/.test(summary)) {
  process.stdout.write(out + '\n'); process.stderr.write(r.stderr || '');
  console.error('engine self test failed: ' + rel.test + ' exit ' + (r.error ? r.error.message : r.status) + ', ' + summary);
  process.exit(1);
}
console.log('engine ok (' + summary + ')');
