// A made-up board for checking the app on GitHub's Macs. No real data: the
// repo is public. Same shapes as the real collections. Usage: node test/make-sample-board.js <dir>
'use strict';
const fs = require('fs'); const path = require('path');
const out = process.argv[2]; if (!out) { console.error('usage: make-sample-board.js <dir>'); process.exit(2); }
const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10), now = new Date().toISOString();
const put = (col, id, data) => { fs.mkdirSync(path.join(out, col), { recursive: true }); fs.writeFileSync(path.join(out, col, id + '.json'), JSON.stringify({ id, data, version: 1, updatedAt: now })); };
const projects = [
  ['sample-cafe', 'Sample Cafe website', 'Sent and waiting on their sign off', 'solid', 2],
  ['sample-gym', 'Sample Gym promo video', 'Shooting next week', 'likely', 6],
  ['sample-dental', 'Sample Dental photos', 'Editing', 'solid', 1],
  ['sample-church', 'Sample Church livestream', 'Quote sent', 'maybe', 9]];
for (const [id, name, stage, confidence, n] of projects) put('projects', id, { name, stage, confidence, days_quiet: n, one_line: 'Made up project for testing.', next_action: 'Follow up', next_date: day(n % 4), done_so_far: 'Kickoff call', whats_left: 'Final delivery', blocked_by: '', moved_since: [], updated_at: now });
for (let i = 1; i <= 6; i++) put('scraps', 's' + i, { id: 's' + i, text: 'Sample note ' + i, at: now, state: i < 4 ? 'raw' : 'binned' });
put('waiting', 'w1', { id: 'w1', waiting_id: 'w1', type: 'ask', what: 'Sample logo files', who: 'Sample Client', since: day(-3), expected: day(1), state: 'waiting', updated_at: now });
put('mustdo', 'm1', { title: 'Send the sample invoice', small: 'Two minutes', eventId: '' });
for (let i = 1; i <= 5; i++) put('prospects', 'p' + i, { name: 'Sample Business ' + i, website: 'example.com', city_state: 'Auburn, AL', category: 'Restaurant', status: 'queued', state: 'queued', lane: 'call', rank: i, queue_pos: i, v7_score: 90 - i * 5, verdict: 'Dated site', why_dated: ['Not mobile friendly'], updated_at: now });
console.log('sample board in', out);
