// Builds the phone site into web/dist: the sign in page, then the same board
// the Mac app runs, with the doorway and the Supabase host in front of it.
// Needs EVOLVE_SUPABASE_URL and EVOLVE_SUPABASE_ANON (both safe to publish:
// the anon key only works for someone signed in).
'use strict';
const fs = require('fs'); const path = require('path');
const R = path.join(__dirname, '..'), OUT = path.join(__dirname, 'dist');
const url = process.env.EVOLVE_SUPABASE_URL || 'https://agjtcdbxlqomlgqgoutd.supabase.co', anon = process.env.EVOLVE_SUPABASE_ANON || 'sb_publishable_euJcVW3q5ZSRZyMIQ8H3hg_P_MXSs64';
if (!url || !anon) { console.error('Set EVOLVE_SUPABASE_URL and EVOLVE_SUPABASE_ANON first.'); process.exit(2); }
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, 'media'), { recursive: true });
const cp = (a, b) => fs.copyFileSync(path.join(R, a), path.join(OUT, b));
cp('node_modules/@supabase/supabase-js/dist/umd/supabase.js', 'supabase.js');
cp('web/host.js', 'host.js'); cp('app/shim/claude-shim.js', 'shim.js'); cp('web/signin.html', 'index.html'); cp('build/icon.png', 'icon.png');
for (const f of fs.readdirSync(path.join(R, 'app/board/media'))) cp('app/board/media/' + f, 'media/' + f);
fs.writeFileSync(path.join(OUT, 'config.js'), 'window.EVOLVE_WEB=' + JSON.stringify({ url, anon, claude: process.env.EVOLVE_WEB_CLAUDE !== '0' }) + ';\n');
const ref = new URL(url).hostname.split('.')[0];   // the same storage key supabase-js uses
const gate = `<script>try{if(!localStorage.getItem('sb-${ref}-auth-token'))location.replace('index.html')}catch(e){}</script>`;
const head = gate + '<script src="supabase.js"></script><script src="config.js"></script><script src="host.js"></script><script src="shim.js"></script>'
  + '<meta name="theme-color" content="#0B0B0C"><link rel="apple-touch-icon" href="icon.png"><meta name="apple-mobile-web-app-capable" content="yes">';
const board = fs.readFileSync(path.join(R, 'app/board/index.html'), 'utf8').replace('<head>', '<head>' + head);
fs.writeFileSync(path.join(OUT, 'board.html'), board);
fs.writeFileSync(path.join(OUT, '_headers'), '/*\n  X-Frame-Options: DENY\n  Referrer-Policy: same-origin\n');
console.log('built', OUT);
