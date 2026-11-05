-- Evolve OS board database on Supabase.
-- One table holds every document, addressed by path the way the board does:
-- "tasks/t1", or nested "boards/b1/columns/c2". Only the signed in owner can
-- read or write. The scheduled tasks use the service key, which bypasses this.
create table if not exists public.docs (
  path        text primary key,
  col         text not null,
  id          text not null,
  data        jsonb not null default '{}'::jsonb,
  version     integer not null default 1,
  updated_at  timestamptz not null default now(),
  owner       uuid not null default auth.uid()
);
create index if not exists docs_col_idx on public.docs (col);
create index if not exists docs_owner_col_idx on public.docs (owner, col);

alter table public.docs enable row level security;
drop policy if exists "owner reads" on public.docs;
drop policy if exists "owner writes" on public.docs;
create policy "owner reads"  on public.docs for select using (owner = auth.uid());
create policy "owner writes" on public.docs for all using (owner = auth.uid()) with check (owner = auth.uid());

-- update merges nested objects the same way the board expects:
-- objects merge recursively, {"__delete__": true} removes a field.
create or replace function public.jsonb_merge_deep(a jsonb, b jsonb) returns jsonb
language sql immutable as $$
  select coalesce(jsonb_object_agg(k,
    case
      when jsonb_typeof(bv) = 'object' and bv = '{"__delete__": true}'::jsonb then null
      when jsonb_typeof(av) = 'object' and jsonb_typeof(bv) = 'object' then public.jsonb_merge_deep(av, bv)
      when bv is null then av
      else bv
    end) filter (where bv is null or not (jsonb_typeof(bv) = 'object' and bv = '{"__delete__": true}'::jsonb)), '{}'::jsonb)
  from (select coalesce(x.key, y.key) k, x.value av, y.value bv
        from jsonb_each(coalesce(a,'{}'::jsonb)) x full join jsonb_each(coalesce(b,'{}'::jsonb)) y on x.key = y.key) t;
$$;

create or replace function public.doc_update(p_path text, p_patch jsonb) returns integer
language plpgsql security invoker as $$
declare v integer;
begin
  update public.docs set data = public.jsonb_merge_deep(data, p_patch), version = version + 1, updated_at = now()
   where path = p_path returning version into v;
  if v is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  return v;
end $$;

create or replace function public.doc_set(p_path text, p_col text, p_id text, p_data jsonb) returns integer
language plpgsql security invoker as $$
declare v integer;
begin
  insert into public.docs (path, col, id, data) values (p_path, p_col, p_id, p_data)
  on conflict (path) do update set data = excluded.data, version = public.docs.version + 1, updated_at = now()
  returning version into v;
  return v;
end $$;

-- live updates for the app and the phone
alter publication supabase_realtime add table public.docs;
