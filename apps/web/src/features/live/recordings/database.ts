import type { SupabaseClient } from "@supabase/supabase-js";
import type { LiveDatabase } from "../database.types";
import type { Json } from "@/lib/supabase/types";
type Table<R> = {
  Row: R;
  Insert: Partial<R>;
  Update: Partial<R>;
  Relationships: [];
};
export type RecordingRun = {
  id: string;
  session_id: string;
  account_id: string;
  host_id: string;
  provider_uuid: string;
  status: string;
  coverage: "unknown" | "complete" | "gaps";
  starts_at: string | null;
  ends_at: string | null;
  published: boolean;
  publication_revision: number;
  reviewed: boolean;
  legal_hold: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};
export type RecordingFile = {
  id: string;
  run_id: string;
  provider_file_id: string;
  layout: string;
  starts_at: string;
  ends_at: string;
  expected_bytes: number;
  actual_bytes: number | null;
  status: string;
  object_key: string | null;
  sha256: string | null;
  duration_seconds: number | null;
};
export type RecordingJob = {
  run_id: string;
  status: string;
  attempts: number;
  available_at: string;
  lease_id: string | null;
  lease_until: string | null;
  last_error: string | null;
  updated_at: string;
};
export type RecordingDatabase = LiveDatabase & {
  public: LiveDatabase["public"] & {
    Tables: {
      live_recording_cursors: Table<{
        host_id: string;
        from_date: string;
        to_date: string;
        next_page_token: string;
        window_complete: boolean;
        lease_id: string | null;
        lease_until: string | null;
        updated_at: string;
      }>;
      live_recording_artifacts: Table<{
        object_key: string;
        run_id: string;
        file_id: string;
        lease_id: string;
        bytes: number;
        status: string;
        created_at: string;
      }>;
      live_recording_policies: Table<{
        organization_id: string;
        quota_bytes: number;
        private_days: number;
        published_days: number;
        retention_approved: boolean;
        replay_enabled: boolean;
      }>;
      live_zoom_host_slots: Table<{
        request_id: string;
        host_id: string;
        starts_at: string;
        ends_at: string;
        released: boolean;
      }>;
      live_recording_preferences: Table<{
        session_id: string;
        requested: boolean;
        revision: number;
        actor_id: string | null;
        updated_at: string;
      }>;
      live_recording_runs: Table<RecordingRun>;
      live_recording_files: Table<RecordingFile>;
      live_recording_jobs: Table<RecordingJob>;
      live_recording_audit: Table<{
        id: string;
        session_id: string;
        actor_id: string | null;
        action: string;
        revision: number;
        created_at: string;
      }>;
    };
    Functions: {
      live_recording_claim_cursor: {
        Args: { p_host: string; p_from: string; p_to: string };
        Returns: Array<{
          host_id: string;
          from_date: string;
          to_date: string;
          next_page_token: string;
          window_complete: boolean;
          lease_id: string | null;
          lease_until: string | null;
        }>;
      };
      live_recording_host_idle: {
        Args: { p_session: string };
        Returns: boolean;
      };
      live_recording_session_end: {
        Args: { p_session: string; p_end: string };
        Returns: undefined;
      };
      live_recording_fail: {
        Args: {
          p_run: string;
          p_lease: string;
          p_retry: boolean;
          p_shutdown?: boolean;
          p_available: string;
        };
        Returns: boolean;
      };
      live_recording_stage_asset: {
        Args: { p_run: string; p_lease: string; p_file: string; p_key: string };
        Returns: boolean;
      };
      live_recording_orphans: {
        Args: Record<string, never>;
        Returns: Array<{
          object_key: string;
          run_id: string;
          file_id: string;
          lease_id: string;
        }>;
      };
      live_recording_claim_purge: {
        Args: Record<string, never>;
        Returns: RecordingRun[];
      };
      live_recording_store_file: {
        Args: {
          p_run: string;
          p_lease: string;
          p_file: string;
          p_key: string;
          p_hash: string;
          p_bytes: number;
          p_duration: number;
        };
        Returns: boolean;
      };
      live_recording_ingest: {
        Args: {
          p_session: string;
          p_account: string;
          p_host: string;
          p_uuid: string;
          p_event: string;
          p_start: string | null;
          p_files: Json;
        };
        Returns: string;
      };
      live_claim_zoom_host: {
        Args: {
          p_request: string;
          p_hosts: string[];
          p_start: string;
          p_minutes: number;
        };
        Returns: string;
      };
      live_recording_intent: {
        Args: {
          p_org: string;
          p_user: string;
          p_session: string;
          p_revision: number;
          p_requested: boolean;
        };
        Returns: number;
      };
      live_recording_publish: {
        Args: {
          p_org: string;
          p_user: string;
          p_run: string;
          p_revision: number;
          p_publish: boolean;
          p_reviewed: boolean;
        };
        Returns: number;
      };
      live_recording_claim: {
        Args: Record<string, never>;
        Returns: RecordingJob[];
      };
      live_recording_renew: {
        Args: { p_run: string; p_lease: string };
        Returns: boolean;
      };
      live_recording_finish: {
        Args: { p_run: string; p_lease: string; p_coverage: string };
        Returns: boolean;
      };
    };
  };
};
export const recordingDb = (db: SupabaseClient<LiveDatabase>) =>
  db as unknown as SupabaseClient<RecordingDatabase>;

export const RECORDING_RUN_COLUMNS =
  "id,session_id,account_id,host_id,provider_uuid,status,coverage,starts_at,ends_at,published,publication_revision,reviewed,legal_hold,expires_at,created_at,updated_at";
export const RECORDING_FILE_COLUMNS =
  "id,run_id,provider_file_id,layout,starts_at,ends_at,expected_bytes,actual_bytes,status,object_key,sha256,duration_seconds";
export const RECORDING_CURSOR_COLUMNS =
  "host_id,from_date,to_date,next_page_token,window_complete,lease_id,lease_until,updated_at";
