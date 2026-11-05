// Claude on your own key. The main process holds the key and makes the call;
// the board window runs the conversation loop, because the tools Claude may
// call are functions inside the board.
'use strict';
const MODELS = { quick: 'claude-haiku-5-5', default: 'claude-sonnet-5-5', complex: 'claude-opus-5-5' };
const API = 'https://api.anthropic.com/v1/messages';

async function messages(key, { tier, system, messages, tools, maxTokens }, fetchImpl) {
  if (!key) { const e = new Error('Claude is not set up in this app yet. Add your key in Settings.'); e.code = 'not_granted'; throw e; }
  const body = { model: MODELS[tier] || MODELS.default, max_tokens: Math.min(Number(maxTokens) || 8192, 32000), messages };
  if (system) body.system = system;
  if (tools && tools.length) body.tools = tools.map(t => ({ name: t.name, description: t.description || '', input_schema: t.inputSchema || { type: 'object', properties: {} } }));
  const r = await (fetchImpl || fetch)(API, { method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error((j.error && j.error.message) || ('Claude answered ' + r.status));
    e.code = r.status === 401 ? 'not_granted' : r.status === 429 || r.status === 529 ? 'rate_limited' : 'upstream_error';
    throw e;
  }
  return { content: j.content || [], stop_reason: j.stop_reason, usage: j.usage || {}, model: j.model };
}
module.exports = { messages, MODELS };
