import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export async function createWorkspaceDatabase(withCatalog: boolean) {
  const database = new PGlite();
  await database.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema private; create schema storage;
    grant usage on schema public,auth,private to authenticated,service_role;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table organizations(id uuid primary key,is_active boolean default true);
    create table users(id uuid primary key,is_banned boolean default false,display_name text,first_name text);
    create table organization_users(organization_id uuid,user_id uuid,role text,status text);
    create table courses(id uuid primary key,instructor_id uuid,title text);
    create table organization_course_assignments(id uuid default gen_random_uuid(),organization_id uuid,course_id uuid,user_id uuid,completion_percentage numeric,status text default 'assigned');
    create table course_skills(id uuid primary key default gen_random_uuid(),course_id uuid references courses(id),skill_id uuid not null);
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create publication supabase_realtime;
  `);
  if (withCatalog) await database.exec('create table skills(skill_id uuid primary key,name text,is_active boolean default true)');
  for (const file of ['20261005162654_live_learning.sql','20261010173000_live_hub_desktop.sql','20261010225812_live_collaborative_workspace.sql'])
    await database.exec(readFileSync(resolve(process.cwd(), '../../supabase/migrations', file), 'utf8'));
  return database;
}
