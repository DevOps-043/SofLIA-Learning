// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createWorkspaceDatabase } from './workspace-database.fixture';
import { emptyStudioState } from '../live-studio-domain';

const org = '00000000-0000-4000-8000-000000000001', teacher = '00000000-0000-4000-8000-000000000011', student = '00000000-0000-4000-8000-000000000013', stranger = '00000000-0000-4000-8000-000000000014', course = '00000000-0000-4000-8000-000000000021', session = '00000000-0000-4000-8000-000000000031';
let db: PGlite;
beforeAll(async () => {
  db = await createWorkspaceDatabase(false);
  const sql = readFileSync(resolve(process.cwd(), '../../supabase/migrations/20261012193000_live_studio_runtime.sql'), 'utf8');
  await db.exec(sql); await db.exec(sql);
  await db.exec(`insert into organizations(id) values('${org}');
    insert into users(id,display_name) values('${teacher}','Instructor'),('${student}','Alumno'),('${stranger}','Sin asignación');
    insert into organization_users values('${org}','${teacher}','member','active'),('${org}','${student}','member','active'),('${org}','${stranger}','member','active');
    insert into organization_instructors(organization_id,user_id) values('${org}','${teacher}');
    insert into courses values('${course}','${teacher}','Curso');
    insert into organization_course_assignments(organization_id,course_id,user_id) values('${org}','${course}','${student}');
    insert into live_sessions(id,organization_id,course_id,instructor_id,title,starts_at,duration_minutes,status) values('${session}','${org}','${course}','${teacher}','Sesión',now(),60,'live');
    grant select on organizations,users,organization_users,courses,organization_course_assignments to service_role;`);
}, 60000);
afterAll(async () => { await db?.close(); });
async function service() { await db.exec('reset role;set role service_role'); }
async function commit(revision: number, commandId = randomUUID(), hash = 'a'.repeat(64), user = teacher, type = 'moderation') {
  await service();
  return db.query('select live_studio_commit($1,$2,$3,$4,$5,$6,$7,$8) as revision', [org, user, session, commandId, hash, revision, type, { ...emptyStudioState(), revision: revision + 1 }]);
}
async function authenticated(user: string) { await db.exec(`reset role;set role authenticated;set request.jwt.claim.sub='${user}'`); }

describe('persistencia SQL del estudio', () => {
  it('aplica migración dos veces, escribe atomicamente y deduplica por actor/comando', async () => {
    const id = randomUUID();
    expect((await commit(0, id)).rows[0]).toEqual({ revision: 1 });
    expect((await commit(0, id)).rows[0]).toEqual({ revision: 1 });
    await expect(commit(1, id, 'b'.repeat(64))).rejects.toThrow('STUDIO_ID_CONFLICT');
    await expect(commit(0)).rejects.toThrow('STUDIO_CONFLICT');
    const state = await db.query('select revision from live_studio_state');
    expect(state.rows).toEqual([{ revision: 1 }]);
  });
  it('permite invalidaciones al alumno asignado y las oculta al actor sin curso', async () => {
    await authenticated(student); expect((await db.query('select * from live_studio_revisions')).rows).toHaveLength(1);
    await authenticated(stranger); expect((await db.query('select * from live_studio_revisions')).rows).toHaveLength(0);
  });
  it('deniega lectura de estado, escrituras directas y RPC al cliente', async () => {
    await authenticated(student);
    await expect(db.query('select * from live_studio_state')).rejects.toThrow('permission denied');
    await expect(db.query('update live_studio_revisions set revision=99')).rejects.toThrow('permission denied');
    await expect(db.query('select live_studio_commit($1,$2,$3,$4,$5,$6,$7,$8)', [org, student, session, randomUUID(), 'a'.repeat(64), 1, 'post', { ...emptyStudioState(), revision: 2 }])).rejects.toThrow('permission denied');
  });
  it('revalida rol y membresía en commit, no solo en HTTP', async () => {
    await expect(commit(1, randomUUID(), 'a'.repeat(64), student)).rejects.toThrow('LIVE_FORBIDDEN');
    await expect(commit(1, randomUUID(), 'a'.repeat(64), stranger, 'post')).rejects.toThrow('LIVE_FORBIDDEN');
    await db.exec("reset role"); await db.query("update organization_users set status='inactive' where user_id=$1", [student]);
    await authenticated(student); expect((await db.query('select * from live_studio_revisions')).rows).toEqual([]);
    await db.exec('reset role'); await db.query("update organization_users set status='active' where user_id=$1", [student]);
  });
  it('bloquea notificaciones del usuario expulsado y no publica contenido privado', async () => {
    await db.exec('reset role');
    await db.query("update live_studio_state set state=jsonb_set(state,'{moderation,restrictions}',$1::jsonb)", [{ [student]: 'blocked' }]);
    await authenticated(student); expect((await db.query('select * from live_studio_revisions')).rows).toEqual([]);
    await service(); const result = await db.query('select * from live_studio_revisions');
    expect(Object.keys(result.rows[0]).sort()).toEqual(['revision','session_id','updated_at']);
  });
  it('fusiona presencia concurrente y los latidos no publican nuevas revisiones', async () => {
    await db.exec('reset role');
    await db.query("update live_studio_state set state=jsonb_set(state,'{moderation,restrictions}','{}'::jsonb)");
    await service();
    const old = (await db.query<{ state: ReturnType<typeof emptyStudioState> }>('select state from live_studio_state')).rows[0].state;
    async function touch(user: string, name: string, instructor: boolean) {
      const state = { ...old, revision: old.revision + 1, members: [{ user_id: user, name, instructor, room_id: null, seen_at: new Date().toISOString() }] };
      return db.query<{ revision: number }>('select live_studio_commit($1,$2,$3,$4,$5,$6,$7,$8) as revision', [org,user,session,randomUUID(),'c'.repeat(64),old.revision,'presence',state]);
    }
    await touch(student, 'Alumno', false);
    const before = (await touch(teacher, 'Instructor', true)).rows[0].revision;
    expect((await touch(student, 'Alumno', false)).rows[0].revision).toBe(before);
    const state = (await db.query<{ state: ReturnType<typeof emptyStudioState> }>('select state from live_studio_state')).rows[0].state;
    expect(state.members.map((member) => member.user_id).sort()).toEqual([teacher,student].sort());
    expect((await db.query('select revision from live_studio_revisions')).rows[0]).toEqual({revision:before});
    const timestamp='2030-01-01T00:00:00Z';
    await db.query("update live_studio_state set state=jsonb_set(state,'{members,0,seen_at}',to_jsonb($1::text))",[timestamp]);
    await db.query('select live_studio_commit($1,$2,$3,$4,$5,$6,$7,$8)',[org,teacher,session,randomUUID(),'0'.repeat(64),state.revision,'moderation',{...state,revision:state.revision+1}]);
    expect((await db.query<{state:ReturnType<typeof emptyStudioState>}>('select state from live_studio_state')).rows[0].state.members[0].seen_at).toBe(timestamp);
  });
  it('reclama archivos huérfanos, protege los publicados y excluye publicación durante GC', async () => {
    await service();
    const path = `${org}/${session}/${randomUUID()}`, orphan = `${org}/${session}/${randomUUID()}`;
    await db.query("insert into live_studio_assets(path,session_id,created_at) values($1,$3,now()-interval '2 days'),($2,$3,now()-interval '2 days')", [path,orphan,session]);
    const old = (await db.query<{ state: ReturnType<typeof emptyStudioState> }>('select state from live_studio_state')).rows[0].state;
    const material = { id:randomUUID(),name:'Lectura',kind:'reading',asset_path:path,mime:'text/plain',bytes:1 };
    const next = {...old,revision:old.revision+1,materials:[material]};
    await db.query('select live_studio_commit($1,$2,$3,$4,$5,$6,$7,$8)', [org,teacher,session,randomUUID(),'d'.repeat(64),old.revision,'material',next]);
    const claimed = await db.query<{path:string}>('select live_studio_claim_asset_gc(100) as path');
    expect(claimed.rows).toEqual([{path:orphan}]);
    expect((await db.query('select status from live_studio_assets where path=$1',[path])).rows).toEqual([{status:'attached'}]);
    await expect(db.query('select live_studio_commit($1,$2,$3,$4,$5,$6,$7,$8)', [org,teacher,session,randomUUID(),'e'.repeat(64),next.revision,'material',{...next,revision:next.revision+1,materials:[{...material,asset_path:orphan}]}])).rejects.toThrow('STUDIO_INVALID_ASSET');
    // Retirar no borra bytes en la transacción; deja un periodo de gracia de 24 horas.
    await db.query('select live_studio_commit($1,$2,$3,$4,$5,$6,$7,$8)', [org,teacher,session,randomUUID(),'f'.repeat(64),next.revision,'remove_material',{...next,revision:next.revision+1,materials:[]}]);
    expect((await db.query('select status, created_at>now()-interval \'1 minute\' as fresh from live_studio_assets where path=$1',[path])).rows).toEqual([{status:'staged',fresh:true}]);
    await authenticated(student); await expect(db.query('select live_studio_claim_asset_gc(100)')).rejects.toThrow('permission denied');
  });
});
