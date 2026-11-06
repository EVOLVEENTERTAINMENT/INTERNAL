// Made up fixtures for the check run: a small fake Google Calendar, a fake
// Capture Line, canned Claude answers and an export file to bring in. Dates
// are worked out at run time so the events land on today's board. Nothing
// here is real: the repo is public.
'use strict';
const fs = require('fs');
const path = require('path');

// The board reads these two calendar ids (app/board/index.html, CALS).
const EVOLVE_CAL = 'c_b6732cbe341dbd7cd12be7ec5d2685bbc8dd02bc1fb49585f96afc87cf110ca5@group.calendar.google.com';
const PERSONAL_CAL = 'c_ee8291538afcefb9b683088a58b672f4ff02af5b7fe8aa274df3444b2f8ae0fd@group.calendar.google.com';
const CAPTURE_TEXT = 'Sample capture: order more sample tape';
const CHAT_NOTE = 'Sample chat note from the fake Claude';
const BRING_IN_COUNT = 3;

const p2 = n => String(n).padStart(2, '0');
const at = (days, h, m) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); d.setHours(h, m || 0, 0, 0); return d; };
const dk = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
const iso = d => { const o = -d.getTimezoneOffset(), s = o < 0 ? '-' : '+', a = Math.abs(o);
  return dk(d) + 'T' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':00' + s + p2(Math.floor(a / 60)) + ':' + p2(a % 60); };
const tools = names => names.map(name => ({ name, description: '' }));

function build() {
  const now = new Date().toISOString();
  const ev = (id, summary, s, e) => ({ id, status: 'confirmed', summary, description: '', location: '',
    start: { dateTime: iso(s), timeZone: 'America/Chicago' }, end: { dateTime: iso(e), timeZone: 'America/Chicago' },
    updated: now, created: now, htmlLink: 'https://calendar.google.com/calendar/event?eid=' + id, organizer: { self: true }, attendees: [] });
  const mcp = {
    servers: [
      { server: 'Google Calendar', kind: 'connector', authStatus: 'connected', tools: tools(['list_events', 'get_event', 'create_event', 'update_event', 'delete_event']) },
      { server: 'Gmail', kind: 'connector', authStatus: 'connected', tools: tools(['search_threads', 'get_thread']) },
      { server: 'Capture Line', kind: 'connector', authStatus: 'connected', tools: tools(['get_pending', 'mark_filed']) }
    ],
    calendar: {
      [EVOLVE_CAL]: [ev('sampleev1', 'Sample edit block', at(0, 10), at(0, 11)), ev('sampleev2', 'Sample client call', at(0, 14), at(0, 15))],
      [PERSONAL_CAL]: [ev('sampleev3', 'Sample dentist', at(1, 9), at(1, 9, 30))]
    },
    captures: [{ id: 'cap1', at: now, text: CAPTURE_TEXT, via: 'sms', from: '+15550000000', state: 'pending' }],
    tools: { Gmail: { search_threads: {}, get_thread: { $error: { code: 'tool_error', message: 'no such thread in the fixture' } } } }
  };
  const text = o => ({ type: 'text', text: JSON.stringify(o) });
  const ai = {
    responses: [
      // the capture line: one catch_note, then the answer the board asked for
      { when: { prompt: 'WHAT HE SAID:', round: 1 }, content: [{ type: 'tool_use', id: 'fake_cap_1', name: 'catch_note', input: { text: CAPTURE_TEXT, from: '+15550000000' } }] },
      { when: { prompt: 'WHAT HE SAID:' }, content: [text({ did: 'Caught it onto the inbox', kind: 'note' })] },
      // the brain dump: two lines sorted
      { when: { prompt: 'Jackson pasted a brain dump' }, content: [text({
        items: [
          { id: 'L1', kind: 'task', title: 'Call the sample dentist', project: '', person: '', owner: 'Jackson', when_said: 'tomorrow', date: dk(at(1, 12)), mins: 15, start: '', start_from: '', cal: 'PERSONAL', dup_of: '', sure: true, why: 'a quick call' },
          { id: 'L2', kind: 'waiting', title: 'Sample Client owes the logo files', project: '', person: 'Sample Client', owner: 'Jackson', when_said: '', date: '', mins: 0, start: '', start_from: '', cal: 'EVOLVE', dup_of: '', sure: true, why: 'they owe him files' }
        ], questions: [], learned: [] })] },
      // the chat: one catch_note, then a reply
      { when: { prompt: 'The conversation so far:', round: 1 }, content: [{ type: 'tool_use', id: 'fake_chat_1', name: 'catch_note', input: { text: CHAT_NOTE } }] },
      { when: { prompt: 'The conversation so far:' }, content: [text({ reply: 'Caught it.' })] }
    ],
    fallback: { content: [text({ ok: true })] }
  };
  const bringIn = { format: 'evolve-os-export', version: 1, exported_at: now, build: 'check fixture', collections: {
    ideas: { idea_sample_1: { text: 'Sample idea brought in', at: now }, idea_sample_2: { text: 'Second sample idea brought in', at: now } },
    decisions: { dec_sample_1: { text: 'Sample decision brought in', at: now, project: 'samplecafe' } } } };
  return { mcp, ai, bringIn };
}

function write(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const b = build(), out = {};
  for (const k of Object.keys(b)) { out[k] = path.join(dir, 'fake-' + k + '.json'); fs.writeFileSync(out[k], JSON.stringify(b[k], null, 1)); }
  return out;
}

module.exports = { build, write, EVOLVE_CAL, PERSONAL_CAL, CAPTURE_TEXT, CHAT_NOTE, BRING_IN_COUNT };
