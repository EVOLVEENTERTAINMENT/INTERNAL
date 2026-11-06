// The Capture Line in the app: pending captures come out oldest first, filed
// ones stop coming back, unknown or odd ids are ignored.
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path');
const { LocalStore } = require('../app/store'); const capture = require('../app/capture');
(async () => {
  const s = new LocalStore(fs.mkdtempSync(path.join(os.tmpdir(), 'cap-')));
  s.set('captures/p-2', { id: 'p-2', at: '2026-11-06T10:00:00Z', text: 'second', via: 'sms', from: '+1', state: 'pending' });
  s.set('captures/p-1', { id: 'p-1', at: '2026-11-06T09:00:00Z', text: 'first', via: 'voice', from: 'voice', state: 'pending' });
  s.set('captures/p-0', { id: 'p-0', at: '2026-11-06T08:00:00Z', text: 'old', via: 'voice', state: 'filed' });
  const a = await capture.call(s, 'get_pending', {});
  assert.deepEqual(a.items.map(x => x.id), ['p-1', 'p-2']); assert.equal(a.items[0].text, 'first');
  assert.deepEqual(await capture.call(s, 'mark_filed', { ids: ['p-1', 'nope', '../x', 5] }), { filed: 1 });
  assert.deepEqual((await capture.call(s, 'get_pending', {})).items.map(x => x.id), ['p-2']);
  await assert.rejects(capture.call(s, 'delete_all', {}), e => e.code === 'tool_error');
  console.log('capture ok');
})().catch(e => { console.error(e); process.exit(1); });
