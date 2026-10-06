"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { LiveSession, LiveMessage, LiveActivity } from "./types";
import type { ActivityResponse } from "./ActivityPanel";
import { liveFetch } from "./client";
export interface RoomSnapshot {
  session: LiveSession;
  canManage: boolean;
  userId: string;
  messages: LiveMessage[];
  activities: LiveActivity[];
  latestTranscriptAt: string | null;
  privateHistory: { id: string; question: string; answer: string }[];
  responses: ActivityResponse[];
}
export function useLiveRoom(orgSlug: string, sessionId: string) {
  const endpoint = `/api/${orgSlug}/live/${sessionId}`;
  const [connection, setConnection] = useState("Conectando");
  const { data, error, mutate } = useSWR<RoomSnapshot>(endpoint, liveFetch, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  });
  useEffect(() => {
    const supabase = createClient();
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        void mutate();
      }, 300);
    };
    const channel = supabase
      .channel(`live:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (event) => {
          const message = event.new as LiveMessage;
          void mutate(
            (current) =>
              current
                ? {
                    ...current,
                    messages: [
                      ...current.messages.filter(
                        (existing) => existing.id !== message.id,
                      ),
                      message,
                    ]
                      .sort((a, b) => a.created_at.localeCompare(b.created_at))
                      .slice(-100),
                  }
                : current,
            { revalidate: false },
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_activities",
          filter: `session_id=eq.${sessionId}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_sessions",
          filter: `id=eq.${sessionId}`,
        },
        refresh,
      )
      .subscribe((status) => {
        setConnection(status === "SUBSCRIBED" ? "Conectado" : "Reconectando");
        if (status === "SUBSCRIBED") refresh();
      });
    return () => {
      clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [sessionId, mutate]);
  return { endpoint, data, error, mutate, connection };
}
