// Claude for the phone site. Runs on your Supabase project, holds the
// Anthropic key as a secret (ANTHROPIC_API_KEY), and only answers you: the
// signed in user must be OWNER_EMAIL. Same request and answer as the Mac app.

const MODELS: Record<string, string> = { quick: "claude-haiku-5-5", default: "claude-sonnet-5-5", complex: "claude-opus-5-5" };
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, x-client-info, apikey, content-type" };
const out = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const auth = req.headers.get("authorization") || "";
  const who = await fetch(Deno.env.get("SUPABASE_URL") + "/auth/v1/user", { headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY") || "", authorization: auth } });
  const data = { user: who.ok ? await who.json().catch(() => null) : null };
  const owner = (Deno.env.get("OWNER_EMAIL") || "").toLowerCase();
  if (!data.user || !owner || (data.user.email || "").toLowerCase() !== owner) return out(401, { error: "not signed in as the owner" });
  let key = Deno.env.get("ANTHROPIC_API_KEY") || "";
  if (!key) {   // saved by the Mac app when you saved it in Settings
    const sk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const r = await fetch(Deno.env.get("SUPABASE_URL") + "/rest/v1/app_secrets?name=eq.anthropic&select=value", { headers: { apikey: sk, authorization: "Bearer " + sk } });
    const rows = r.ok ? await r.json().catch(() => []) : [];
    key = (rows[0] && rows[0].value) || "";
  }
  if (!key) return out(503, { error: "Claude has no key on Supabase yet" });
  const a = await req.json().catch(() => ({}));
  const body: Record<string, unknown> = { model: MODELS[a.tier] || MODELS.default, max_tokens: Math.min(Number(a.maxTokens) || 8192, 32000), messages: a.messages || [] };
  if (a.system) body.system = a.system;
  if (Array.isArray(a.tools) && a.tools.length) body.tools = a.tools.map((t: any) => ({ name: t.name, description: t.description || "", input_schema: t.inputSchema || { type: "object", properties: {} } }));
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return out(r.status === 429 || r.status === 529 ? 429 : 502, { error: j?.error?.message || ("Claude answered " + r.status) });
  return out(200, { content: j.content || [], stop_reason: j.stop_reason, usage: j.usage || {}, model: j.model });
});
