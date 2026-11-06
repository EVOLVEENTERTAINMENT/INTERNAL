// Google Calendar and Gmail on your own Google sign in. The board was built
// against the claude.ai connectors, so each tool here answers in the same
// shape those connectors did: list_events is Google's events list with the
// list under "events", search_threads and get_thread use the connector's
// camel case message fields. Gmail is read only: this file has no way to
// send, draft, label or delete mail.
'use strict';
const http = require('http');
const crypto = require('crypto');

const SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/gmail.readonly'];
const CAL = 'https://www.googleapis.com/calendar/v3';
const GM = 'https://gmail.googleapis.com/gmail/v1/users/me';
const b64url = b => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fail = (code, message) => { const e = new Error(message); e.code = code; return e; };

class Google {
  constructor(cfg, fetchImpl) { this.cfg = cfg; this.fetch = fetchImpl || fetch; }
  client() { const c = this.cfg.get(); return { id: c.googleClientId, secret: this.cfg.secret('googleClientSecret') }; }
  connected() { return !!this.cfg.secret('googleRefresh'); }
  email() { return this.cfg.get().googleEmail || ''; }

  // Desktop sign in: the browser opens Google, Google sends you back to a
  // one-time address on this Mac, and the app swaps the code for tokens.
  async signIn(openBrowser) {
    const { id, secret } = this.client();
    if (!id) throw fail('not_granted', 'Add the Google client ID in Settings first.');
    const verifier = b64url(crypto.randomBytes(32)), challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
    const state = b64url(crypto.randomBytes(12));
    const { code, redirect } = await new Promise((resolve, reject) => {
      const srv = http.createServer((req, res) => {
        const u = new URL(req.url, 'http://127.0.0.1');
        if (u.searchParams.get('state') !== state) { res.writeHead(400); res.end(); return; }
        const ok = !!u.searchParams.get('code');
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end('<body style="font:16px -apple-system;background:#0B0B0C;color:#F2F2F4;padding:40px">' + (ok ? 'Google is connected. You can close this tab and go back to Evolve OS.' : 'Google did not connect. Go back to Evolve OS and try again.') + '</body>');
        srv.close();
        ok ? resolve({ code: u.searchParams.get('code'), redirect: 'http://127.0.0.1:' + srv.address().port })
           : reject(fail('not_granted', u.searchParams.get('error') || 'Google sign in was cancelled.'));
      });
      srv.listen(0, '127.0.0.1', () => {
        const redirectUri = 'http://127.0.0.1:' + srv.address().port;
        const q = new URLSearchParams({ client_id: id, redirect_uri: redirectUri, response_type: 'code', scope: SCOPES.join(' '),
          code_challenge: challenge, code_challenge_method: 'S256', access_type: 'offline', prompt: 'consent', state });
        openBrowser('https://accounts.google.com/o/oauth2/v2/auth?' + q);
      });
      setTimeout(() => { try { srv.close(); } catch (e) {} reject(fail('cancelled', 'Google sign in timed out.')); }, 5 * 60000);
    });
    const t = await this.token({ code, client_id: id, client_secret: secret || '', redirect_uri: redirect, grant_type: 'authorization_code', code_verifier: verifier });
    if (!t.refresh_token) throw fail('needs_reauth', 'Google did not hand back a lasting sign in. Try again.');
    this.cfg.setSecret('googleRefresh', t.refresh_token);
    this.access = { token: t.access_token, until: Date.now() + (t.expires_in - 60) * 1000 };
    const me = await this.api('https://openidconnect.googleapis.com/v1/userinfo');
    this.cfg.set({ googleEmail: me.email || '' });
    return { email: me.email };
  }
  signOut() { this.cfg.setSecret('googleRefresh', null); this.cfg.set({ googleEmail: '' }); this.access = null; }
  async token(form) {
    const r = await this.fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(form).toString() });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw fail(j.error === 'invalid_grant' ? 'needs_reauth' : 'upstream_error', j.error_description || j.error || ('Google answered ' + r.status));
    return j;
  }
  async bearer() {
    if (this.access && Date.now() < this.access.until) return this.access.token;
    const rt = this.cfg.secret('googleRefresh');
    if (!rt) throw fail('server_not_connected', 'Google is not connected. Connect it in Settings.');
    const { id, secret } = this.client();
    const t = await this.token({ refresh_token: rt, client_id: id, client_secret: secret || '', grant_type: 'refresh_token' });
    this.access = { token: t.access_token, until: Date.now() + (t.expires_in - 60) * 1000 };
    return this.access.token;
  }
  async api(url, opt) {
    opt = opt || {};
    const r = await this.fetch(url, { method: opt.method || 'GET', headers: Object.assign({ authorization: 'Bearer ' + await this.bearer() }, opt.body ? { 'content-type': 'application/json' } : {}),
      body: opt.body ? JSON.stringify(opt.body) : undefined });
    if (r.status === 204) return {};
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw fail(r.status === 401 ? 'needs_reauth' : r.status === 403 ? 'blocked_by_policy' : r.status === 404 ? 'tool_error' : r.status === 429 ? 'rate_limited' : 'upstream_error',
      (j.error && (j.error.message || j.error)) || ('Google answered ' + r.status));
    return j;
  }

  // ---- Calendar, in the connector's shapes
  async calendar(tool, a) {
    const cal = encodeURIComponent(a.calendarId || 'primary');
    const when = (t, tz) => (t ? { dateTime: t, timeZone: tz || a.timeZone || undefined } : undefined);
    const send = a.notificationLevel === 'NONE' || !a.notificationLevel ? 'none' : 'all';
    if (tool === 'list_events') {
      const q = new URLSearchParams({ singleEvents: 'true', maxResults: String(Math.min(a.pageSize || 100, 250)) });
      if (a.startTime) q.set('timeMin', a.startTime); if (a.endTime) q.set('timeMax', a.endTime);
      if (a.orderBy === 'startTime') q.set('orderBy', 'startTime'); else if (a.orderBy === 'lastModified') q.set('orderBy', 'updated');
      if (a.timeZone) q.set('timeZone', a.timeZone); if (a.pageToken) q.set('pageToken', a.pageToken); if (a.fullText) q.set('q', a.fullText);
      const j = await this.api(CAL + '/calendars/' + cal + '/events?' + q);
      const out = Object.assign({}, j); delete out.items; delete out.kind; delete out.etag;
      if (j.items && j.items.length) out.events = j.items.map(x => { const y = Object.assign({}, x); delete y.kind; delete y.etag; return y; });
      return out;
    }
    const ev = a.eventId ? '/' + encodeURIComponent(a.eventId) : '';
    if (tool === 'get_event') return this.api(CAL + '/calendars/' + cal + '/events' + ev);
    if (tool === 'create_event') return this.api(CAL + '/calendars/' + cal + '/events?sendUpdates=' + send, { method: 'POST',
      body: { summary: a.summary, description: a.description, location: a.location, start: when(a.startTime), end: when(a.endTime) } });
    if (tool === 'update_event') {
      const body = {};
      ['summary', 'description', 'location'].forEach(k => { if (a[k] !== undefined) body[k] = a[k]; });
      if (a.startTime) body.start = when(a.startTime); if (a.endTime) body.end = when(a.endTime);
      return this.api(CAL + '/calendars/' + cal + '/events' + ev + '?sendUpdates=' + send, { method: 'PATCH', body });
    }
    if (tool === 'delete_event') return this.api(CAL + '/calendars/' + cal + '/events' + ev + '?sendUpdates=' + send, { method: 'DELETE' });
    throw fail('not_in_manifest', 'unknown calendar tool ' + tool);
  }

  // ---- Gmail, read only
  msgOut(m, full) {
    const h = {}; ((m.payload && m.payload.headers) || []).forEach(x => { h[x.name.toLowerCase()] = x.value; });
    const addr = v => String(v || '').split(',').map(s => { const k = s.match(/<([^>]+)>/); return (k ? k[1] : s).trim(); }).filter(Boolean);
    const o = { id: m.id, threadId: m.threadId, sender: addr(h.from)[0] || '', toRecipients: addr(h.to), ccRecipients: addr(h.cc),
      date: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : '', labelIds: m.labelIds || [],
      subject: h.subject || '', snippet: m.snippet || '',
      viewUrl: 'https://mail.google.com/mail/?authuser=' + encodeURIComponent(this.email()) + '#all/' + m.threadId };
    if (full) o.plaintextBody = plainText(m.payload);
    return o;
  }
  async gmail(tool, a) {
    if (tool === 'search_threads') {
      const q = new URLSearchParams({ maxResults: String(Math.min(a.pageSize || 20, 50)) });
      if (a.query) q.set('q', a.query); if (a.pageToken) q.set('pageToken', a.pageToken); if (a.includeTrash) q.set('includeSpamTrash', 'true');
      const j = await this.api(GM + '/threads?' + q);
      const threads = [];
      for (const t of j.threads || []) {
        if (a.view === 'THREAD_VIEW_IDS_ONLY') { threads.push({ id: t.id }); continue; }
        const d = await this.api(GM + '/threads/' + t.id + '?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject');
        const msgs = (d.messages || []).map(m => this.msgOut(m, false));
        const shown = a.view === 'THREAD_VIEW_SUMMARY' ? msgs.slice(-1) : msgs.slice(0, 5);
        if (a.view === 'THREAD_VIEW_METADATA_ONLY') shown.forEach(m => { delete m.subject; delete m.snippet; });
        threads.push({ id: t.id, messageCount: msgs.length, messages: shown, viewUrl: 'https://mail.google.com/mail/?authuser=' + encodeURIComponent(this.email()) + '#all/' + t.id });
      }
      const out = { threads }; if (j.nextPageToken) out.nextPageToken = j.nextPageToken; if (j.resultSizeEstimate != null) out.resultCountEstimate = String(j.resultSizeEstimate);
      return threads.length ? out : {};
    }
    if (tool === 'get_thread') {
      const fmt = a.messageFormat === 'METADATA_ONLY' || a.messageFormat === 'MINIMAL' ? 'metadata' : 'full';
      const d = await this.api(GM + '/threads/' + encodeURIComponent(a.threadId) + '?format=' + fmt);
      return { id: d.id, messages: (d.messages || []).map(m => this.msgOut(m, fmt === 'full')), viewUrl: 'https://mail.google.com/mail/?authuser=' + encodeURIComponent(this.email()) + '#all/' + d.id };
    }
    throw fail('not_in_manifest', 'unknown Gmail tool ' + tool);
  }
}
function plainText(p) {
  if (!p) return '';
  const dec = s => Buffer.from(String(s || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  if (p.mimeType === 'text/plain' && p.body && p.body.data) return dec(p.body.data);
  for (const part of p.parts || []) { const t = plainText(part); if (t) return t; }
  if (p.mimeType === 'text/html' && p.body && p.body.data) return dec(p.body.data).replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return '';
}
module.exports = { Google, SCOPES, plainText };
