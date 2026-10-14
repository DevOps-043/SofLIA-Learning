// @vitest-environment node
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { createWorkspaceDatabase } from "./workspace-database.fixture";
const org = "00000000-0000-4000-8000-000000000001",
  teacher = "00000000-0000-4000-8000-000000000011",
  student = "00000000-0000-4000-8000-000000000013",
  stranger = "00000000-0000-4000-8000-000000000014",
  course = "00000000-0000-4000-8000-000000000021",
  session = "00000000-0000-4000-8000-000000000031";
let db: PGlite;
beforeAll(async () => {
  db = await createWorkspaceDatabase(false);
  await db.exec(
    "create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated,service_role;grant select,insert,update,delete on storage.objects to anon,authenticated,service_role;create policy policy_general on storage.objects for all to anon,authenticated using(true) with check(true);insert into storage.objects(bucket_id,name) values('live-recordings','privado'),('otros','permitido');",
  );
  for (const file of [
    "20261012193000_live_studio_runtime.sql",
    "20261013180000_live_recordings.sql",
    "20261013180100_live_recording_ingest.sql",
    "20261013180200_live_recording_file_commit.sql",
    "20261013180300_live_recording_retention.sql",
    "20261013180400_live_recording_recovery.sql",
  ]) {
    const sql = readFileSync(
      resolve(process.cwd(), "../../supabase/migrations", file),
      "utf8",
    );
    await db.exec(sql);
    await db.exec(sql);
  }
  await db.exec(
    `insert into organizations(id) values('${org}'); insert into users(id) values('${teacher}'),('${student}'),('${stranger}'); insert into organization_users values('${org}','${teacher}','member','active'),('${org}','${student}','member','active'),('${org}','${stranger}','member','active');insert into organization_instructors(organization_id,user_id) values('${org}','${teacher}');insert into courses values('${course}','${teacher}','Curso');insert into organization_course_assignments(organization_id,course_id,user_id) values('${org}','${course}','${student}');insert into live_sessions(id,organization_id,course_id,instructor_id,title,starts_at,duration_minutes,status) values('${session}','${org}','${course}','${teacher}','Webinar',now(),60,'ended');insert into live_recording_policies(organization_id,replay_enabled) values('${org}',true);insert into live_zoom_credentials values('${session}','host-central','prueba');grant select on organizations,users,organization_users,courses,organization_course_assignments to service_role;`,
  );
}, 60000);
afterAll(async () => {
  await db?.close();
});
const service = () => db.exec("reset role;set role service_role");
async function ingest(
  uuid = crypto.randomUUID(),
  event = "recording.completed",
  files = [
    {
      provider_file_id: "archivo-zoom",
      layout: "shared_screen",
      starts_at: "2026-10-13T18:00:00Z",
      ends_at: "2026-10-13T19:00:00Z",
      expected_bytes: 500,
    },
  ],
) {
  await service();
  return (
    await db.query<{ id: string }>(
      "select live_recording_ingest($1,$2,$3,$4,$5,$6,$7) as id",
      [
        session,
        "cuenta",
        "host-central",
        uuid,
        event,
        "2026-10-13T18:00:00Z",
        files,
      ],
    )
  ).rows[0].id;
}
describe("SQL de grabaciones privadas", () => {
  async function archive(run: string, coverage = "complete") {
    await service();
    const lease = randomUUID();
    await db.query(
      "update live_recording_jobs set status='running',lease_id=$2,lease_until=now()+interval '5 minutes' where run_id=$1",
      [run, lease],
    );
    for (const f of (
      await db.query<{ id: string; status: string }>(
        "select id,status from live_recording_files where run_id=$1",
        [run],
      )
    ).rows) {
      if (f.status === "stored") continue;
      const key = `${org}/${session}/${run}/${f.id}/${lease}.mp4`;
      await db.query("select live_recording_stage_asset($1,$2,$3,$4)", [
        run,
        lease,
        f.id,
        key,
      ]);
      await db.query(
        "select live_recording_store_file($1,$2,$3,$4,$5,500,3600)",
        [run, lease, f.id, key, "a".repeat(64)],
      );
    }
    await db.query("select live_recording_finish($1,$2,$3)", [
      run,
      lease,
      coverage,
    ]);
  }
  it("deduplica callback y jobs por ejecución sin publicar automáticamente", async () => {
    const uuid = randomUUID();
    const id = await ingest(uuid);
    expect(await ingest(uuid)).toBe(id);
    expect(
      (
        await db.query("select * from live_recording_files where run_id=$1", [
          id,
        ])
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query(
          "select published from live_recording_runs where id=$1",
          [id],
        )
      ).rows[0],
    ).toEqual({ published: false });
  });
  it("deniega tablas y RPC al alumno directo", async () => {
    await db.exec(
      `reset role;set role authenticated;set request.jwt.claim.sub='${student}'`,
    );
    await expect(
      db.query("select * from live_recording_files"),
    ).rejects.toThrow("permission denied");
    expect(
      (
        await db.query(
          "select name from storage.objects where bucket_id='live-recordings'",
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          "select name from storage.objects where bucket_id='otros'",
        )
      ).rows,
    ).toHaveLength(1);
    await expect(
      db.query(
        "insert into storage.objects(bucket_id,name) values('live-recordings','ajeno')",
      ),
    ).rejects.toThrow("row-level security");
    await expect(
      db.query("select live_recording_intent($1,$2,$3,0,true)", [
        org,
        student,
        session,
      ]),
    ).rejects.toThrow("permission denied");
  });
  it("valida rol, revisión y retirada de intención en transacción", async () => {
    await service();
    await expect(
      db.query("select live_recording_intent($1,$2,$3,0,true)", [
        org,
        student,
        session,
      ]),
    ).rejects.toThrow("LIVE_FORBIDDEN");
    expect(
      (
        await db.query(
          "select live_recording_intent($1,$2,$3,0,true) as revision",
          [org, teacher, session],
        )
      ).rows[0],
    ).toEqual({ revision: 1 });
    await expect(
      db.query("select live_recording_intent($1,$2,$3,0,false)", [
        org,
        teacher,
        session,
      ]),
    ).rejects.toThrow("RECORDING_CONFLICT");
    await db.query("select live_recording_intent($1,$2,$3,1,false)", [
      org,
      teacher,
      session,
    ]);
  });
  it("rechaza confirmación de archivo con lease ajeno o ruta fuera de su organización", async () => {
    const run = await ingest();
    await service();
    const file = (
      await db.query<{ id: string }>(
        "select id from live_recording_files where run_id=$1",
        [run],
      )
    ).rows[0];
    const lease = randomUUID();
    await db.query(
      "update live_recording_jobs set status='running',lease_id=$2,lease_until=now()+interval '5 minutes' where run_id=$1",
      [run, lease],
    );
    expect(
      (
        await db.query(
          "select live_recording_store_file($1,$2,$3,$4,$5,500,3600) as ok",
          [run, randomUUID(), file.id, "otra/ruta", "a".repeat(64)],
        )
      ).rows[0],
    ).toEqual({ ok: false });
    await expect(
      db.query("select live_recording_store_file($1,$2,$3,$4,$5,500,3600)", [
        run,
        lease,
        file.id,
        "otra/ruta",
        "a".repeat(64),
      ]),
    ).rejects.toThrow("INVALID_ASSET");
    const key = `${org}/${session}/${run}/${file.id}/${lease}.mp4`;
    await db.query("select live_recording_stage_asset($1,$2,$3,$4)", [
      run,
      lease,
      file.id,
      key,
    ]);
    await db.query(
      "select live_recording_store_file($1,$2,$3,$4,$5,500,3600)",
      [run, lease, file.id, key, "a".repeat(64)],
    );
    await db.query("select live_recording_finish($1,$2,'unknown')", [
      run,
      lease,
    ]);
    await expect(
      db.query("select live_recording_publish($1,$2,$3,0,true,false)", [
        org,
        teacher,
        run,
      ]),
    ).rejects.toThrow("NOT_READY");
    await db.query("select live_recording_publish($1,$2,$3,0,true,true)", [
      org,
      teacher,
      run,
    ]);
    expect(
      (
        await db.query(
          "select published from live_recording_runs where id=$1",
          [run],
        )
      ).rows[0],
    ).toEqual({ published: true });
  });
  it("impide republicar con intención antigua después de retirar", async () => {
    await service();
    await db.query("select live_recording_intent($1,$2,$3,2,false)", [
      org,
      teacher,
      session,
    ]);
    expect(
      (
        await db.query(
          "select published from live_recording_runs where session_id=$1",
          [session],
        )
      ).rows.every((r) => r.published === false),
    ).toBe(true);
  });
  it("reserva hosts centrales sin licencia individual y rechaza solapamientos", async () => {
    await service();
    const request = randomUUID(),
      other = randomUUID();
    await db.query(
      "insert into live_scheduling_requests(id,organization_id,user_id,payload_hash) values($1,$3,$4,$5),($2,$3,$4,$5)",
      [request, other, org, teacher, "b".repeat(64)],
    );
    expect(
      (
        await db.query(
          "select live_claim_zoom_host($1,array['host-central'],'2026-11-01T18:00:00Z',60) as host",
          [request],
        )
      ).rows[0],
    ).toEqual({ host: "host-central" });
    await expect(
      db.query(
        "select live_claim_zoom_host($1,array['host-central'],'2026-11-01T18:30:00Z',60)",
        [other],
      ),
    ).rejects.toThrow("HOST_BUSY");
    expect(
      (
        await db.query(
          "select live_claim_zoom_host($1,array['otro-host'],'2026-11-01T18:30:00Z',60) as host",
          [other],
        )
      ).rows[0],
    ).toEqual({ host: "otro-host" });
  });
  it("cerca el fallo de un worker antiguo y limita una transferencia por organización", async () => {
    await service();
    await db.exec(
      "update live_recording_jobs set status='done',lease_id=null,lease_until=null",
    );
    await ingest();
    await ingest();
    const claimed = (
      await db.query<{ run_id: string; lease_id: string }>(
        "select * from live_recording_claim()",
      )
    ).rows[0];
    expect(claimed).toBeTruthy();
    expect(
      (await db.query("select * from live_recording_claim()")).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query("select live_recording_fail($1,$2,false,now()) as ok", [
          claimed.run_id,
          randomUUID(),
        ])
      ).rows[0],
    ).toEqual({ ok: false });
    expect(
      (
        await db.query(
          "select status from live_recording_jobs where run_id=$1",
          [claimed.run_id],
        )
      ).rows[0],
    ).toEqual({ status: "running" });
    await db.query("select live_recording_fail($1,$2,true,now())", [
      claimed.run_id,
      claimed.lease_id,
    ]);
    expect(
      (await db.query("select * from live_recording_claim()")).rows,
    ).toHaveLength(1);
  });
  it("hereda un cierre recibido antes de completed y un inicio tardío no reabre procesamiento", async () => {
    await service();
    await db.query(
      "select live_recording_session_end($1,'2026-10-13T19:00:00Z')",
      [session],
    );
    const uuid = randomUUID(),
      run = await ingest(uuid);
    await ingest(uuid, "recording.started", []);
    expect(
      (
        await db.query(
          "select status,ends_at is not null as ended from live_recording_runs where id=$1",
          [run],
        )
      ).rows[0],
    ).toEqual({ status: "processing", ended: true });
  });
  it("cuota agotada y legal hold impiden reservar o purgar objetos", async () => {
    const run = await ingest();
    await service();
    const file = (
      await db.query<{ id: string }>(
        "select id from live_recording_files where run_id=$1",
        [run],
      )
    ).rows[0];
    const lease = randomUUID(),
      key = `${org}/${session}/${run}/${file.id}/${lease}.mp4`;
    await db.query(
      "update live_recording_jobs set status='running',lease_id=$2,lease_until=now()+interval '5 minutes' where run_id=$1",
      [run, lease],
    );
    await db.query(
      "insert into live_recording_policies(organization_id,quota_bytes) values($1,1) on conflict(organization_id) do update set quota_bytes=1",
      [org],
    );
    await expect(
      db.query("select live_recording_stage_asset($1,$2,$3,$4)", [
        run,
        lease,
        file.id,
        key,
      ]),
    ).rejects.toThrow("QUOTA");
    await db.query(
      "update live_recording_policies set quota_bytes=53687091200 where organization_id=$1",
      [org],
    );
    await db.query("select live_recording_stage_asset($1,$2,$3,$4)", [
      run,
      lease,
      file.id,
      key,
    ]);
    await db.query(
      "update live_recording_artifacts set created_at=now()-interval '2 days' where object_key=$1",
      [key],
    );
    await db.query(
      "update live_recording_jobs set status='failed',lease_until=null where run_id=$1",
      [run],
    );
    await db.query(
      "update live_recording_runs set legal_hold=true where id=$1",
      [run],
    );
    expect(
      (await db.query("select * from live_recording_orphans()")).rows.some(
        (r) => r.object_key === key,
      ),
    ).toBe(false);
    await db.query(
      "update live_recording_runs set legal_hold=false where id=$1",
      [run],
    );
    expect(
      (await db.query("select * from live_recording_orphans()")).rows.some(
        (r) => r.object_key === key,
      ),
    ).toBe(true);
  });
  it("publica una intención válida y no republica una edición retirada al terminar otro job", async () => {
    await service();
    await db.query(
      "update live_recording_preferences set requested=true,actor_id=$1 where session_id=$2",
      [teacher, session],
    );
    const run = await ingest();
    await archive(run);
    expect(
      (
        await db.query(
          "select published from live_recording_runs where id=$1",
          [run],
        )
      ).rows[0],
    ).toEqual({ published: true });
    await db.query("select live_recording_publish($1,$2,$3,1,false,false)", [
      org,
      teacher,
      run,
    ]);
    await archive(run);
    expect(
      (
        await db.query(
          "select published from live_recording_runs where id=$1",
          [run],
        )
      ).rows[0],
    ).toEqual({ published: false });
  });
  it("un segmento nuevo retira la edición publicada y exige una decisión nueva", async () => {
    const uuid = randomUUID(),
      run = await ingest(uuid);
    await archive(run);
    expect(
      (
        await db.query(
          "select published from live_recording_runs where id=$1",
          [run],
        )
      ).rows[0],
    ).toEqual({ published: true });
    await ingest(uuid, "recording.completed", [
      {
        provider_file_id: "segmento-adicional",
        layout: "shared_screen",
        starts_at: "2026-10-13T19:00:00Z",
        ends_at: "2026-10-13T19:30:00Z",
        expected_bytes: 500,
      },
    ]);
    await archive(run);
    expect(
      (
        await db.query(
          "select published,publication_revision from live_recording_runs where id=$1",
          [run],
        )
      ).rows[0],
    ).toEqual({ published: false, publication_revision: 2 });
  });
});
