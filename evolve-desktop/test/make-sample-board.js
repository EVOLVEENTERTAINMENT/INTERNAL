// A made-up board for checking the app on GitHub's Macs. No real data: the
// repo is public. Same shapes as the real collections. Usage: node test/make-sample-board.js <dir>
'use strict';
const fs = require('fs'); const path = require('path');
const out = process.argv[2]; if (!out) { console.error('usage: make-sample-board.js <dir>'); process.exit(2); }
const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10), now = new Date().toISOString();
const put = (col, id, data) => { fs.mkdirSync(path.join(out, col), { recursive: true }); fs.writeFileSync(path.join(out, col, id + '.json'), JSON.stringify({ id, data, version: 1, updatedAt: now })); };
// Project ids are slugs the way the board makes them (letters and digits only).
const projects = [
  ['samplecafe', 'Sample Cafe website', 'Sent and waiting on their sign off', 'solid', 2],
  ['samplegym', 'Sample Gym promo video', 'Shooting next week', 'likely', 6],
  ['sampledental', 'Sample Dental photos', 'Editing', 'solid', 1],
  ['samplechurch', 'Sample Church livestream', 'Quote sent', 'maybe', 9]];
for (const [id, name, stage, confidence, n] of projects) put('projects', id, { name, stage, confidence, days_quiet: n, one_line: 'Made up project for testing.', next_action: 'Follow up', next_date: day(n % 4), done_so_far: 'Kickoff call', whats_left: 'Final delivery', blocked_by: '', moved_since: [], updated_at: now });
for (let i = 1; i <= 6; i++) put('scraps', 's' + i, { id: 's' + i, text: 'Sample note ' + i, at: now, state: i < 4 ? 'raw' : 'binned' });
put('waiting', 'w1', { id: 'w1', waiting_id: 'w1', type: 'ask', what: 'Sample logo files', who: 'Sample Client', since: day(-3), expected: day(1), state: 'waiting', updated_at: now });
put('mustdo', 'm1', { title: 'Send the sample invoice', small: 'Two minutes', eventId: '' });
for (let i = 1; i <= 5; i++) put('prospects', 'p' + i, { name: 'Sample Business ' + i, website: 'example.com', city_state: 'Auburn, AL', category: 'Restaurant', cohort: 'local', status: 'queued', state: 'queued', lane: 'call', rank: i, queue_pos: i, v7_score: 90 - i * 5, verdict: 'Dated site', why_dated: ['Not mobile friendly'], updated_at: now });
// One row each for Money, Pipeline, Deliverables and a project task, so those pages have something to show.
put('invoices', 'i-sample-1', { id: 'i-sample-1', invoice_id: 'inv_sample1', client: 'Sample Cafe', what: 'Website, first half', amount: 1200, state: 'sent', sent: day(-10), due: day(20), paid: false, paidOn: '', payments: [], schema_version: 39, project: 'samplecafe' });
put('pipeline', 'sample-bakery-lead', { name: 'Sample Bakery', stage: 'New lead', opportunity_id: 'opp_sample1', kind: 'Photo day', value: '', value_num: 0, decide: '', nextMove: 'First touch email', touched: day(-2), next_touch: day(3), temperature: 'warm', source: 'Referral', owner: 'Jackson', schema_version: 39 });
put('tasks', 'tsk_sample1', { id: 'tsk_sample1', task_id: 'tsk_sample1', schema_version: 39, project: 'samplecafe', project_id: '', title: 'Sample task: send the mockups', status: 'todo', owner: 'Jackson', due: day(2), priority: '', phase: '', item: '', waiting_on: '', deliverable: '', depends: [], notes: '', created_at: now, updated_at: now });
put('duelist', 'd-sample-1', { id: 'd-sample-1', deliverable_id: 'del_sample1', schema_version: 39, name: 'Sample brand film', spec: '60 sec', brief: '', client: 'Sample Gym', due: day(7), state: 'In progress', owner: 'Jackson', owner_person_id: '', allowance: 2, rounds: [], project: 'samplegym' });
console.log('sample board in', out);
