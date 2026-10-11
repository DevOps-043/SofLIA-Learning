// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeWorkspace, matchWorkspaceFaq } from '../workspace.service';
import { readWorkspaceBody } from '../hub-auth.server';
import type { LiveContext } from '../server';
import type { WorkspaceSnapshot } from '../workspace.contract';
const mocks = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock('@/lib/ai/structured-generation.server', () => ({ generateStructuredContent: mocks.generate }));
const user = '00000000-0000-4000-8000-000000000013';
const id = '00000000-0000-4000-8000-000000000031';
const postId = '00000000-0000-4000-8000-000000000041';
const base: WorkspaceSnapshot = {
  version:1,user_id:user,can_manage:false,is_admin:false,
  session:{id,title:'Clase',description:'',status:'live',starts_at:'2026-10-10T20:00:00Z',session_type:'meeting'},
  policy:{version:1,ai_enabled:false,telemetry_enabled:false,retention_days:30},settings:{rules:'Usa preguntas',faq:[{question:'¿Se graba la sesión?',answer:'El instructor anunciará si activa la grabación.'}]},consent:null,audit:[],skills:[],posts:[],pulses:[],
};
function context(snapshot: WorkspaceSnapshot = base) {
  const rpc = vi.fn(async () => ({data:snapshot,error:null}));
  return {rpc, value:{orgId:'org',userId:user,db:{rpc}} as unknown as LiveContext};
}
beforeEach(() => vi.clearAllMocks());
describe('FAQ y ayuda privada gobernada', () => {
  it('normaliza acentos y puntuación sin ampliar coincidencias a texto parecido', () => {
    expect(matchWorkspaceFaq('se graba la sesion?',base.settings.faq)).toBe(base.settings.faq[0].answer);
    expect(matchWorkspaceFaq('¿Se graba la sesión y se publica mi nombre?',base.settings.faq)).toBeUndefined();
  });
  it('responde una FAQ en privado sin publicar ni llamar a IA', async () => {
    const ctx = context(); const result = await executeWorkspace(ctx.value,id,{type:'command',id:postId,command:{type:'post',kind:'question',content:'¿Se graba la sesión?'}});
    expect(result).toEqual({private_answer:base.settings.faq[0].answer});
    expect(ctx.rpc).toHaveBeenCalledTimes(1); expect(mocks.generate).not.toHaveBeenCalled();
  });
  it('rechaza IA sin política ni consentimiento vigente', async () => {
    const ctx = context();
    await expect(executeWorkspace(ctx.value,id,{type:'assist',post_id:postId})).rejects.toMatchObject({status:403});
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it('no entrega feedback si se revoca consentimiento durante la generación', async () => {
    const enabled: WorkspaceSnapshot = {...base,policy:{...base.policy,ai_enabled:true},consent:{policy_version:1,ai_enabled:true,telemetry_enabled:false,updated_at:'2026-10-10'},posts:[{id:postId,user_id:user,author_name:'Alumno',kind:'practice',content:'Mi práctica',parent_id:null,room:null,link:null,skill_id:null,resolved:false,created_at:'2026-10-10',votes:0,voted:false}]};
    const ctx = context(enabled); ctx.rpc.mockResolvedValueOnce({data:enabled,error:null}).mockResolvedValueOnce({data:base,error:null});
    mocks.generate.mockResolvedValue({value:{feedback:'¿Qué puedes comprobar?'}});
    await expect(executeWorkspace(ctx.value,id,{type:'assist',post_id:postId})).rejects.toMatchObject({status:403});
    expect(mocks.generate).toHaveBeenCalledTimes(1);
  });
  it('acota cuerpo real sin Content-Length', async () => {
    await expect(readWorkspaceBody(new Request('https://learning.test',{method:'POST',body:'x'.repeat(32769)}))).rejects.toMatchObject({status:413});
    expect(await readWorkspaceBody(new Request('https://learning.test',{method:'POST',body:'{"ok":true}'}))).toEqual({ok:true});
  });
});
