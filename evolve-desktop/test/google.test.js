// The Google connection, against a stand-in Google that answers like the
// real one, checked for the shapes the board reads.
const assert = require('assert'); const os = require('os'); const fs = require('fs'); const path = require('path');
const { Google, plainText } = require('../app/google');
const { create } = require('../app/config');
const { fromAttributed } = require('../app/imessage');
const cfg = create(fs.mkdtempSync(path.join(os.tmpdir(), 'evg-')), null);
cfg.set({ googleClientId: 'cid', googleEmail: 'jackson@example.com' }); cfg.setSecret('googleRefresh', 'r1');
const calls = [];
const json = (o, st) => ({ ok: (st || 200) < 400, status: st || 200, json: async () => o });
const fake = async (url, opt) => {
  calls.push([opt.method || 'GET', String(url), opt.body]);
  if (url.includes('oauth2.googleapis.com/token')) return json({ access_token: 'a1', expires_in: 3600 });
  if (url.includes('/events?') && (opt.method || 'GET') === 'GET') return json({ kind: 'calendar#events', summary: 'cal', timeZone: 'America/Chicago', items: [{ kind: 'calendar#event', id: 'e1', summary: 'Shoot', start: { dateTime: '2026-11-06T10:00:00-06:00' } }] });
  if (url.includes('/events/e1?sendUpdates')) return opt.method === 'DELETE' ? { ok: true, status: 204 } : json({ id: 'e1', summary: 'Shoot' });
  if (url.includes('/events?sendUpdates')) return json({ id: 'new1' });
  if (url.includes('/threads?')) return json({ threads: [{ id: 't1' }], resultSizeEstimate: 1 });
  if (url.includes('/threads/t1?format=metadata')) return json({ id: 't1', messages: [{ id: 'm1', threadId: 't1', internalDate: '1793916788000', labelIds: ['INBOX'], snippet: 'hey',
    payload: { headers: [{ name: 'From', value: 'Mom <mom@example.com>' }, { name: 'To', value: 'jackson@example.com' }, { name: 'Subject', value: 'Dinner' }] } }] });
  if (url.includes('/threads/t1?format=full')) return json({ id: 't1', messages: [{ id: 'm1', threadId: 't1', internalDate: '1793916788000',
    payload: { mimeType: 'multipart/alternative', headers: [], parts: [{ mimeType: 'text/plain', body: { data: Buffer.from('See you at 7').toString('base64url') } }] } }] });
  return json({ error: { message: 'unexpected ' + url } }, 500);
};
(async () => {
  const g = new Google(cfg, fake);
  const l = await g.calendar('list_events', { calendarId: 'c@x', startTime: '2026-11-06T00:00:00-06:00', endTime: '2026-11-07T00:00:00-06:00', orderBy: 'startTime', pageSize: 250, timeZone: 'America/Chicago' });
  assert.equal(l.events.length, 1); assert.equal(l.items, undefined); assert.equal(l.events[0].kind, undefined); assert.equal(l.timeZone, 'America/Chicago');
  assert.ok(calls[1][1].includes('singleEvents=true') && calls[1][1].includes('timeMin=2026-11-06T00%3A00%3A00-06%3A00'));
  const c = await g.calendar('create_event', { calendarId: 'c@x', summary: 'X', startTime: 'S', endTime: 'E', description: 'd', notificationLevel: 'NONE' });
  assert.equal(c.id, 'new1'); const cb = JSON.parse(calls[calls.length - 1][2]); assert.deepEqual(cb.start, { dateTime: 'S' }); assert.ok(calls[calls.length - 1][1].includes('sendUpdates=none'));
  await g.calendar('update_event', { calendarId: 'c@x', eventId: 'e1', startTime: 'S2', endTime: 'E2', notificationLevel: 'NONE' });
  const ub = JSON.parse(calls[calls.length - 1][2]); assert.deepEqual(Object.keys(ub).sort(), ['end', 'start'], 'update sends only what it was given');
  assert.deepEqual(await g.calendar('delete_event', { calendarId: 'c@x', eventId: 'e1' }), {});
  const s = await g.gmail('search_threads', { query: 'newer_than:2d', pageSize: 6, view: 'THREAD_VIEW_MINIMAL' });
  assert.equal(s.threads[0].messages[0].sender, 'mom@example.com'); assert.equal(s.threads[0].messages[0].subject, 'Dinner');
  assert.equal(s.threads[0].messageCount, 1); assert.ok(s.threads[0].viewUrl.includes('#all/t1'));
  const t = await g.gmail('get_thread', { threadId: 't1', messageFormat: 'PLAIN_TEXT' });
  assert.equal(t.messages[0].plaintextBody, 'See you at 7');
  await assert.rejects(g.gmail('send_message', {}), e => e.code === 'not_in_manifest');
  assert.equal(calls.filter(x => x[1].includes('/token')).length, 1, 'one token refresh, then reused');
  // attributed string text from newer macOS Messages
  const blob = Buffer.concat([Buffer.from('xxNSStringyy'), Buffer.from([0x01, 0x2b, 5]), Buffer.from('hello'), Buffer.from('zz')]);
  assert.equal(fromAttributed(blob.toString('hex')), 'hello');
  console.log('google ok');
})().catch(e => { console.error(e); process.exit(1); });
