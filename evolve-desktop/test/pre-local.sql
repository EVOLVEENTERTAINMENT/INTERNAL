-- Stands in for the parts of Supabase the schema leans on (auth.users, auth.uid,
-- the realtime publication), so supabase/schema.sql runs on a plain Postgres. Tests only.
drop schema if exists auth cascade; drop table if exists public.docs cascade; drop table if exists public.app_secrets cascade;
create schema auth;
do $$ begin if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if; if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if; end $$;
create table auth.users (id uuid primary key, email text, created_at timestamptz default now());
insert into auth.users values ('00000000-0000-0000-0000-000000000001','jackson@example.com',now());
create or replace function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.uid', true),'')::uuid $$;
do $$ begin if not exists (select 1 from pg_publication where pubname='supabase_realtime') then create publication supabase_realtime; end if; end $$;
