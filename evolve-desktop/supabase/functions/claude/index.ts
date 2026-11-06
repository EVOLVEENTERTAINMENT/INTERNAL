// Claude for the phone site. Runs on your Supabase project, holds the
// Anthropic key as a secret (ANTHROPIC_API_KEY), and only answers you: the
// signed in user must be OWNER_EMAIL. Same request and answer as the Mac app.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const MODELS: Record<string, string> = { quick: "claude-haiku-5-5", default: "claude-sonnet-5-5", complex: "claude-opus-5-5" };
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, x-client-info, apikey, content-type" };
const out = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const auth = req.headers.get("authorization") || "";
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { authorization: auth } } });
  const { data } = await sb.auth.getUser();
  const owner = (Deno.env.get("OWNER_EMAIL") || "").toLowerCase();
  if (!data.user || !owner || (data.user.email || "").toLowerCase() !== owner) return out(401, { error: "not signed in as the owner" });
  const a = await req.json().catch(() => ({}));
  const body: Record<string, unknown> = { model: MODELS[a.tier] || MODELS.default, max_tokens: Math.min(Number(a.maxTokens) || 8192, 32000), messages: a.messages || [] };
  if (a.system) body.system = a.system;
  if (Array.isArray(a.tools) && a.tools.length) body.tools = a.tools.map((t: any) => ({ name: t.name, description: t.description || "", input_schema: t.inputSchema || { type: "object", properties: {} } }));
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
    headers: { "content-type": "application/json", "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "", "anthropic-version": "2023-06-01" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return out(r.status === 429 || r.status === 529 ? 429 : 502, { error: j?.error?.message || ("Claude answered " + r.status) });
  return out(200, { content: j.content || [], stop_reason: j.stop_reason, usage: j.usage || {}, model: j.model });
});
