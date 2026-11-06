// Claude calls against a fake fetch: a hung socket ends on the timeout, an
// abort rejects at once, a normal call returns usage, and usage adds up per
// Chicago day in the store.
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path');
const ai = require('../app/ai');
const { LocalStore } = require('../app/store');
const KEY = 'test-key-not-real';
const ok = body => ({ ok: true, status: 200, json: async () => body });
const reply = { content: [{ type: 'text', text: 'hi' }], stop_reason: 'end_turn', usage: { input_tokens: 12, output_tokens: 3 }, model: 'm' };
const since = t => Date.now() - t;
(async () => {
  // no key: the same rejection as before
  await assert.rejects(ai.messages('', { messages: [] }, async () => ok(reply)), e => e.code === 'not_granted');

  // a fetch that never settles and ignores the signal: the timeout still ends the call
  let t = Date.now();
  await assert.rejects(ai.messages(KEY, { messages: [{ role: 'user', content: 'x' }], timeoutMs: 40 }, () => new Promise(() => {})),
    e => e.code === 'timeout' && /time/.test(e.message));
  assert.ok(since(t) < 2000, 'timed out promptly');

  // a fetch that honours the signal the way undici does: same outcome
  const honouring = (url, opt) => new Promise((_, rej) => {
    assert.ok(opt.signal, 'fetch gets a signal');
    opt.signal.addEventListener('abort', () => { const e = new Error('This operation was aborted'); e.name = 'AbortError'; rej(e); });
  });
  t = Date.now();
  await assert.rejects(ai.messages(KEY, { messages: [], timeoutMs: 40 }, honouring), e => e.code === 'timeout');
  assert.ok(since(t) < 2000);

  // a body read that hangs after the headers came back also ends on the timeout
  await assert.rejects(ai.messages(KEY, { messages: [], timeoutMs: 40 }, async () => ({ ok: true, status: 200, json: () => new Promise(() => {}) })), e => e.code === 'timeout');

  // the caller's signal: rejects fast with code aborted, long before the timeout
  const ac = new AbortController();
  t = Date.now();
  const pending = ai.messages(KEY, { messages: [], timeoutMs: 60000, signal: ac.signal }, honouring);
  setTimeout(() => ac.abort(), 15);
  await assert.rejects(pending, e => e.code === 'aborted');
  assert.ok(since(t) < 2000, 'abort came back fast');

  // a signal that already fired: rejects with code aborted and fetch is never called
  const done = new AbortController(); done.abort();
  let fetched = 0;
  await assert.rejects(ai.messages(KEY, { messages: [], signal: done.signal }, async () => { fetched++; return ok(reply); }), e => e.code === 'aborted');
  assert.equal(fetched, 0, 'no fetch for a signal that already fired');

  // a normal call: body, headers, usage, and the key never leaks into the result
  let seen = null;
  const r = await ai.messages(KEY, { tier: 'quick', messages: [{ role: 'user', content: 'x' }], tools: [{ name: 'a', inputSchema: { type: 'object' } }] }, async (url, opt) => { seen = { url, opt }; return ok(reply); });
  assert.equal(seen.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(seen.opt.headers['x-api-key'], KEY);
  const sent = JSON.parse(seen.opt.body);
  assert.equal(sent.model, ai.MODELS.quick); assert.equal(sent.tools[0].input_schema.type, 'object');
  assert.deepEqual(r.usage, { input_tokens: 12, output_tokens: 3 }); assert.equal(r.content[0].text, 'hi');
  assert.ok(!JSON.stringify(r).includes(KEY));

  // upstream errors keep their codes
  await assert.rejects(ai.messages(KEY, { messages: [] }, async () => ({ ok: false, status: 429, json: async () => ({ error: { message: 'slow down' } }) })), e => e.code === 'rate_limited' && e.message === 'slow down');
  await assert.rejects(ai.messages(KEY, { messages: [] }, async () => ({ ok: false, status: 401, json: async () => ({}) })), e => e.code === 'not_granted');
  await assert.rejects(ai.messages(KEY, { messages: [] }, async () => { throw new Error('fetch failed'); }), e => e.message === 'fetch failed' && !e.code);

  // usage record: Chicago day, set when missing, then update adds up per tier
  assert.equal(ai.usageDay(new Date('2026-11-07T04:30:00Z')), '2026-11-06');   // 10:30 pm in Chicago
  assert.equal(ai.usageDay(new Date('2026-11-07T06:30:00Z')), '2026-11-07');
  const store = new LocalStore(fs.mkdtempSync(path.join(os.tmpdir(), 'evai-')));
  const now = new Date('2026-11-06T20:00:00Z');
  assert.equal(await ai.recordUsage(store, 'default', { input_tokens: 10, output_tokens: 5 }, now), 'usage/2026-11-06');
  await ai.recordUsage(store, 'default', { input_tokens: 7, output_tokens: 1, cache_read_input_tokens: 4 }, now);
  await ai.recordUsage(store, 'complex', { input_tokens: 100, output_tokens: 20 }, now);
  await ai.recordUsage(store, 'nope', { input_tokens: 1, output_tokens: 1 }, now);   // unknown tier counts as default
  const d = store.get('usage/2026-11-06');
  assert.equal(d.exists, true); assert.equal(d.data.day, '2026-11-06'); assert.equal(d.data.updated_at, now.toISOString());
  assert.deepEqual(d.data.default, { calls: 3, input_tokens: 18, output_tokens: 7, cache_read_input_tokens: 4 });
  assert.deepEqual(d.data.complex, { calls: 1, input_tokens: 100, output_tokens: 20 });
  assert.equal(d.version, 4);
  assert.equal(await ai.recordUsage(null, 'default', { input_tokens: 1 }), null);
  assert.equal(await ai.recordUsage(store, 'default', null), null);
  // a store that fails on update for another reason is reported, not hidden
  await assert.rejects(ai.recordUsage({ get: () => ({ exists: true, data: {} }), update: () => { const e = new Error('down'); e.code = 'unavailable'; throw e; }, set: () => {} }, 'default', { input_tokens: 1 }), e => e.code === 'unavailable');
  console.log('ai ok');
})().catch(e => { console.error(e); process.exit(1); });
