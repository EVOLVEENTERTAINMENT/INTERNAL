/* Evolve OS capture line.
 *
 * Three ways in and out of one queue:
 *   POST /sms              Twilio posts here when the number gets a text.
 *   POST /note             the iPhone shortcut posts here when you talk to it.
 *   POST /mcp/<key>        the board, as a connector. This is the only way the
 *                          board can reach anything outside itself.
 *
 * Nothing here sends a message, writes a calendar or talks to anybody.
 * It holds what you said until the board comes and gets it.
 *
 * The key in the /mcp path is the credential. It lives in your Claude
 * settings, never in the board, so sharing the board never shares this.
 */

const JRPC = (id, result) => ({ jsonrpc: "2.0", id, result });
const JERR = (id, code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });

const json = (o, status) => new Response(JSON.stringify(o), {
  status: status || 200,
  headers: { "Content-Type": "application/json" }
});

/* Twilio signs the url plus every posted field, sorted by name and run
   together. If what we compute does not match what it sent, somebody else
   sent it, and it does not go on the board. */
async function twilioSigned(req, body, token, publicUrl) {
  const sig = req.headers.get("X-Twilio-Signature");
  if (!sig || !token) return false;
  let data = publicUrl || req.url;
  Object.keys(body).sort().forEach(k => { data += k + body[k]; });
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(token),
    { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const mine = btoa(String.fromCharCode.apply(null, new Uint8Array(mac)));
  if (mine.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < mine.length; i++) diff |= mine.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

/* E.164 on both sides before comparing, so +1 334 414 3215 and +13344143215
   are the same person. */
const digits = s => String(s || "").replace(/[^0-9]/g, "").replace(/^1(?=\d{10}$)/, "");

/* Constant time, so a wrong key cannot be found one character at a time. */
function sameKey(a, b) {
  a = String(a || ""); b = String(b || "");
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function put(env, text, from, via) {
  const t = String(text || "").trim();
  if (!t) return null;
  const id = "p:" + Date.now() + ":" + Math.random().toString(36).slice(2, 8);
  const row = { id, at: new Date().toISOString(), text: t.slice(0, 2000),
                from: String(from || "").slice(0, 40), via };
  await env.CAPTURES.put(id, JSON.stringify(row), { expirationTtl: 60 * 60 * 24 * 30 });
  return row;
}

async function pending(env) {
  const list = await env.CAPTURES.list({ prefix: "p:", limit: 100 });
  const rows = [];
  for (const k of list.keys) {
    const v = await env.CAPTURES.get(k.name);
    if (v) { try { rows.push(JSON.parse(v)); } catch (x) { /* skip a bad row */ } }
  }
  rows.sort((a, b) => String(a.at).localeCompare(String(b.at)));
  return rows;
}

const TOOLS = [
  {
    name: "get_pending",
    description: "Everything Jackson has texted or dictated to his capture number that the board has not filed yet. Oldest first. Read only.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "mark_filed",
    description: "Tell the line which captures the board has dealt with, so they stop coming back. Pass the ids from get_pending.",
    inputSchema: {
      type: "object",
      properties: { ids: { type: "array", items: { type: "string" } } },
      required: ["ids"], additionalProperties: false
    }
  }
];

async function runTool(env, name, args) {
  if (name === "get_pending") {
    const items = await pending(env);
    return { items, count: items.length };
  }
  if (name === "mark_filed") {
    const ids = Array.isArray(args && args.ids) ? args.ids.slice(0, 100) : [];
    let n = 0;
    for (const id of ids) {
      /* only ever a capture key, so this can never be turned on anything else */
      if (typeof id === "string" && id.indexOf("p:") === 0) { await env.CAPTURES.delete(id); n++; }
    }
    return { cleared: n };
  }
  throw new Error("no tool called " + name);
}

async function mcp(req, env) {
  let b = {};
  try { b = await req.json(); } catch (x) { return json(JERR(null, -32700, "that was not json"), 400); }
  const id = (b && b.id !== undefined) ? b.id : null;
  const m = b && b.method;

  if (m === "initialize") {
    const asked = b.params && b.params.protocolVersion;
    return json(JRPC(id, {
      protocolVersion: (typeof asked === "string" && asked) ? asked : "2025-06-18",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "evolve-capture-line", version: "1.0.0" }
    }));
  }
  /* a notification carries no id and expects no body */
  if (m === "notifications/initialized" || (m && m.indexOf("notifications/") === 0))
    return new Response(null, { status: 202 });
  if (m === "ping") return json(JRPC(id, {}));
  if (m === "tools/list") return json(JRPC(id, { tools: TOOLS }));
  if (m === "tools/call") {
    const nm = b.params && b.params.name;
    try {
      const out = await runTool(env, nm, (b.params && b.params.arguments) || {});
      return json(JRPC(id, {
        content: [{ type: "text", text: JSON.stringify(out) }],
        structuredContent: out,
        isError: false
      }));
    } catch (err) {
      return json(JRPC(id, {
        content: [{ type: "text", text: String((err && err.message) || err) }],
        isError: true
      }));
    }
  }
  if (m === "resources/list") return json(JRPC(id, { resources: [] }));
  if (m === "prompts/list") return json(JRPC(id, { prompts: [] }));
  return json(JERR(id, -32601, "this server does not do " + m), 200);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    /* ---- the board, as a connector ---- */
    if (path.indexOf("/mcp/") === 0) {
      if (!sameKey(path.slice(5), env.BOARD_KEY))
        return json(JERR(null, -32000, "no"), 404);
      if (req.method === "POST") return mcp(req, env);
      /* no server initiated stream, and nothing to delete */
      return new Response(null, { status: 405, headers: { Allow: "POST" } });
    }

    /* ---- a text arrives ---- */
    if (path === "/sms" && req.method === "POST") {
      const form = await req.formData();
      const body = {};
      for (const [k, v] of form.entries()) body[k] = String(v);
      if (!(await twilioSigned(req, body, env.TWILIO_AUTH_TOKEN, env.PUBLIC_SMS_URL)))
        return new Response("no", { status: 403 });
      const quiet = new Response("<Response></Response>",
        { headers: { "Content-Type": "text/xml" } });
      /* only your own phone can put things on your board */
      if (env.OWNER && digits(body.From) !== digits(env.OWNER)) return quiet;
      await put(env, body.Body, body.From, "sms");
      if (!env.ACK_TEXT || !env.ACK_TEXT.trim()) return quiet;
      const safe = env.ACK_TEXT.replace(/[<>&]/g,
        c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
      return new Response("<Response><Message>" + safe + "</Message></Response>",
        { headers: { "Content-Type": "text/xml" } });
    }

    /* ---- the button on your phone ---- */
    if (path === "/note" && req.method === "POST") {
      const auth = req.headers.get("Authorization") || "";
      if (!sameKey(auth.replace(/^Bearer\s+/i, ""), env.BOARD_KEY))
        return json({ error: "no" }, 401);
      let b = {};
      try { b = await req.json(); } catch (x) { return json({ error: "send json" }, 400); }
      const row = await put(env, b.text, env.OWNER || "voice", "voice");
      return row ? json({ ok: true, id: row.id }) : json({ error: "nothing in it" }, 400);
    }

    if (path === "/" || path === "/health")
      return json({ ok: true, name: "evolve capture line" });

    return json({ error: "not a thing here" }, 404);
  }
};
