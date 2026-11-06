// The Capture Line on your Supabase project, replacing the Cloudflare worker
// that was never deployed. Nothing here sends a message or talks to anyone.
// It files what you said as a pending capture, and the Mac app's board pulls
// it in (get_pending, then mark_filed).
//   POST /capture/note  iPhone shortcut. Header Authorization: Bearer <CAPTURE_KEY>, JSON {"text": "..."}
//                       Optional id (header X-Capture-Id or JSON "id"; letters, digits, dash, underscore,
//                       up to 64): the note is filed once under captures/<id>, and a repeat with the same
//                       id gets the record already filed instead of a second one. Without an id, every
//                       call files a new note under a fresh id, as before.
//   POST /capture/sms   Twilio, when the number gets a text. Signed by Twilio; only OWNER_PHONE gets in.
//   GET  /capture/key   the app, signed in as you, to set up the shortcut.
// Secrets: CAPTURE_KEY, OWNER_EMAIL, OWNER_PHONE, and TWILIO_AUTH_TOKEN once there is a number.
const URL_ = Deno.env.get("SUPABASE_URL")!, SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const out = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const quiet = () => new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", { headers: { "content-type": "text/xml" } });

function same(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const digits = (s: string) => String(s || "").replace(/[^0-9]/g, "").replace(/^1(?=\d{10}$)/, "");

async function twilioSigned(req: Request, body: Record<string, string>, token: string, publicUrl: string) {
  const sig = req.headers.get("X-Twilio-Signature") || "";
  if (!sig || !token) return false;
  let data = publicUrl;
  Object.keys(body).sort().forEach(k => { data += k + body[k]; });
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(token), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
  return same(btoa(String.fromCharCode(...mac)), sig);
}

const H = () => ({ apikey: SK, authorization: "Bearer " + SK, "content-type": "application/json" });
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

// The id the caller chose, if any. Header first, then the JSON body.
//   undefined: none given.  null: given but not allowed.  string: fine.
function clientId(req: Request, body: Record<string, unknown>): string | null | undefined {
  const fromHeader = req.headers.get("x-capture-id");
  const raw: unknown = fromHeader !== null && fromHeader !== "" ? fromHeader : body.id;
  if (raw === undefined || raw === null || raw === "") return undefined;
  return typeof raw === "string" && ID_RE.test(raw) ? raw : null;
}

async function existing(id: string): Promise<Record<string, unknown> | null> {
  const r = await fetch(URL_ + "/rest/v1/docs?select=data&path=eq." + encodeURIComponent("captures/" + id), { headers: H() });
  if (!r.ok) return null;
  const rows = await r.json().catch(() => null);
  return Array.isArray(rows) && rows.length && rows[0] && typeof rows[0].data === "object" ? rows[0].data : null;
}

type Filed = { id: string; data: Record<string, unknown>; repeat: boolean };

async function file(text: unknown, via: string, from: string, wantId?: string): Promise<Filed | null> {
  const t = String(text || "").trim().slice(0, 8000);
  if (!t) return null;
  const id = wantId || "p-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  const data = { id, at: new Date().toISOString(), text: t, via, from, state: "pending" };
  const call: Record<string, unknown> = { p_path: "captures/" + id, p_col: "captures", p_id: id, p_data: data };
  // With a chosen id, only a brand new document may be written (version 0 means
  // none yet). The database refuses a second write with version_moved, and the
  // record already filed comes back instead, so a retried shortcut files once.
  if (wantId) call.p_if_version = 0;
  const r = await fetch(URL_ + "/rest/v1/rpc/doc_set", { method: "POST", headers: H(), body: JSON.stringify(call) });
  if (r.ok) return { id, data, repeat: false };
  if (wantId) {
    const err = await r.json().catch(() => ({}));
    const moved = err && (String(err.code) === "P0409" || /version_moved/.test(String(err.message || "")));
    if (moved) {
      const was = await existing(id);
      if (was) return { id, data: was, repeat: true };
    }
  }
  throw new Error("save failed " + r.status);
}

Deno.serve(async (req) => {
  const path = new URL(req.url).pathname.replace(/^.*\/capture/, "") || "/";
  try {
    if (req.method === "POST" && path === "/note") {
      const auth = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      if (!same(auth, Deno.env.get("CAPTURE_KEY") || "")) return out(401, { error: "wrong key" });
      const raw = await req.json().catch(() => ({}));
      const b: Record<string, unknown> = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
      const want = clientId(req, b);
      if (want === null) return out(400, { error: "bad id" });
      const f = await file(b.text, "voice", "voice", want);
      if (!f) return out(400, { error: "nothing to save" });
      // without an id the answer is the same as before; with one it also says whether this was a repeat
      return want === undefined ? out(200, { ok: true, id: f.id }) : out(200, { ok: true, id: f.id, repeat: f.repeat, record: f.data });
    }
    if (req.method === "POST" && path === "/sms") {
      const form = await req.formData();
      const body: Record<string, string> = {}; form.forEach((v, k) => { body[k] = String(v); });
      const publicUrl = URL_ + "/functions/v1/capture/sms";
      if (!(await twilioSigned(req, body, Deno.env.get("TWILIO_AUTH_TOKEN") || "", publicUrl))) return new Response("forbidden", { status: 403 });
      const owner = Deno.env.get("OWNER_PHONE") || "";
      if (!owner || digits(body.From) !== digits(owner)) return quiet();
      await file(body.Body, "sms", body.From);
      return quiet();
    }
    if (req.method === "GET" && path === "/key") {
      const who = await fetch(URL_ + "/auth/v1/user", { headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY") || "", authorization: req.headers.get("authorization") || "" } });
      const u = who.ok ? await who.json().catch(() => null) : null;
      const owner = (Deno.env.get("OWNER_EMAIL") || "").toLowerCase();
      if (!u || !owner || String(u.email || "").toLowerCase() !== owner) return out(401, { error: "not signed in as the owner" });
      return out(200, { key: Deno.env.get("CAPTURE_KEY") || "", note_url: URL_ + "/functions/v1/capture/note" });
    }
    return out(404, { error: "not here" });
  } catch (e) {
    return out(500, { error: String((e as Error).message || e) });
  }
});
