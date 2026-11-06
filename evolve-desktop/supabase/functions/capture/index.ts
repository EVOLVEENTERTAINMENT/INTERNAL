// The Capture Line on your Supabase project, replacing the Cloudflare worker
// that was never deployed. Nothing here sends a message or talks to anyone.
// It files what you said as a pending capture, and the Mac app's board pulls
// it in (get_pending, then mark_filed).
//   POST /capture/note  iPhone shortcut. Header Authorization: Bearer <CAPTURE_KEY>, JSON {"text": "..."}
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

async function file(text: string, via: string, from: string) {
  const t = String(text || "").trim().slice(0, 8000);
  if (!t) return null;
  const id = "p-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  const data = { id, at: new Date().toISOString(), text: t, via, from, state: "pending" };
  const r = await fetch(URL_ + "/rest/v1/rpc/doc_set", { method: "POST",
    headers: { apikey: SK, authorization: "Bearer " + SK, "content-type": "application/json" },
    body: JSON.stringify({ p_path: "captures/" + id, p_col: "captures", p_id: id, p_data: data }) });
  if (!r.ok) throw new Error("save failed " + r.status);
  return id;
}

Deno.serve(async (req) => {
  const path = new URL(req.url).pathname.replace(/^.*\/capture/, "") || "/";
  try {
    if (req.method === "POST" && path === "/note") {
      const auth = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      if (!same(auth, Deno.env.get("CAPTURE_KEY") || "")) return out(401, { error: "wrong key" });
      const b = await req.json().catch(() => ({}));
      const id = await file(b.text, "voice", "voice");
      return id ? out(200, { ok: true, id }) : out(400, { error: "nothing to save" });
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
