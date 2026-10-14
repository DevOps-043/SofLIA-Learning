import { afterEach,describe,it,expect,vi } from 'vitest';
import { fetchRecording } from '../recordings/client';
const user='00000000-0000-4000-8000-000000000011',session='00000000-0000-4000-8000-000000000031';
const response={recording_snapshot:{session_id:session,user_id:user,required:true,requested:false,revision:0,can_manage:false,runs:[]}};
afterEach(()=>vi.unstubAllGlobals());
describe('Cambio de cuenta en repeticiones web',()=>{
 it('vincula la consulta al actor esperado sin reutilizar otra identidad',async()=>{
  const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(response))).mockResolvedValueOnce(new Response(JSON.stringify({recording_snapshot:{...response.recording_snapshot,user_id:session}})));vi.stubGlobal('fetch',fetcher);
  expect((await fetchRecording('/api/acme/live/'+session+'/recordings',user)).recording_snapshot?.user_id).toBe(user);
  expect(fetcher).toHaveBeenCalledWith(expect.any(String),expect.objectContaining({redirect:'error',headers:expect.objectContaining({'x-soflia-actor':user})}));
  await expect(fetchRecording('/api/acme/live/'+session+'/recordings',user)).rejects.toThrow('cuenta cambió');
 });
});
