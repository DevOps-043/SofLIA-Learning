"use client";
import { recordingOperationSchema,recordingResponseSchema,type RecordingOperation } from "./contract";
/** La identidad esperada cerca lecturas y acciones durante un cambio de cuenta. */
export async function fetchRecording(endpoint:string,userId:string,operation?:RecordingOperation){
 const response=await fetch(endpoint,{method:operation?"POST":"GET",credentials:"same-origin",cache:"no-store",redirect:"error",signal:AbortSignal.timeout(25000),headers:{"x-soflia-actor":userId,...(operation?{"Content-Type":"application/json"}:{})},...(operation?{body:JSON.stringify(recordingOperationSchema.parse(operation))}:{})});
 if(!response.ok)throw new Error("La grabación no está disponible o tu acceso cambió.");
 const result=recordingResponseSchema.parse(await response.json());
 if(result.recording_snapshot&&result.recording_snapshot.user_id!==userId||result.playback&&result.playback.user_id!==userId)throw new Error("La cuenta cambió durante la consulta.");
 return result;
}
