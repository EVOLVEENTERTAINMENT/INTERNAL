#!/usr/bin/env python3
# evoldb.py - the board database on Supabase, for the scheduled tasks.
# The same calls the tasks made through ArtifactData on claude.ai: get, list,
# query, set, update, delete, batch, with if_version guards. Python standard
# library only. Run with python3 -I.
#
# Needs EVOLVE_DB_URL (https://<project>.supabase.co). The script carries no
# key. The service key is saved once as a network secret for that host (header
# apikey), and the proxy puts it in on the way out; the placeholder sent here
# is replaced. There is no environment variable for the key, by design.
#
# Two options may go anywhere on the command line:
#   --by <task id>              stamps updated_by on every set and update, in batch
#                               too, so each write names its writer; updated_at is
#                               filled only when the data given carries none (on
#                               update, the patch)
#   --localhost-test-key <k>    TEST ONLY: a made up key for the stand-in server
#                               in the test suite. Honoured only when EVOLVE_DB_URL
#                               is on localhost or 127.0.0.1; refused anywhere else.
import sys, os, re, json, argparse, urllib.request, urllib.parse, urllib.error
from datetime import datetime, timezone

URL = os.environ.get('EVOLVE_DB_URL', '').rstrip('/')
PLACEHOLDER = 'from-network-secret'
BY_RE = re.compile(r'^[A-Za-z0-9._-]{1,40}$')

def die(msg, code=2):
    print(json.dumps({'error': msg})); sys.exit(code)

def take_option(argv, name):
    # pulls "--name value" or "--name=value" out of argv, wherever it sits
    val, rest, i = None, [], 0
    while i < len(argv):
        a = argv[i]
        if a == name:
            if i + 1 >= len(argv): die(name + ' needs a value')
            val = argv[i + 1]; i += 2; continue
        if a.startswith(name + '='): val = a[len(name) + 1:]; i += 1; continue
        rest.append(a); i += 1
    return val, rest

def is_local(url):
    try: host = urllib.parse.urlsplit(url).hostname or ''
    except ValueError: return False
    return host in ('localhost', '127.0.0.1')

BY, argv = take_option(sys.argv[1:], '--by')
TEST_KEY, argv = take_option(argv, '--localhost-test-key')
if BY is not None and not BY_RE.match(BY): die('--by must be a short task id, letters, digits, dot, dash or underscore')
if TEST_KEY is not None and not is_local(URL): die('--localhost-test-key is for the test server only; EVOLVE_DB_URL is not localhost')

def stamp_now():
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

def stamped(data):
    # the writer's mark on a set or update, only when --by was given; a task's
    # own updated_at wins over the stamp
    if BY is None or not isinstance(data, dict): return data
    d = dict(data); d['updated_by'] = BY
    if not d.get('updated_at'): d['updated_at'] = stamp_now()
    return d

def req(method, path, body=None, headers=None):
    if not URL: die('EVOLVE_DB_URL is not set')
    if TEST_KEY is not None:
        h = {'apikey': TEST_KEY, 'authorization': 'Bearer ' + TEST_KEY, 'content-type': 'application/json'}
    else:
        h = {'apikey': PLACEHOLDER, 'content-type': 'application/json'}
    h.update(headers or {})
    r = urllib.request.Request(URL + path, method=method, headers=h, data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(r, timeout=60) as res:
            raw = res.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        try: j = json.loads(e.read() or b'{}')
        except Exception: j = {}
        m = str(j.get('message') or e.reason)
        if 'version_moved' in m: die('version_moved: ' + m.split('now')[-1].strip(), 3)
        if 'not_found' in m or j.get('code') == 'P0002': die('not_found', 4)
        die('http %s: %s' % (e.code, m[:300]))

def split(col, doc_id):
    if not col or not doc_id or '/' in doc_id: die('bad collection or doc id')
    return col + '/' + doc_id

def fetch_col(col):
    rows, start = [], 0
    while True:
        q = urllib.parse.urlencode({'select': 'id,data,version,updated_at', 'col': 'eq.' + col, 'order': 'id.asc', 'offset': start, 'limit': 1000})
        page = req('GET', '/rest/v1/docs?' + q) or []
        rows += page
        if len(page) < 1000: return rows
        start += 1000

def field(o, f):
    for k in str(f).split('.'):
        if not isinstance(o, dict): return None
        o = o.get(k)
    return o

def cmp_key(v):
    return (0, v) if isinstance(v, (int, float)) and not isinstance(v, bool) else (1, str(v))

def test(op, a, b):
    J = lambda x: json.dumps(x, sort_keys=True)
    if op in ('==', 'eq'): return J(a) == J(b)
    if op in ('!=', 'ne'): return J(a) != J(b)
    if op == 'in': return isinstance(b, list) and any(J(a) == J(x) for x in b)
    if op == 'not-in': return isinstance(b, list) and not any(J(a) == J(x) for x in b)
    if op == 'array-contains': return isinstance(a, list) and any(J(x) == J(b) for x in a)
    if a is None: return False
    c = (cmp_key(a) > cmp_key(b)) - (cmp_key(a) < cmp_key(b))
    return {'<': c < 0, 'lt': c < 0, '<=': c <= 0, 'lte': c <= 0, '>': c > 0, 'gt': c > 0, '>=': c >= 0, 'gte': c >= 0}.get(op, False)

def out_rows(col, rows, out_dir):
    if not out_dir:
        print(json.dumps([{'id': r['id'], 'version': r['version'], 'data': r['data']} for r in rows], ensure_ascii=False)); return
    d = os.path.join(out_dir, col); os.makedirs(d, exist_ok=True)
    for r in rows:
        with open(os.path.join(d, r['id'] + '.json'), 'w', encoding='utf-8') as f:
            json.dump({'id': r['id'], 'data': r['data'], 'version': r['version'], 'updatedAt': r.get('updated_at')}, f, ensure_ascii=False, indent=1)
    print(json.dumps({'collection': col, 'written': len(rows), 'out_dir': d, 'versions': {r['id']: r['version'] for r in rows}}))

def data_of(a):
    if a.file:
        with open(a.file, encoding='utf-8') as f: x = json.load(f)
        return x['data'] if isinstance(x, dict) and set(x) >= {'id', 'data'} and isinstance(x.get('data'), dict) else x
    if a.data: return json.loads(a.data)
    die('give --data or --file')

def write(op, col, doc_id, data, if_version):
    p = split(col, doc_id)
    if op == 'delete':
        if if_version is not None:
            cur = req('GET', '/rest/v1/docs?' + urllib.parse.urlencode({'select': 'version', 'path': 'eq.' + p}))
            if not cur: die('not_found', 4)
            if cur[0]['version'] != if_version: die('version_moved: %s' % cur[0]['version'], 3)
        req('DELETE', '/rest/v1/docs?' + urllib.parse.urlencode({'path': 'eq.' + p})); return {'deleted': p}
    if not isinstance(data, dict): die('the document must be a JSON object')
    if op not in ('set', 'update'): die('unknown op: %s' % op)
    data = stamped(data)
    if op == 'set': v = req('POST', '/rest/v1/rpc/doc_set', {'p_path': p, 'p_col': col, 'p_id': doc_id, 'p_data': data, 'p_if_version': if_version})
    else: v = req('POST', '/rest/v1/rpc/doc_update', {'p_path': p, 'p_patch': data, 'p_if_version': if_version})
    r = {'path': p, 'version': v}
    if BY is not None: r['updated_by'] = BY; r['updated_at'] = data['updated_at']
    return r

def main():
    ap = argparse.ArgumentParser(prog='evoldb.py', epilog='--by TASK_ID and --localhost-test-key KEY (tests only) may go anywhere on the line'); sp = ap.add_subparsers(dest='cmd', required=True)
    g = sp.add_parser('get'); g.add_argument('collection'); g.add_argument('doc_id'); g.add_argument('--out')
    l = sp.add_parser('list'); l.add_argument('collection'); l.add_argument('--out-dir'); l.add_argument('--limit', type=int)
    q = sp.add_parser('query'); q.add_argument('collection'); q.add_argument('--where', action='append', default=[], help='JSON triple, e.g. ["status","eq","on_sheet"]')
    q.add_argument('--order-by'); q.add_argument('--desc', action='store_true'); q.add_argument('--limit', type=int); q.add_argument('--out-dir')
    for n in ('set', 'update'):
        w = sp.add_parser(n); w.add_argument('collection'); w.add_argument('doc_id'); w.add_argument('--data'); w.add_argument('--file'); w.add_argument('--if-version', type=int)
    d = sp.add_parser('delete'); d.add_argument('collection'); d.add_argument('doc_id'); d.add_argument('--if-version', type=int)
    b = sp.add_parser('batch'); b.add_argument('file', help='JSON array of {op, collection, doc_id, data or file_path, if_version}')
    a = ap.parse_args(argv)
    if a.cmd == 'get':
        p = split(a.collection, a.doc_id)
        r = req('GET', '/rest/v1/docs?' + urllib.parse.urlencode({'select': 'id,data,version,updated_at', 'path': 'eq.' + p}))
        doc = {'id': a.doc_id, 'exists': bool(r), 'version': r[0]['version'] if r else 0, 'data': r[0]['data'] if r else None}
        if a.out:
            with open(a.out, 'w', encoding='utf-8') as f: json.dump(doc, f, ensure_ascii=False, indent=1)
            print(json.dumps({'id': a.doc_id, 'exists': doc['exists'], 'version': doc['version'], 'out': a.out}))
        else: print(json.dumps(doc, ensure_ascii=False))
    elif a.cmd == 'list':
        rows = fetch_col(a.collection)
        out_rows(a.collection, rows[:a.limit] if a.limit else rows, a.out_dir)
    elif a.cmd == 'query':
        rows = fetch_col(a.collection)
        for w in a.where:
            f, op, v = json.loads(w); rows = [r for r in rows if test(op, field(r['data'], f), v)]
        if a.order_by: rows.sort(key=lambda r: cmp_key(field(r['data'], a.order_by)) if field(r['data'], a.order_by) is not None else (-1, ''), reverse=a.desc)
        out_rows(a.collection, rows[:a.limit] if a.limit else rows, a.out_dir)
    elif a.cmd in ('set', 'update', 'delete'):
        print(json.dumps(write(a.cmd, a.collection, a.doc_id, None if a.cmd == 'delete' else data_of(a), a.if_version)))
    elif a.cmd == 'batch':
        with open(a.file, encoding='utf-8') as f: ops = json.load(f)
        done = []
        for o in ops:
            data = None
            if o.get('op') != 'delete':
                if o.get('file_path'):
                    with open(o['file_path'], encoding='utf-8') as f: data = json.load(f)
                else: data = o.get('data')
            done.append(write(o.get('op'), o.get('collection'), o.get('doc_id'), data, o.get('if_version')))
        out = {'applied': len(done), 'results': done}
        if BY is not None: out['updated_by'] = BY
        print(json.dumps(out))

if __name__ == '__main__': main()
