import "server-only";
import type { LiveContext } from "../server";
import { requiredData } from "../errors";
import type { LiveSession } from "../types";
export async function roomSnapshot(
  context: LiveContext,
  session: LiveSession,
  canManage: boolean,
) {
  const sessionId = session.id;
  const [messages, activities, transcript, privateHistory] = await Promise.all([
    context.db
      .from("live_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(100),
    context.db
      .from("live_activities")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at")
      .limit(100),
    context.db
      .from("live_transcripts")
      .select("spoken_at")
      .eq("session_id", sessionId)
      .order("spoken_at", { ascending: false })
      .limit(1),
    context.db
      .from("live_private_messages")
      .select("id,question,answer")
      .eq("session_id", sessionId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  const activityRows = requiredData(activities);
  const responses = activityRows.length
    ? requiredData(
        await context.db
          .from("live_activity_responses")
          .select("activity_id,answer,is_correct")
          .eq("user_id", context.userId)
          .in(
            "activity_id",
            activityRows.map((activity) => activity.id),
          ),
      )
    : [];
  return {
    session,
    canManage,
    userId: context.userId,
    messages: requiredData(messages).reverse(),
    activities: activityRows,
    latestTranscriptAt: requiredData(transcript)[0]?.spoken_at || null,
    privateHistory: requiredData(privateHistory).reverse(),
    responses,
  };
}
