// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { workspaceSnapshotSchema } from '../workspace.contract';

const ids = { org: '00000000-0000-4000-8000-000000000001', otherOrg: '00000000-0000-4000-8000-000000000002', teacher: '00000000-0000-4000-8000-000000000011', student: '00000000-0000-4000-8000-000000000013', outsider: '00000000-0000-4000-8000-000000000014', admin: '00000000-0000-4000-8000-000000000015', course: '00000000-0000-4000-8000-000000000021', session: '00000000-0000-4000-8000-000000000031', otherSession: '00000000-0000-4000-8000-000000000032', skill: '00000000-0000-4000-8000-000000000041' };
let db: PGlite;
async function createWorkspaceDatabase(withCatalog: boolean) {
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
beforeAll(async () => {
  db = await createWorkspaceDatabase(true);
  await db.exec(`
    insert into organizations(id) values('${ids.org}'),('${ids.otherOrg}');
    insert into users(id,display_name) values('${ids.teacher}','Docente'),('${ids.student}','Alumno'),('${ids.outsider}','Otra organización'),('${ids.admin}','Administrador');
    insert into organization_users values('${ids.org}','${ids.teacher}','member','active'),('${ids.org}','${ids.student}','member','active'),('${ids.otherOrg}','${ids.outsider}','member','active'),('${ids.org}','${ids.admin}','admin','active');
    insert into organization_instructors(organization_id,user_id) values('${ids.org}','${ids.teacher}');
    insert into courses values('${ids.course}','${ids.teacher}','Curso');
    insert into organization_course_assignments(organization_id,course_id,user_id,completion_percentage) values('${ids.org}','${ids.course}','${ids.student}',0),('${ids.otherOrg}','${ids.course}','${ids.outsider}',0);
    insert into live_sessions(id,organization_id,course_id,instructor_id,title,starts_at,duration_minutes,status) values('${ids.session}','${ids.org}','${ids.course}','${ids.teacher}','Sesión',now(),60,'live'),('${ids.otherSession}','${ids.otherOrg}','${ids.course}','${ids.teacher}','Otra sesión',now(),60,'live');
    insert into skills(skill_id,name) values('${ids.skill}','Comunicación');
    insert into course_skills(course_id,skill_id) values('${ids.course}','${ids.skill}');
    grant select on organizations,users,organization_users,courses,organization_course_assignments,course_skills,skills to service_role;
  `);
}, 60000);
afterAll(async () => { await db?.close(); });
async function command(user: string, body: Record<string, unknown>, id = randomUUID()) {
  await db.exec('reset role;set role service_role');
  return db.query('select live_workspace_command($1,$2,$3,$4,$5)', [ids.org,user,ids.session,id,body]);
}
async function snapshot(user = ids.student) {
  await db.exec('reset role;set role service_role');
  const result = await db.query<{ value: unknown }>('select live_workspace_snapshot($1,$2,$3) as value', [ids.org,user,ids.session]);
  return workspaceSnapshotSchema.parse(result.rows[0].value);
}
describe('aula colaborativa: contratos y aislamiento SQL', () => {
  it('devuelve un contrato válido y parte sin IA ni telemetría', async () => {
    const value = await snapshot();
    expect(value.policy.ai_enabled).toBe(false); expect(value.policy.telemetry_enabled).toBe(false);
    expect(value.skills[0].name).toBe('Comunicación'); expect(value.can_manage).toBe(false);
    expect((await snapshot(ids.teacher)).can_manage).toBe(true);
  });
  it('impide lectura y RPC directas desde authenticated y anon', async () => {
    for (const role of ['authenticated','anon']) {
      await db.exec(`reset role;set role ${role}`);
      await expect(db.query('select * from live_workspace_posts')).rejects.toThrow(/permission denied/);
      await expect(db.query('select live_workspace_snapshot($1,$2,$3)', [ids.org,ids.student,ids.session])).rejects.toThrow(/permission denied/);
      await expect(db.query('select private.live_workspace_course_skills($1)', [ids.course])).rejects.toThrow(/permission denied/);
    }
  });
  it('rechaza otra organización y asignaciones canceladas en cada operación', async () => {
    await expect(command(ids.outsider,{ type: 'post',kind: 'chat',content: 'No autorizado' })).rejects.toThrow('LIVE_FORBIDDEN');
    await db.exec(`reset role;update organization_course_assignments set status='cancelled' where user_id='${ids.student}'`);
    await expect(snapshot()).rejects.toThrow('LIVE_FORBIDDEN');
    await db.exec(`reset role;update organization_course_assignments set status='assigned' where user_id='${ids.student}'`);
  });
  it('revalida suspensión de organización y cuenta', async () => {
    await db.exec(`reset role;update organizations set is_active=false where id='${ids.org}'`);
    await expect(snapshot()).rejects.toThrow('LIVE_FORBIDDEN');
    await db.exec(`reset role;update organizations set is_active=true where id='${ids.org}';update users set is_banned=true where id='${ids.student}'`);
    await expect(command(ids.student,{type:'post',kind:'chat',content:'Bloqueado'})).rejects.toThrow('LIVE_FORBIDDEN');
    await db.exec(`reset role;update users set is_banned=false where id='${ids.student}'`);
  });
  it('hace publicación idempotente y rechaza reutilización de clave con otro contenido', async () => {
    const id = randomUUID(); const body = {type:'post',kind:'question',content:'¿Cómo aplico esto?'};
    await Promise.all([command(ids.student,body,id),command(ids.student,body,id)]);
    expect((await snapshot()).posts.filter((post) => post.id === id)).toHaveLength(1);
    await expect(command(ids.student,{...body,content:'Otro'},id)).rejects.toThrow('LIVE_CONFLICT');
  });
  it('limita votos a preguntas propias de la sesión', async () => {
    const post = (await snapshot()).posts.find((item) => item.kind === 'question')!;
    await command(ids.student,{type:'vote',post_id:post.id}); await command(ids.student,{type:'vote',post_id:post.id});
    expect((await snapshot()).posts.find((item) => item.id === post.id)?.votes).toBe(1);
    await expect(command(ids.student,{type:'vote',post_id:randomUUID()})).rejects.toThrow('LIVE_INVALID_TARGET');
  });
  it('publica Pulse Checks solo por instructor y guarda una respuesta válida por persona', async () => {
    const id = randomUUID(); const pulse = {type:'publish_pulse',question:'¿Qué necesitas?',options:['Ejemplo','Práctica'],skill_id:ids.skill};
    await expect(command(ids.student,pulse,id)).rejects.toThrow('LIVE_FORBIDDEN');
    await command(ids.teacher,pulse,id);
    await command(ids.student,{type:'answer_pulse',pulse_id:id,answer:1});
    await command(ids.student,{type:'answer_pulse',pulse_id:id,answer:1});
    await expect(command(ids.student,{type:'answer_pulse',pulse_id:id,answer:2})).rejects.toThrow('LIVE_INVALID_TARGET');
    await expect(command(ids.student,{type:'answer_pulse',pulse_id:id,answer:0})).rejects.toThrow('LIVE_CONFLICT');
    expect((await snapshot()).pulses[0].counts).toBeNull();
    expect((await snapshot(ids.teacher)).pulses[0].counts).toEqual([0,1]);
    await command(ids.teacher,{type:'close_pulse',pulse_id:id});
    await expect(command(ids.student,{type:'answer_pulse',pulse_id:id,answer:1})).rejects.toThrow('LIVE_CLOSED');
  });
  it('exige política y consentimiento vigente y minimiza xAPI', async () => {
    await expect(command(ids.teacher,{type:'policy',ai_enabled:true,telemetry_enabled:true,retention_days:30})).rejects.toThrow('LIVE_FORBIDDEN');
    await command(ids.admin,{type:'policy',ai_enabled:true,telemetry_enabled:true,retention_days:30});
    const policy = (await snapshot()).policy;
    await command(ids.student,{type:'consent',policy_version:policy.version,ai_enabled:true,telemetry_enabled:true});
    const id = randomUUID(); await command(ids.student,{type:'post',kind:'practice',content:'Texto que no debe llegar al LRS',skill_id:ids.skill},id);
    const events = await db.query<{statement: Record<string,unknown>}>('select statement from live_learning_events where id=$1',[id]);
    expect(events.rows).toHaveLength(1); expect(JSON.stringify(events.rows[0])).not.toContain('Texto que no');
    expect(events.rows[0].statement.id).toBe(id);
    await expect(db.query('select live_workspace_ai_context($1,$2,$3)',[ids.org,ids.teacher,ids.session])).rejects.toThrow('LIVE_FORBIDDEN');
    await command(ids.teacher,{type:'consent',policy_version:policy.version,ai_enabled:true,telemetry_enabled:false});
    const aiContext = await db.query<{value:{sources:{id:string}[]}}>('select live_workspace_ai_context($1,$2,$3) as value',[ids.org,ids.teacher,ids.session]);
    expect(aiContext.rows[0].value.sources.some((item)=>item.id===id)).toBe(true);
    expect((await snapshot()).audit).toEqual([]); expect((await snapshot(ids.admin)).audit.length).toBeGreaterThan(0);
    await command(ids.admin,{type:'policy',ai_enabled:true,telemetry_enabled:true,retention_days:30});
    await expect(db.query('select live_workspace_ai_context($1,$2,$3)',[ids.org,ids.teacher,ids.session])).rejects.toThrow('LIVE_FORBIDDEN');
    const next = randomUUID(); await command(ids.student,{type:'post',kind:'chat',content:'Sin consentimiento nuevo'},next);
    expect((await db.query('select id from live_learning_events where id=$1',[next])).rows).toHaveLength(0);
    await command(ids.student,{type:'consent',policy_version:(await snapshot()).policy.version,ai_enabled:false,telemetry_enabled:false});
    expect((await db.query('select id from live_learning_events where user_id=$1',[ids.student])).rows).toHaveLength(0);
  });
  it('no acepta revisiones propias ni de otra sesión', async () => {
    const practice = (await snapshot()).posts.find((item) => item.kind === 'practice')!;
    await expect(command(ids.student,{type:'post',kind:'review',parent_id:practice.id,content:'Autorrevisión'})).rejects.toThrow('LIVE_INVALID_TARGET');
    await command(ids.teacher,{type:'post',kind:'review',parent_id:practice.id,content:'¿Qué evidencia respalda tu conclusión?'});
    await expect(command(ids.teacher,{type:'post',kind:'review',parent_id:randomUUID(),content:'Otra sesión'})).rejects.toThrow('LIVE_INVALID_TARGET');
  });
  it('aplica retención y bloquea escrituras en sesiones cerradas sin impedir revocación', async () => {
    await db.exec(`reset role;update live_workspace_posts set created_at=now()-interval '100 days';update live_workspace_commands set created_at=now()-interval '2 days';set role service_role`);
    await db.query('select live_workspace_purge()'); expect((await snapshot()).posts).toHaveLength(0);
    await db.exec(`reset role;update live_sessions set status='ended' where id='${ids.session}'`);
    await expect(command(ids.student,{type:'post',kind:'chat',content:'Tarde'})).rejects.toThrow('LIVE_CLOSED');
    await command(ids.student,{type:'consent',policy_version:(await snapshot()).policy.version,ai_enabled:false,telemetry_enabled:false});
  });
  it('instala y opera sin public.skills, manteniendo la validación del curso', async () => {
    const withoutCatalog = await createWorkspaceDatabase(false);
    try {
      await withoutCatalog.exec(`
        insert into organizations(id) values('${ids.org}');
        insert into users(id,display_name) values('${ids.teacher}','Docente'),('${ids.student}','Alumno');
        insert into organization_users values('${ids.org}','${ids.teacher}','member','active'),('${ids.org}','${ids.student}','member','active');
        insert into organization_instructors(organization_id,user_id) values('${ids.org}','${ids.teacher}');
        insert into courses values('${ids.course}','${ids.teacher}','Curso');
        insert into organization_course_assignments(organization_id,course_id,user_id,completion_percentage) values('${ids.org}','${ids.course}','${ids.student}',0);
        insert into live_sessions(id,organization_id,course_id,instructor_id,title,starts_at,duration_minutes,status) values('${ids.session}','${ids.org}','${ids.course}','${ids.teacher}','Sesión',now(),60,'live');
        insert into course_skills(course_id,skill_id) values('${ids.course}','${ids.skill}');
        grant select on organizations,users,organization_users,courses,organization_course_assignments,course_skills to service_role;
        set role service_role;
      `);
      const readSnapshot = async () => {
        const value = await withoutCatalog.query<{value: unknown}>('select live_workspace_snapshot($1,$2,$3) as value', [ids.org,ids.student,ids.session]);
        return workspaceSnapshotSchema.parse(value.rows[0].value);
      };
      const send = (user: string, body: Record<string, unknown>) => withoutCatalog.query('select live_workspace_command($1,$2,$3,$4,$5)', [ids.org,user,ids.session,randomUUID(),body]);
      expect((await readSnapshot()).skills).toEqual([]);
      await send(ids.student,{type:'post',kind:'chat',content:'La sala funciona sin catálogo'});
      await send(ids.student,{type:'post',kind:'practice',content:'Práctica del curso',skill_id:ids.skill});
      await send(ids.teacher,{type:'publish_pulse',question:'¿Cómo vamos?',options:['Bien','Necesito ayuda'],skill_id:ids.skill});
      await expect(send(ids.student,{type:'post',kind:'practice',content:'Habilidad ajena',skill_id:randomUUID()})).rejects.toThrow('LIVE_INVALID_TARGET');
      const value = await readSnapshot();
      expect(value.posts).toHaveLength(2);
      expect(value.pulses[0].skill_id).toBe(ids.skill);
      // Si se incorpora el catálogo después, sus nombres aparecen sin reinstalar el aula.
      await withoutCatalog.exec(`reset role; create table skills(skill_id uuid primary key,name text,is_active boolean default true); insert into skills(skill_id,name) values('${ids.skill}','Comunicación'); grant select on skills to service_role; set role service_role`);
      expect((await readSnapshot()).skills).toEqual([{id:ids.skill,name:'Comunicación'}]);
    } finally {
      await withoutCatalog.close();
    }
  }, 60000);
});
