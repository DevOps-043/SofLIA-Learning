import { z } from "zod";
import type { LiveContext } from "../server";
import type { LiveSession } from "../types";
import { joinSession } from "./join.service";
import { recordAttendance } from "./attendance.service";
import { uploadMaterial } from "./materials.service";
import { sendChat } from "./chat.service";
import { saveTranscript } from "./transcript.service";
import { publishActivity } from "./activities.service";
import { respondOrDownload } from "./responses.service";
export const liveActionSchema = z.enum([
  "join",
  "attendance",
  "upload",
  "messages",
  "soflia",
  "transcript",
  "activities",
  "respond",
  "download",
]);
export async function dispatchLiveAction({
  context,
  session,
  canManage,
  action,
  body,
}: {
  context: LiveContext;
  session: LiveSession;
  canManage: boolean;
  action: z.infer<typeof liveActionSchema>;
  body: unknown;
}) {
  switch (action) {
    case "join":
      return joinSession(context, session, canManage);
    case "attendance":
      return recordAttendance(context, session, canManage);
    case "upload":
      return uploadMaterial(context, session, canManage, body as FormData);
    case "messages":
    case "soflia":
      return sendChat(context, session, canManage, body, action);
    case "transcript":
      return saveTranscript(context, session, canManage, body);
    case "activities":
      return publishActivity(context, session, canManage, body);
    case "respond":
    case "download":
      return respondOrDownload(context, session, canManage, body, action);
  }
}
