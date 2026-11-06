// Claude on your own key. The main process holds the key and makes the call;
// the board window runs the conversation loop, because the tools Claude may
// call are functions inside the board.
'use strict';
const MODELS = { quick: 'claude-haiku-5-5', default: 'claude-sonnet-5-5', complex: 'claude-opus-5-5' };
const API = 'https://api.anthropic.com/v1/messages';
// Every call ends. A socket that never answers is cut after this long.
const DEFAULT_TIMEOUT_MS = 120000;

function fail(code, message) { const e = new Error(message); e.code = code; return e; }

// Options: tier, system, messages, tools, maxTokens, plus
//   timeoutMs  how long the whole call may take (default 120 s)
//   signal     an AbortSignal; when it fires the call rejects with code "aborted"
// A call that runs out of time rejects with code "timeout".
async function messages(key, { tier, system, messages, tools, maxTokens, timeoutMs, signal }, fetchImpl) {
  if (!key) throw fail('not_granted', 'Claude is not set up in this app yet. Add your key in Settings.');
  // A signal that already fired: nothing goes on the wire.
  if (signal && signal.aborted) throw fail('aborted', 'cancelled');
  const body = { model: MODELS[tier] || MODELS.default, max_tokens: Math.min(Number(maxTokens) || 8192, 32000), messages };
  if (system) body.system = system;
  if (tools && tools.length) body.tools = tools.map(t => ({ name: t.name, description: t.description || '', input_schema: t.inputSchema || { type: 'object', properties: {} } }));

  const ac = new AbortController();
  let why = null;
  // The controller's signal goes to fetch. The race ends the call even when
  // the fetch given to us ignores that signal.
  let ended = null;
  const ending = new Promise((_, rej) => { ended = rej; });
  ac.signal.addEventListener('abort', () => ended(fail(why || 'aborted', why === 'timeout' ? 'Claude did not answer in time.' : 'cancelled')), { once: true });
  const stop = reason => { if (!why) why = reason; ac.abort(); };
  const onAbort = () => stop('aborted');
  if (signal) signal.addEventListener('abort', onAbort, { once: true });
  const ms = Number(timeoutMs) > 0 ? Number(timeoutMs) : DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => stop('timeout'), ms);
  const work = (async () => {
    const r = await (fetchImpl || fetch)(API, { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(body), signal: ac.signal });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = new Error((j.error && j.error.message) || ('Claude answered ' + r.status));
      e.code = r.status === 401 ? 'not_granted' : r.status === 429 || r.status === 529 ? 'rate_limited' : 'upstream_error';
      throw e;
    }
    return { content: j.content || [], stop_reason: j.stop_reason, usage: j.usage || {}, model: j.model };
  })();
  work.catch(() => {});   // the race below reports the result; nothing is left unhandled
  try {
    return await Promise.race([work, ending]);
  } catch (e) {
    if (why) throw fail(why, why === 'timeout' ? 'Claude did not answer in time.' : 'cancelled');
    throw e;
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
    if (!why) ac.abort();   // settled: release the socket if a body read is still open
  }
}

// Usage record, one document per Chicago day: usage/<YYYY-MM-DD>, with
// calls, input_tokens and output_tokens under each tier, plus updated_at.
// Data only. Nothing reads it yet.
function usageDay(d) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d || new Date());
}
const COUNTED = ['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens'];
async function recordUsage(store, tier, usage, now) {
  if (!store || !usage) return null;
  const t = MODELS[tier] ? tier : 'default';
  const day = usageDay(now);
  const p = 'usage/' + day;
  const cur = await store.get(p);
  const was = (cur && cur.exists && cur.data && cur.data[t]) || {};
  const row = { calls: (Number(was.calls) || 0) + 1 };
  for (const k of COUNTED) { if (usage[k] != null || was[k] != null) row[k] = (Number(was[k]) || 0) + (Number(usage[k]) || 0); }
  const patch = { [t]: row, updated_at: (now || new Date()).toISOString() };
  try {
    await store.update(p, patch);
  } catch (e) {
    if (e && e.code === 'not_found') await store.set(p, Object.assign({ day }, patch));
    else throw e;
  }
  return p;
}
module.exports = { messages, MODELS, DEFAULT_TIMEOUT_MS, usageDay, recordUsage };
