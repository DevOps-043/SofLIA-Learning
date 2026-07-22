/**
 * SINGLE SOURCE OF TRUTH for Supabase types in apps/web.
 *
 * Generated with `supabase gen types typescript` (see `npm run gen:types`) and
 * committed. Hand-edits are allowed only to close gaps until the next
 * regeneration — never create parallel copies of these types.
 *
 * Note: apps/api keeps its own minimal hand-curated table types on purpose
 * (different app, 17 tables) — do not sync it with this file.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      // ---------------------------------------------------------------
      // Tablas anadidas a mano para cerrar el desfase entre este fichero y el
      // esquema real (ver cabecera: los hand-edits solo cierran huecos hasta la
      // siguiente regeneracion).
      //
      // Derivadas de `supabase/scripts/Database.sql` y de las migraciones que
      // las crean. Sin ellas, `.from('<tabla>')` resuelve a `never` y cada uso
      // encadena errores de tipo ("not assignable to parameter of type 'never'",
      // "No overload matches this call", "Property X does not exist").
      //
      // `npm run gen:types --workspace=apps/web` las sustituira por la version
      // generada; el formato aqui replica el del generador para que ese diff
      // sea minimo.
      // ---------------------------------------------------------------
      organization_nodes: {
        Row: {
          code: string | null
          created_at: string | null
          depth: number | null
          id: string
          manager_id: string | null
          name: string
          organization_id: string
          parent_id: string | null
          path: string | null
          position: number | null
          properties: Json | null
          structure_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          depth?: number | null
          id?: string
          manager_id?: string | null
          name: string
          organization_id: string
          parent_id?: string | null
          path?: string | null
          position?: number | null
          properties?: Json | null
          structure_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          depth?: number | null
          id?: string
          manager_id?: string | null
          name?: string
          organization_id?: string
          parent_id?: string | null
          path?: string | null
          position?: number | null
          properties?: Json | null
          structure_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_nodes_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_nodes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organization_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_nodes_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "organization_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_teams: {
        Row: {
          address: string | null
          banner_url: string | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          leader_id: string | null
          logo_url: string | null
          longitude: number | null
          max_members: number | null
          metadata: Json | null
          monthly_target: number | null
          name: string
          organization_id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          target_goal: string | null
          updated_at: string | null
          zone_id: string
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          leader_id?: string | null
          logo_url?: string | null
          longitude?: number | null
          max_members?: number | null
          metadata?: Json | null
          monthly_target?: number | null
          name: string
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          target_goal?: string | null
          updated_at?: string | null
          zone_id: string
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          leader_id?: string | null
          logo_url?: string | null
          longitude?: number | null
          max_members?: number | null
          metadata?: Json | null
          monthly_target?: number | null
          name?: string
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          target_goal?: string | null
          updated_at?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_teams_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "organization_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_regions: {
        Row: {
          address: string | null
          banner_url: string | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          manager_id: string | null
          metadata: Json | null
          name: string
          organization_id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          manager_id?: string | null
          metadata?: Json | null
          name: string
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          manager_id?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_regions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_regions_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_regions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_zones: {
        Row: {
          address: string | null
          banner_url: string | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          manager_id: string | null
          metadata: Json | null
          name: string
          organization_id: string
          phone: string | null
          postal_code: string | null
          region_id: string
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          manager_id?: string | null
          metadata?: Json | null
          name: string
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          region_id: string
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          manager_id?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          region_id?: string
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_zones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_zones_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_zones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_zones_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "organization_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_node_users: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          node_id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          node_id: string
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          node_id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_node_users_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "organization_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_node_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_invite_links: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_uses: number
          expires_at: string
          id: string
          max_uses: number
          metadata: Json | null
          name: string | null
          organization_id: string
          role: string
          status: string
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_uses?: number
          expires_at: string
          id?: string
          max_uses?: number
          metadata?: Json | null
          name?: string | null
          organization_id: string
          role?: string
          status?: string
          token: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_uses?: number
          expires_at?: string
          id?: string
          max_uses?: number
          metadata?: Json | null
          name?: string | null
          organization_id?: string
          role?: string
          status?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_invite_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_invite_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_join_requests: {
        Row: {
          created_at: string
          id: string
          job_title: string | null
          message: string | null
          organization_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_title?: string | null
          message?: string | null
          organization_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_title?: string | null
          message?: string | null
          organization_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_join_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hierarchy_chat_participants: {
        Row: {
          chat_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          last_read_at: string | null
          left_at: string | null
          organization_id: string
          unread_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          left_at?: string | null
          organization_id: string
          unread_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          left_at?: string | null
          organization_id?: string
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hierarchy_chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hierarchy_chat_participants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hierarchy_chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hierarchy_chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          message_type: string | null
          metadata: Json | null
          organization_id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          organization_id: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          organization_id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hierarchy_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hierarchy_chat_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hierarchy_chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_structures: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          metadata: Json | null
          name: string
          organization_id: string
          template: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          metadata?: Json | null
          name: string
          organization_id: string
          template?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          template?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_structures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_structures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hierarchy_course_assignments: {
        Row: {
          approach: string | null
          assigned_at: string
          assigned_by: string
          assigned_users_count: number | null
          completed_users_count: number | null
          course_id: string
          created_at: string
          due_date: string | null
          id: string
          message: string | null
          organization_id: string
          start_date: string | null
          status: string | null
          total_users: number | null
          updated_at: string
        }
        Insert: {
          approach?: string | null
          assigned_at?: string
          assigned_by: string
          assigned_users_count?: number | null
          completed_users_count?: number | null
          course_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          message?: string | null
          organization_id: string
          start_date?: string | null
          status?: string | null
          total_users?: number | null
          updated_at?: string
        }
        Update: {
          approach?: string | null
          assigned_at?: string
          assigned_by?: string
          assigned_users_count?: number | null
          completed_users_count?: number | null
          course_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          message?: string | null
          organization_id?: string
          start_date?: string | null
          status?: string | null
          total_users?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hierarchy_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hierarchy_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hierarchy_course_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hierarchy_chats: {
        Row: {
          chat_type: string
          created_at: string | null
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          is_active: boolean | null
          last_message_at: string | null
          level_role: string | null
          name: string | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          chat_type: string
          created_at?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          level_role?: string | null
          name?: string | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          chat_type?: string
          created_at?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          level_role?: string | null
          name?: string | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hierarchy_chats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      courses_staging: {
        Row: {
          artifact_id: string | null
          course_id: string | null
          id: string
          is_update: boolean | null
          payload: Json
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_slug: string
          status: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          artifact_id?: string | null
          course_id?: string | null
          id?: string
          is_update?: boolean | null
          payload: Json
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_slug: string
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          artifact_id?: string | null
          course_id?: string | null
          id?: string
          is_update?: boolean | null
          payload?: Json
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_slug?: string
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_staging_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_staging_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_node_courses: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          course_id: string
          due_date: string | null
          id: string
          message: string | null
          metadata: Json | null
          node_id: string
          status: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          course_id: string
          due_date?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          node_id: string
          status?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          course_id?: string
          due_date?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          node_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_node_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_node_courses_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "organization_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      region_course_assignments: {
        Row: {
          created_at: string
          hierarchy_assignment_id: string
          region_id: string
        }
        Insert: {
          created_at?: string
          hierarchy_assignment_id: string
          region_id: string
        }
        Update: {
          created_at?: string
          hierarchy_assignment_id?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "region_course_assignments_hierarchy_assignment_id_fkey"
            columns: ["hierarchy_assignment_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_course_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "region_course_assignments_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "organization_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_course_assignments: {
        Row: {
          created_at: string
          hierarchy_assignment_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          hierarchy_assignment_id: string
          zone_id: string
        }
        Update: {
          created_at?: string
          hierarchy_assignment_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_course_assignments_hierarchy_assignment_id_fkey"
            columns: ["hierarchy_assignment_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_course_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_course_assignments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "organization_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      team_course_assignments: {
        Row: {
          created_at: string
          hierarchy_assignment_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          hierarchy_assignment_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          hierarchy_assignment_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_course_assignments_hierarchy_assignment_id_fkey"
            columns: ["hierarchy_assignment_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_course_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_course_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "organization_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      courseengine_inbox: {
        Row: {
          course_slug: string
          created_at: string | null
          error_message: string | null
          payload: Json
          status: string | null
          updated_at: string | null
        }
        Insert: {
          course_slug: string
          created_at?: string | null
          error_message?: string | null
          payload: Json
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          course_slug?: string
          created_at?: string | null
          error_message?: string | null
          payload?: Json
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      video_transcoding_jobs: {
        Row: {
          bucket: string
          completed_at: string | null
          content_type: string
          created_at: string
          error_message: string | null
          id: string | null
          result_path: string | null
          result_url: string | null
          size_bytes: number | null
          source_path: string
          source_url: string
          started_at: string | null
          status: string
        }
        Insert: {
          bucket?: string
          completed_at?: string | null
          content_type: string
          created_at?: string
          error_message?: string | null
          id?: string | null
          result_path?: string | null
          result_url?: string | null
          size_bytes?: number | null
          source_path: string
          source_url: string
          started_at?: string | null
          status?: string
        }
        Update: {
          bucket?: string
          completed_at?: string | null
          content_type?: string
          created_at?: string
          error_message?: string | null
          id?: string | null
          result_path?: string | null
          result_url?: string | null
          size_bytes?: number | null
          source_path?: string
          source_url?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      async_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_by: string | null
          dedup_key: string
          error_message: string | null
          job_id: string | null
          job_name: string
          organization_id: string | null
          payload_ref: string | null
          provider: string
          provider_message_id: string | null
          queued_at: string
          result: Json | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_by?: string | null
          dedup_key: string
          error_message?: string | null
          job_id?: string | null
          job_name: string
          organization_id?: string | null
          payload_ref?: string | null
          provider?: string
          provider_message_id?: string | null
          queued_at?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_by?: string | null
          dedup_key?: string
          error_message?: string | null
          job_id?: string | null
          job_name?: string
          organization_id?: string | null
          payload_ref?: string | null
          provider?: string
          provider_message_id?: string | null
          queued_at?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_status_checks: {
        Row: {
          checked_at: string
          component_key: string
          error_classification: string
          error_detail: string | null
          id: string | null
          latency_ms: number
          status: string
          triggered_by: string
          triggered_by_user_id: string | null
        }
        Insert: {
          checked_at?: string
          component_key: string
          error_classification?: string
          error_detail?: string | null
          id?: string | null
          latency_ms?: number
          status: string
          triggered_by?: string
          triggered_by_user_id?: string | null
        }
        Update: {
          checked_at?: string
          component_key?: string
          error_classification?: string
          error_detail?: string | null
          id?: string | null
          latency_ms?: number
          status?: string
          triggered_by?: string
          triggered_by_user_id?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          id: string | null
          ip: string | null
          metadata: Json
          occurred_at: string
          org_id: string | null
          resource_id: string | null
          resource_type: string | null
          result: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          id?: string | null
          ip?: string | null
          metadata?: Json
          occurred_at?: string
          org_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          result: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          id?: string | null
          ip?: string | null
          metadata?: Json
          occurred_at?: string
          org_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          result?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      privacy_deletion_requests: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          id: string | null
          metadata: Json
          requested_at: string
          requester_ip: string | null
          scheduled_deletion_at: string
          status: string
          subject_user_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          id?: string | null
          metadata?: Json
          requested_at?: string
          requester_ip?: string | null
          scheduled_deletion_at?: string
          status?: string
          subject_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          id?: string | null
          metadata?: Json
          requested_at?: string
          requester_ip?: string | null
          scheduled_deletion_at?: string
          status?: string
          subject_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      learning_preview_cache: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          kind: string
          locale: string
          model_name: string | null
          organization_id: string
          payload: Json
          target_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          kind: string
          locale: string
          model_name?: string | null
          organization_id: string
          payload: Json
          target_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          kind?: string
          locale?: string
          model_name?: string | null
          organization_id?: string
          payload?: Json
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_preview_cache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_settings: {
        Row: {
          max_output_tokens: number | null
          model: string
          purpose: string
          temperature: number | null
          thinking_level: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          max_output_tokens?: number | null
          model: string
          purpose: string
          temperature?: number | null
          thinking_level?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          max_output_tokens?: number | null
          model?: string
          purpose?: string
          temperature?: number | null
          thinking_level?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_model_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_settings_audit: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_value: Json | null
          operation: string
          previous_value: Json | null
          purpose: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value?: Json | null
          operation: string
          previous_value?: Json | null
          purpose: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value?: Json | null
          operation?: string
          previous_value?: Json | null
          purpose?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_model_settings_audit_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tts_reading_audio_jobs: {
        Row: {
          content_hash: string
          created_at: string
          error_message: string | null
          id: string
          language: string
          last_error_code: string | null
          locked_by: string | null
          locked_until: string | null
          model: string | null
          next_retry_at: string
          processing_finished_at: string | null
          processing_started_at: string | null
          prompt_version: number
          retry_count: number
          segment_count: number
          source_id: string
          source_text: string
          source_type: string
          status: string
          updated_at: string
          voice: string | null
        }
        Insert: {
          content_hash: string
          created_at?: string
          error_message?: string | null
          id?: string
          language?: string
          last_error_code?: string | null
          locked_by?: string | null
          locked_until?: string | null
          model?: string | null
          next_retry_at?: string
          processing_finished_at?: string | null
          processing_started_at?: string | null
          prompt_version?: number
          retry_count?: number
          segment_count?: number
          source_id: string
          source_text: string
          source_type: string
          status?: string
          updated_at?: string
          voice?: string | null
        }
        Update: {
          content_hash?: string
          created_at?: string
          error_message?: string | null
          id?: string
          language?: string
          last_error_code?: string | null
          locked_by?: string | null
          locked_until?: string | null
          model?: string | null
          next_retry_at?: string
          processing_finished_at?: string | null
          processing_started_at?: string | null
          prompt_version?: number
          retry_count?: number
          segment_count?: number
          source_id?: string
          source_text?: string
          source_type?: string
          status?: string
          updated_at?: string
          voice?: string | null
        }
        Relationships: []
      }
      tts_reading_audio_assets: {
        Row: {
          bucket: string
          byte_length: number | null
          content_hash: string
          content_type: string
          created_at: string
          generated_at: string
          id: string
          job_id: string | null
          language: string
          lesson_id: string | null
          model: string | null
          prompt_version: number
          segment_context: string
          segment_index: number
          source_id: string
          source_type: string
          storage_path: string
          updated_at: string
          voice: string | null
        }
        Insert: {
          bucket?: string
          byte_length?: number | null
          content_hash: string
          content_type?: string
          created_at?: string
          generated_at?: string
          id?: string
          job_id?: string | null
          language?: string
          lesson_id?: string | null
          model?: string | null
          prompt_version?: number
          segment_context?: string
          segment_index: number
          source_id: string
          source_type: string
          storage_path: string
          updated_at?: string
          voice?: string | null
        }
        Update: {
          bucket?: string
          byte_length?: number | null
          content_hash?: string
          content_type?: string
          created_at?: string
          generated_at?: string
          id?: string
          job_id?: string | null
          language?: string
          lesson_id?: string | null
          model?: string | null
          prompt_version?: number
          segment_context?: string
          segment_index?: number
          source_id?: string
          source_type?: string
          storage_path?: string
          updated_at?: string
          voice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tts_reading_audio_assets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "tts_reading_audio_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tts_reading_audio_assets_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      admin_dashboard_layouts: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          layout_config: Json
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          layout_config?: Json
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          layout_config?: Json
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_dashboard_layouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_dashboard_layouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_dashboard_layouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_dashboard_layouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_dashboard_preferences: {
        Row: {
          activity_period: string | null
          created_at: string | null
          growth_chart_metrics: Json | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_period?: string | null
          created_at?: string | null
          growth_chart_metrics?: Json | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_period?: string | null
          created_at?: string | null
          growth_chart_metrics?: Json | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_dashboard_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_dashboard_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_dashboard_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_dashboard_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      adopcion_genai: {
        Row: {
          fecha_fuente: string | null
          fuente: string | null
          id: number
          indice_aipi: number | null
          pais: string | null
        }
        Insert: {
          fecha_fuente?: string | null
          fuente?: string | null
          id?: number
          indice_aipi?: number | null
          pais?: string | null
        }
        Update: {
          fecha_fuente?: string | null
          fuente?: string | null
          id?: number
          indice_aipi?: number | null
          pais?: string | null
        }
        Relationships: []
      }
      ai_moderation_config: {
        Row: {
          config_key: string
          config_value: string
          description: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_moderation_logs: {
        Row: {
          api_response: Json | null
          categories: Json | null
          confidence_score: number | null
          content_id: string | null
          content_text: string
          content_type: string
          created_at: string
          is_flagged: boolean
          log_id: string
          model_used: string | null
          processing_time_ms: number | null
          reasoning: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          api_response?: Json | null
          categories?: Json | null
          confidence_score?: number | null
          content_id?: string | null
          content_text: string
          content_type: string
          created_at?: string
          is_flagged?: boolean
          log_id?: string
          model_used?: string | null
          processing_time_ms?: number | null
          reasoning?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          api_response?: Json | null
          categories?: Json | null
          confidence_score?: number | null
          content_id?: string | null
          content_text?: string
          content_type?: string
          created_at?: string
          is_flagged?: boolean
          log_id?: string
          model_used?: string | null
          processing_time_ms?: number | null
          reasoning?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      areas: {
        Row: {
          id: number
          nombre: string
          slug: string
        }
        Insert: {
          id?: number
          nombre: string
          slug: string
        }
        Update: {
          id?: number
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      calendar_integrations: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          provider: string
          refresh_token: string | null
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      calendar_subscription_tokens: {
        Row: {
          created_at: string | null
          id: string
          last_used_at: string | null
          token: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          token?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          token?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      calendar_sync_history: {
        Row: {
          changes_detected: Json | null
          created_at: string | null
          events_snapshot: Json
          id: string
          lia_notification_sent: boolean | null
          notification_message: string | null
          plan_id: string | null
          synced_at: string | null
          user_id: string
        }
        Insert: {
          changes_detected?: Json | null
          created_at?: string | null
          events_snapshot: Json
          id?: string
          lia_notification_sent?: boolean | null
          notification_message?: string | null
          plan_id?: string | null
          synced_at?: string | null
          user_id: string
        }
        Update: {
          changes_detected?: Json | null
          created_at?: string | null
          events_snapshot?: Json
          id?: string
          lia_notification_sent?: boolean | null
          notification_message?: string | null
          plan_id?: string | null
          synced_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_history_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plan_progress"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "calendar_sync_history_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_history_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "v_ai_generated_plans"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "calendar_sync_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_sync_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_sync_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      certificate_ledger: {
        Row: {
          block_hash: string
          block_id: number
          cert_id: string
          created_at: string
          op: string
          payload: Json
          prev_hash: string | null
        }
        Insert: {
          block_hash: string
          block_id?: number
          cert_id: string
          created_at?: string
          op: string
          payload?: Json
          prev_hash?: string | null
        }
        Update: {
          block_hash?: string
          block_id?: number
          cert_id?: string
          created_at?: string
          op?: string
          payload?: Json
          prev_hash?: string | null
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          created_at: string | null
          description: string | null
          design_config: Json
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          design_config?: Json
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          design_config?: Json
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "certificate_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      content_translations: {
        Row: {
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          language_code: string
          translations: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          language_code: string
          translations?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          language_code?: string
          translations?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_translations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_translations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_translations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_translations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_legacy_progress_claims: {
        Row: {
          claim_id: string
          claim_source: string
          claimed_at: string
          claimed_by: string
          course_id: string
          metadata: Json
          source_enrollment_id: string | null
          target_enrollment_id: string
          target_organization_id: string
          user_id: string
        }
        Insert: {
          claim_id?: string
          claim_source?: string
          claimed_at?: string
          claimed_by: string
          course_id: string
          metadata?: Json
          source_enrollment_id?: string | null
          target_enrollment_id: string
          target_organization_id: string
          user_id: string
        }
        Update: {
          claim_id?: string
          claim_source?: string
          claimed_at?: string
          claimed_by?: string
          course_id?: string
          metadata?: Json
          source_enrollment_id?: string | null
          target_enrollment_id?: string
          target_organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_legacy_progress_claims_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_legacy_progress_claims_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_legacy_progress_claims_target_enrollment_id_fkey"
            columns: ["target_enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "course_legacy_progress_claims_target_organization_id_fkey"
            columns: ["target_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_legacy_progress_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_scope_consolidation_runs: {
        Row: {
          course_id: string | null
          created_at: string
          migrated_by: string | null
          moved_counts: Json
          run_id: string
          source_enrollment_ids: string[]
          target_enrollment_id: string | null
          target_organization_id: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          migrated_by?: string | null
          moved_counts?: Json
          run_id?: string
          source_enrollment_ids?: string[]
          target_enrollment_id?: string | null
          target_organization_id: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          migrated_by?: string | null
          moved_counts?: Json
          run_id?: string
          source_enrollment_ids?: string[]
          target_enrollment_id?: string | null
          target_organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_scope_consolidation_runs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_scope_consolidation_runs_migrated_by_fkey"
            columns: ["migrated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_scope_consolidation_runs_target_enrollment_id_fkey"
            columns: ["target_enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "course_scope_consolidation_runs_target_organization_id_fkey"
            columns: ["target_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_scope_consolidation_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          created_at: string | null
          duration_seconds: number
          instructor_id: string
          is_published: boolean | null
          lesson_description: string | null
          lesson_id: string
          lesson_order_index: number
          lesson_title: string
          module_id: string
          summary_content: string | null
          total_duration_minutes: number | null
          transcript_content: string | null
          updated_at: string | null
          video_provider: string
          video_provider_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds: number
          instructor_id: string
          is_published?: boolean | null
          lesson_description?: string | null
          lesson_id?: string
          lesson_order_index?: number
          lesson_title: string
          module_id: string
          summary_content?: string | null
          total_duration_minutes?: number | null
          transcript_content?: string | null
          updated_at?: string | null
          video_provider: string
          video_provider_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number
          instructor_id?: string
          is_published?: boolean | null
          lesson_description?: string | null
          lesson_id?: string
          lesson_order_index?: number
          lesson_title?: string
          module_id?: string
          summary_content?: string | null
          total_duration_minutes?: number | null
          transcript_content?: string | null
          updated_at?: string | null
          video_provider?: string
          video_provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["module_id"]
          },
        ]
      }
      course_lessons_en: {
        Row: {
          created_at: string | null
          duration_seconds: number
          instructor_id: string
          is_published: boolean | null
          lesson_description: string | null
          lesson_id: string
          lesson_order_index: number
          lesson_title: string
          module_id: string
          summary_content: string | null
          transcript_content: string | null
          updated_at: string | null
          video_provider: string
          video_provider_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds: number
          instructor_id: string
          is_published?: boolean | null
          lesson_description?: string | null
          lesson_id?: string
          lesson_order_index?: number
          lesson_title: string
          module_id: string
          summary_content?: string | null
          transcript_content?: string | null
          updated_at?: string | null
          video_provider: string
          video_provider_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number
          instructor_id?: string
          is_published?: boolean | null
          lesson_description?: string | null
          lesson_id?: string
          lesson_order_index?: number
          lesson_title?: string
          module_id?: string
          summary_content?: string | null
          transcript_content?: string | null
          updated_at?: string | null
          video_provider?: string
          video_provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_en_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_en_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_en_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_en_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_en_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["module_id"]
          },
        ]
      }
      course_lessons_pt: {
        Row: {
          created_at: string | null
          duration_seconds: number
          instructor_id: string
          is_published: boolean | null
          lesson_description: string | null
          lesson_id: string
          lesson_order_index: number
          lesson_title: string
          module_id: string
          summary_content: string | null
          transcript_content: string | null
          updated_at: string | null
          video_provider: string
          video_provider_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds: number
          instructor_id: string
          is_published?: boolean | null
          lesson_description?: string | null
          lesson_id?: string
          lesson_order_index?: number
          lesson_title: string
          module_id: string
          summary_content?: string | null
          transcript_content?: string | null
          updated_at?: string | null
          video_provider: string
          video_provider_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number
          instructor_id?: string
          is_published?: boolean | null
          lesson_description?: string | null
          lesson_id?: string
          lesson_order_index?: number
          lesson_title?: string
          module_id?: string
          summary_content?: string | null
          transcript_content?: string | null
          updated_at?: string | null
          video_provider?: string
          video_provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_pt_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_pt_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_pt_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_pt_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_pt_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["module_id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string | null
          is_published: boolean | null
          is_required: boolean | null
          module_description: string | null
          module_duration_minutes: number | null
          module_id: string
          module_order_index: number
          module_title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          is_published?: boolean | null
          is_required?: boolean | null
          module_description?: string | null
          module_duration_minutes?: number | null
          module_id?: string
          module_order_index?: number
          module_title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          is_published?: boolean | null
          is_required?: boolean | null
          module_description?: string | null
          module_duration_minutes?: number | null
          module_id?: string
          module_order_index?: number
          module_title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
        ]
      }
      course_question_reactions: {
        Row: {
          created_at: string | null
          id: string
          question_id: string | null
          reaction_type: string
          response_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id?: string | null
          reaction_type?: string
          response_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: string | null
          reaction_type?: string
          response_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_question_reactions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "course_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_reactions_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "course_question_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_question_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_question_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_question_responses: {
        Row: {
          attachment_data: Json | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          course_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_approved_answer: boolean | null
          is_deleted: boolean | null
          is_edited: boolean | null
          is_instructor_answer: boolean | null
          organization_id: string | null
          parent_response_id: string | null
          question_id: string
          reaction_count: number | null
          reply_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_data?: Json | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          course_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_approved_answer?: boolean | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_instructor_answer?: boolean | null
          organization_id?: string | null
          parent_response_id?: string | null
          question_id: string
          reaction_count?: number | null
          reply_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_data?: Json | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          course_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_approved_answer?: boolean | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_instructor_answer?: boolean | null
          organization_id?: string | null
          parent_response_id?: string | null
          question_id?: string
          reaction_count?: number | null
          reply_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_question_responses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_responses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_question_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "course_question_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "course_question_responses_parent_response_id_fkey"
            columns: ["parent_response_id"]
            isOneToOne: false
            referencedRelation: "course_question_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "course_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_question_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_question_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_questions: {
        Row: {
          attachment_data: Json | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          course_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean | null
          is_hidden: boolean | null
          is_pinned: boolean | null
          is_resolved: boolean | null
          lesson_id: string | null
          organization_id: string | null
          reaction_count: number | null
          response_count: number | null
          tags: string[] | null
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          attachment_data?: Json | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          course_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          lesson_id?: string | null
          organization_id?: string | null
          reaction_count?: number | null
          response_count?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          attachment_data?: Json | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          course_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          lesson_id?: string | null
          organization_id?: string | null
          reaction_count?: number | null
          response_count?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "course_questions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_questions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "course_questions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "course_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          course_id: string
          created_at: string | null
          is_public: boolean | null
          is_verified: boolean | null
          rating: number
          review_content: string
          review_id: string
          review_title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          is_public?: boolean | null
          is_verified?: boolean | null
          rating: number
          review_content: string
          review_id?: string
          review_title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          is_public?: boolean | null
          is_verified?: boolean | null
          rating?: number
          review_content?: string
          review_id?: string
          review_title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      courses: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          average_rating: number | null
          category: string
          created_at: string | null
          description: string | null
          duration_total_minutes: number | null
          id: string
          instructor_id: string | null
          is_active: boolean | null
          learning_objectives: Json | null
          level: string
          price: number | null
          rejection_reason: string | null
          review_count: number | null
          slug: string
          student_count: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          duration_total_minutes?: number | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          learning_objectives?: Json | null
          level?: string
          price?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          slug: string
          student_count?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          duration_total_minutes?: number | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          learning_objectives?: Json | null
          level?: string
          price?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          slug?: string
          student_count?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "courses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "courses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_courses_instructor"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_courses_instructor"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_courses_instructor"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_courses_instructor"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daily_progress: {
        Row: {
          created_at: string | null
          had_activity: boolean | null
          id: string
          organization_id: string | null
          progress_date: string
          sessions_completed: number | null
          sessions_missed: number | null
          streak_count: number | null
          study_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          had_activity?: boolean | null
          id?: string
          organization_id?: string | null
          progress_date: string
          sessions_completed?: number | null
          sessions_missed?: number | null
          streak_count?: number | null
          study_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          had_activity?: boolean | null
          id?: string
          organization_id?: string | null
          progress_date?: string
          sessions_completed?: number | null
          sessions_missed?: number | null
          streak_count?: number | null
          study_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "daily_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "daily_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "daily_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "daily_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          layout_config: Json
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          layout_config?: Json
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          layout_config?: Json
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_layouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_layouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "dashboard_layouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      forbidden_words: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          severity: string
          updated_at: string
          word: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          severity?: string
          updated_at?: string
          word: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          severity?: string
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
      lesson_activities: {
        Row: {
          activity_config: Json | null
          activity_content: string
          activity_description: string | null
          activity_id: string
          activity_order_index: number
          activity_schema_version: number
          activity_title: string
          activity_type: string
          ai_prompts: string | null
          created_at: string | null
          estimated_time_minutes: number | null
          external_tool_key: string | null
          is_required: boolean | null
          lesson_id: string
          requires_soflia_validation: boolean
        }
        Insert: {
          activity_config?: Json | null
          activity_content: string
          activity_description?: string | null
          activity_id?: string
          activity_order_index?: number
          activity_schema_version?: number
          activity_title: string
          activity_type: string
          ai_prompts?: string | null
          created_at?: string | null
          estimated_time_minutes?: number | null
          external_tool_key?: string | null
          is_required?: boolean | null
          lesson_id: string
          requires_soflia_validation?: boolean
        }
        Update: {
          activity_config?: Json | null
          activity_content?: string
          activity_description?: string | null
          activity_id?: string
          activity_order_index?: number
          activity_schema_version?: number
          activity_title?: string
          activity_type?: string
          ai_prompts?: string | null
          created_at?: string | null
          estimated_time_minutes?: number | null
          external_tool_key?: string | null
          is_required?: boolean | null
          lesson_id?: string
          requires_soflia_validation?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lesson_activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      lesson_checkpoints: {
        Row: {
          checkpoint_description: string | null
          checkpoint_id: string
          checkpoint_label: string | null
          checkpoint_order_index: number | null
          checkpoint_time_seconds: number
          created_at: string | null
          is_required_completion: boolean | null
          lesson_id: string
        }
        Insert: {
          checkpoint_description?: string | null
          checkpoint_id?: string
          checkpoint_label?: string | null
          checkpoint_order_index?: number | null
          checkpoint_time_seconds: number
          created_at?: string | null
          is_required_completion?: boolean | null
          lesson_id: string
        }
        Update: {
          checkpoint_description?: string | null
          checkpoint_id?: string
          checkpoint_label?: string | null
          checkpoint_order_index?: number | null
          checkpoint_time_seconds?: number
          created_at?: string | null
          is_required_completion?: boolean | null
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_checkpoints_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_checkpoints_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_checkpoints_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      lesson_feedback: {
        Row: {
          created_at: string | null
          feedback_type: string
          id: string
          lesson_id: string
          organization_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_type: string
          id?: string
          lesson_id: string
          organization_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_type?: string
          id?: string
          lesson_id?: string
          organization_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_feedback_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_feedback_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_feedback_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "lesson_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "lesson_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quiz_feedback_cache: {
        Row: {
          activity_id: string | null
          course_id: string
          created_at: string
          enrollment_id: string | null
          feedback_content: string
          feedback_id: string
          lesson_id: string
          material_id: string | null
          metadata: Json
          organization_id: string | null
          prompt_hash: string
          prompt_text: string
          source_model: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          course_id: string
          created_at?: string
          enrollment_id?: string | null
          feedback_content: string
          feedback_id?: string
          lesson_id: string
          material_id?: string | null
          metadata?: Json
          organization_id?: string | null
          prompt_hash: string
          prompt_text: string
          source_model?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          course_id?: string
          created_at?: string
          enrollment_id?: string | null
          feedback_content?: string
          feedback_id?: string
          lesson_id?: string
          material_id?: string | null
          metadata?: Json
          organization_id?: string | null
          prompt_hash?: string
          prompt_text?: string
          source_model?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_feedback_cache_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lesson_activities"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "quiz_feedback_cache_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_feedback_cache_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "quiz_feedback_cache_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "quiz_feedback_cache_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "lesson_materials"
            referencedColumns: ["material_id"]
          },
          {
            foreignKeyName: "quiz_feedback_cache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_feedback_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_materials: {
        Row: {
          content_data: Json | null
          created_at: string | null
          estimated_time_minutes: number | null
          external_url: string | null
          file_url: string | null
          is_downloadable: boolean | null
          lesson_id: string
          material_description: string | null
          material_id: string
          material_order_index: number | null
          material_title: string
          material_type: string
        }
        Insert: {
          content_data?: Json | null
          created_at?: string | null
          estimated_time_minutes?: number | null
          external_url?: string | null
          file_url?: string | null
          is_downloadable?: boolean | null
          lesson_id: string
          material_description?: string | null
          material_id?: string
          material_order_index?: number | null
          material_title: string
          material_type: string
        }
        Update: {
          content_data?: Json | null
          created_at?: string | null
          estimated_time_minutes?: number | null
          external_url?: string | null
          file_url?: string | null
          is_downloadable?: boolean | null
          lesson_id?: string
          material_description?: string | null
          material_id?: string
          material_order_index?: number | null
          material_title?: string
          material_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      lesson_time_estimates: {
        Row: {
          activities_time_minutes: number | null
          calculated_at: string | null
          exercise_time_minutes: number | null
          id: string
          interactions_time_minutes: number | null
          lesson_id: string
          link_time_minutes: number | null
          quiz_time_minutes: number | null
          reading_time_minutes: number | null
          total_time_minutes: number | null
          updated_at: string | null
          video_duration_seconds: number | null
          video_minutes: number | null
        }
        Insert: {
          activities_time_minutes?: number | null
          calculated_at?: string | null
          exercise_time_minutes?: number | null
          id?: string
          interactions_time_minutes?: number | null
          lesson_id: string
          link_time_minutes?: number | null
          quiz_time_minutes?: number | null
          reading_time_minutes?: number | null
          total_time_minutes?: number | null
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_minutes?: number | null
        }
        Update: {
          activities_time_minutes?: number | null
          calculated_at?: string | null
          exercise_time_minutes?: number | null
          id?: string
          interactions_time_minutes?: number | null
          lesson_id?: string
          link_time_minutes?: number | null
          quiz_time_minutes?: number | null
          reading_time_minutes?: number | null
          total_time_minutes?: number | null
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_time_estimates_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_time_estimates_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_time_estimates_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      lesson_tracking: {
        Row: {
          completed_at: string | null
          created_at: string
          end_trigger: string | null
          enrollment_id: string | null
          id: string
          last_activity_at: string | null
          lesson_id: string
          lia_first_message_at: string | null
          lia_last_message_at: string | null
          next_analysis_at: string | null
          organization_id: string | null
          plan_id: string | null
          post_content_start_at: string | null
          session_id: string | null
          start_trigger: string | null
          started_at: string | null
          status: string
          t_lesson_minutes: number | null
          t_materials_minutes: number | null
          t_restante_minutes: number | null
          t_video_minutes: number | null
          updated_at: string
          user_id: string
          video_checkpoint_seconds: number | null
          video_ended_at: string | null
          video_max_seconds: number | null
          video_playback_rate: number | null
          video_started_at: string | null
          video_total_duration_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          end_trigger?: string | null
          enrollment_id?: string | null
          id?: string
          last_activity_at?: string | null
          lesson_id: string
          lia_first_message_at?: string | null
          lia_last_message_at?: string | null
          next_analysis_at?: string | null
          organization_id?: string | null
          plan_id?: string | null
          post_content_start_at?: string | null
          session_id?: string | null
          start_trigger?: string | null
          started_at?: string | null
          status?: string
          t_lesson_minutes?: number | null
          t_materials_minutes?: number | null
          t_restante_minutes?: number | null
          t_video_minutes?: number | null
          updated_at?: string
          user_id: string
          video_checkpoint_seconds?: number | null
          video_ended_at?: string | null
          video_max_seconds?: number | null
          video_playback_rate?: number | null
          video_started_at?: string | null
          video_total_duration_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          end_trigger?: string | null
          enrollment_id?: string | null
          id?: string
          last_activity_at?: string | null
          lesson_id?: string
          lia_first_message_at?: string | null
          lia_last_message_at?: string | null
          next_analysis_at?: string | null
          organization_id?: string | null
          plan_id?: string | null
          post_content_start_at?: string | null
          session_id?: string | null
          start_trigger?: string | null
          started_at?: string | null
          status?: string
          t_lesson_minutes?: number | null
          t_materials_minutes?: number | null
          t_restante_minutes?: number | null
          t_video_minutes?: number | null
          updated_at?: string
          user_id?: string
          video_checkpoint_seconds?: number | null
          video_ended_at?: string | null
          video_max_seconds?: number | null
          video_playback_rate?: number | null
          video_started_at?: string | null
          video_total_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_tracking_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "lesson_tracking_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_tracking_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_tracking_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "lesson_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "lesson_tracking_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plan_progress"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "lesson_tracking_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_tracking_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "v_ai_generated_plans"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "lesson_tracking_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lia_activity_completions: {
        Row: {
          activity_id: string
          attempts_to_complete: number | null
          completed_at: string | null
          completed_steps: number | null
          completion_id: string
          conversation_id: string | null
          created_at: string | null
          current_step: number | null
          generated_output: Json | null
          lia_had_to_redirect: number | null
          organization_id: string | null
          started_at: string | null
          status: string
          time_to_complete_seconds: number | null
          total_steps: number | null
          updated_at: string | null
          user_id: string
          user_needed_help: boolean | null
        }
        Insert: {
          activity_id: string
          attempts_to_complete?: number | null
          completed_at?: string | null
          completed_steps?: number | null
          completion_id?: string
          conversation_id?: string | null
          created_at?: string | null
          current_step?: number | null
          generated_output?: Json | null
          lia_had_to_redirect?: number | null
          organization_id?: string | null
          started_at?: string | null
          status: string
          time_to_complete_seconds?: number | null
          total_steps?: number | null
          updated_at?: string | null
          user_id: string
          user_needed_help?: boolean | null
        }
        Update: {
          activity_id?: string
          attempts_to_complete?: number | null
          completed_at?: string | null
          completed_steps?: number | null
          completion_id?: string
          conversation_id?: string | null
          created_at?: string | null
          current_step?: number | null
          generated_output?: Json | null
          lia_had_to_redirect?: number | null
          organization_id?: string | null
          started_at?: string | null
          status?: string
          time_to_complete_seconds?: number | null
          total_steps?: number | null
          updated_at?: string | null
          user_id?: string
          user_needed_help?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "lia_activity_completions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lesson_activities"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "lia_activity_completions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lia_conversation_analytics"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "lia_activity_completions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lia_conversations"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "lia_activity_completions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_activity_completions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "lia_activity_completions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "lia_activity_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_activity_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_activity_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_activity_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lia_common_questions: {
        Row: {
          activity_id: string | null
          best_response: string | null
          best_response_rating: number | null
          context_type: string | null
          created_at: string | null
          first_asked_at: string | null
          last_asked_at: string | null
          lesson_id: string | null
          question_id: string
          question_text: string
          times_asked: number | null
          updated_at: string | null
        }
        Insert: {
          activity_id?: string | null
          best_response?: string | null
          best_response_rating?: number | null
          context_type?: string | null
          created_at?: string | null
          first_asked_at?: string | null
          last_asked_at?: string | null
          lesson_id?: string | null
          question_id?: string
          question_text: string
          times_asked?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_id?: string | null
          best_response?: string | null
          best_response_rating?: number | null
          context_type?: string | null
          created_at?: string | null
          first_asked_at?: string | null
          last_asked_at?: string | null
          lesson_id?: string | null
          question_id?: string
          question_text?: string
          times_asked?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lia_common_questions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lesson_activities"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "lia_common_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_common_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_common_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      lia_conversations: {
        Row: {
          activity_id: string | null
          browser: string | null
          context_type: string
          conversation_completed: boolean | null
          conversation_id: string
          conversation_title: string | null
          course_id: string | null
          created_at: string | null
          device_type: string | null
          duration_seconds: number | null
          enrollment_id: string | null
          ended_at: string | null
          ip_address: unknown
          lesson_id: string | null
          module_id: string | null
          organization_id: string | null
          started_at: string
          total_lia_messages: number | null
          total_messages: number | null
          total_user_messages: number | null
          updated_at: string | null
          user_abandoned: boolean | null
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          browser?: string | null
          context_type: string
          conversation_completed?: boolean | null
          conversation_id?: string
          conversation_title?: string | null
          course_id?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          enrollment_id?: string | null
          ended_at?: string | null
          ip_address?: unknown
          lesson_id?: string | null
          module_id?: string | null
          organization_id?: string | null
          started_at?: string
          total_lia_messages?: number | null
          total_messages?: number | null
          total_user_messages?: number | null
          updated_at?: string | null
          user_abandoned?: boolean | null
          user_id: string
        }
        Update: {
          activity_id?: string | null
          browser?: string | null
          context_type?: string
          conversation_completed?: boolean | null
          conversation_id?: string
          conversation_title?: string | null
          course_id?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          enrollment_id?: string | null
          ended_at?: string | null
          ip_address?: unknown
          lesson_id?: string | null
          module_id?: string | null
          organization_id?: string | null
          started_at?: string
          total_lia_messages?: number | null
          total_messages?: number | null
          total_user_messages?: number | null
          updated_at?: string | null
          user_abandoned?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lia_conversations_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "lia_conversations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lesson_activities"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "lia_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "lia_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_conversations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "lia_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "lia_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lia_live_sessions: {
        Row: {
          assistant_transcript_count: number
          context: Json | null
          context_type: string
          conversation_id: string | null
          created_at: string
          duration_ms: number | null
          ended_at: string | null
          error_count: number
          interruption_count: number
          language: string | null
          model: string | null
          organization_id: string | null
          outcome: string
          session_id: string
          source: string
          started_at: string
          turn_count: number
          updated_at: string
          user_id: string
          user_transcript_count: number
        }
        Insert: {
          assistant_transcript_count?: number
          context?: Json | null
          context_type?: string
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          error_count?: number
          interruption_count?: number
          language?: string | null
          model?: string | null
          organization_id?: string | null
          outcome?: string
          session_id: string
          source?: string
          started_at: string
          turn_count?: number
          updated_at?: string
          user_id: string
          user_transcript_count?: number
        }
        Update: {
          assistant_transcript_count?: number
          context?: Json | null
          context_type?: string
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          error_count?: number
          interruption_count?: number
          language?: string | null
          model?: string | null
          organization_id?: string | null
          outcome?: string
          session_id?: string
          source?: string
          started_at?: string
          turn_count?: number
          updated_at?: string
          user_id?: string
          user_transcript_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "lia_live_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lia_conversations"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "lia_live_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_live_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lia_live_transcript_entries: {
        Row: {
          content: string
          created_at: string
          entry_id: string
          role: string
          sequence: number
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_id?: string
          role: string
          sequence: number
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_id?: string
          role?: string
          sequence?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lia_live_transcript_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "lia_live_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      lia_messages: {
        Row: {
          contains_question: boolean | null
          content: string
          conversation_id: string
          cost_usd: number | null
          created_at: string | null
          is_off_topic: boolean | null
          is_system_message: boolean | null
          lia_provided_example: boolean | null
          lia_redirected: boolean | null
          message_id: string
          message_sequence: number
          model_used: string | null
          response_time_ms: number | null
          role: string
          sentiment_score: number | null
          tokens_used: number | null
          user_sentiment: string | null
        }
        Insert: {
          contains_question?: boolean | null
          content: string
          conversation_id: string
          cost_usd?: number | null
          created_at?: string | null
          is_off_topic?: boolean | null
          is_system_message?: boolean | null
          lia_provided_example?: boolean | null
          lia_redirected?: boolean | null
          message_id?: string
          message_sequence: number
          model_used?: string | null
          response_time_ms?: number | null
          role: string
          sentiment_score?: number | null
          tokens_used?: number | null
          user_sentiment?: string | null
        }
        Update: {
          contains_question?: boolean | null
          content?: string
          conversation_id?: string
          cost_usd?: number | null
          created_at?: string | null
          is_off_topic?: boolean | null
          is_system_message?: boolean | null
          lia_provided_example?: boolean | null
          lia_redirected?: boolean | null
          message_id?: string
          message_sequence?: number
          model_used?: string | null
          response_time_ms?: number | null
          role?: string
          sentiment_score?: number | null
          tokens_used?: number | null
          user_sentiment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lia_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lia_conversation_analytics"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "lia_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lia_conversations"
            referencedColumns: ["conversation_id"]
          },
        ]
      }
      lia_messages_tokens_tmp: {
        Row: {
          contains_question: boolean | null
          content: string | null
          conversation_id: string | null
          cost_usd: number | null
          created_at: string | null
          is_off_topic: boolean | null
          is_system_message: boolean | null
          lia_provided_example: boolean | null
          lia_redirected: boolean | null
          message_id: string
          message_sequence: number | null
          model_used: string | null
          response_time_ms: number | null
          role: string | null
          sentiment_score: number | null
          tokens_used: number | null
          user_sentiment: string | null
        }
        Insert: {
          contains_question?: boolean | null
          content?: string | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          is_off_topic?: boolean | null
          is_system_message?: boolean | null
          lia_provided_example?: boolean | null
          lia_redirected?: boolean | null
          message_id: string
          message_sequence?: number | null
          model_used?: string | null
          response_time_ms?: number | null
          role?: string | null
          sentiment_score?: number | null
          tokens_used?: number | null
          user_sentiment?: string | null
        }
        Update: {
          contains_question?: boolean | null
          content?: string | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          is_off_topic?: boolean | null
          is_system_message?: boolean | null
          lia_provided_example?: boolean | null
          lia_redirected?: boolean | null
          message_id?: string
          message_sequence?: number | null
          model_used?: string | null
          response_time_ms?: number | null
          role?: string | null
          sentiment_score?: number | null
          tokens_used?: number | null
          user_sentiment?: string | null
        }
        Relationships: []
      }
      lia_user_feedback: {
        Row: {
          comment: string | null
          conversation_id: string
          created_at: string | null
          feedback_id: string
          feedback_type: string
          message_id: string
          rating: number | null
          response_off_topic: boolean | null
          response_too_long: boolean | null
          response_too_short: boolean | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          conversation_id: string
          created_at?: string | null
          feedback_id?: string
          feedback_type: string
          message_id: string
          rating?: number | null
          response_off_topic?: boolean | null
          response_too_long?: boolean | null
          response_too_short?: boolean | null
          user_id: string
        }
        Update: {
          comment?: string | null
          conversation_id?: string
          created_at?: string | null
          feedback_id?: string
          feedback_type?: string
          message_id?: string
          rating?: number | null
          response_off_topic?: boolean | null
          response_too_long?: boolean | null
          response_too_short?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lia_user_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lia_conversation_analytics"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "lia_user_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lia_conversations"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "lia_user_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "lia_messages"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "lia_user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      niveles: {
        Row: {
          id: number
          nombre: string
          slug: string
        }
        Insert: {
          id?: number
          nombre: string
          slug: string
        }
        Update: {
          id?: number
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      notification_channel_deliveries: {
        Row: {
          attempts: number
          channel: string
          created_at: string | null
          delivery_id: string
          destination: string | null
          last_error: string | null
          max_attempts: number
          next_attempt_at: string | null
          notification_id: string
          organization_id: string | null
          payload: Json
          provider_message_id: string | null
          sent_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          channel: string
          created_at?: string | null
          delivery_id?: string
          destination?: string | null
          last_error?: string | null
          max_attempts?: number
          next_attempt_at?: string | null
          notification_id: string
          organization_id?: string | null
          payload?: Json
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          channel?: string
          created_at?: string | null
          delivery_id?: string
          destination?: string | null
          last_error?: string | null
          max_attempts?: number
          next_attempt_at?: string | null
          notification_id?: string
          organization_id?: string | null
          payload?: Json
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_channel_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["notification_id"]
          },
          {
            foreignKeyName: "notification_channel_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_channel_deliveries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_email_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          email_type: string
          error_message: string | null
          notification_id: string | null
          priority: string | null
          queue_id: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          notification_id?: string | null
          priority?: string | null
          queue_id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          notification_id?: string | null
          priority?: string | null
          queue_id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_email_queue_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["notification_id"]
          },
          {
            foreignKeyName: "notification_email_queue_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "user_unread_notifications"
            referencedColumns: ["notification_id"]
          },
          {
            foreignKeyName: "notification_email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          keys: Json
          last_used_at: string | null
          status: string | null
          subscription_id: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          keys: Json
          last_used_at?: string | null
          status?: string | null
          subscription_id?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          keys?: Json
          last_used_at?: string | null
          status?: string | null
          subscription_id?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          channels: Json | null
          created_at: string | null
          enabled: boolean | null
          event_type: string
          id: string
          organization_id: string
          template: string | null
          updated_at: string | null
        }
        Insert: {
          channels?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          event_type: string
          id?: string
          organization_id: string
          template?: string | null
          updated_at?: string | null
        }
        Update: {
          channels?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          event_type?: string
          id?: string
          organization_id?: string
          template?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notification_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      notification_stats: {
        Row: {
          action_taken_count: number | null
          avg_read_time_seconds: number | null
          created_at: string | null
          notification_type: string | null
          organization_id: string | null
          read_count: number | null
          sent_count: number | null
          stat_date: string
          stat_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_taken_count?: number | null
          avg_read_time_seconds?: number | null
          created_at?: string | null
          notification_type?: string | null
          organization_id?: string | null
          read_count?: number | null
          sent_count?: number | null
          stat_date?: string
          stat_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken_count?: number | null
          avg_read_time_seconds?: number | null
          created_at?: string | null
          notification_type?: string | null
          organization_id?: string | null
          read_count?: number | null
          sent_count?: number | null
          stat_date?: string
          stat_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notification_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notification_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      oauth_accounts: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          provider: string
          provider_account_id: string
          refresh_token: string | null
          scope: string | null
          token_expires_at: string | null
          token_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          provider: string
          provider_account_id: string
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          provider?: string
          provider_account_id?: string
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_oauth_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_oauth_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_oauth_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_oauth_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "oauth_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "oauth_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "oauth_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      learning_path_items: {
        Row: {
          course_id: string
          created_at: string
          id: string
          learning_path_id: string
          position: number
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          learning_path_id: string
          position: number
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          learning_path_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_items_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_lp_intro_videos: {
        Row: {
          id: string
          organization_id: string
          learning_path_id: string
          intro_video_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          learning_path_id: string
          intro_video_url: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          learning_path_id?: string
          intro_video_url?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_lp_intro_videos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_lp_intro_videos_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_course_intro_videos: {
        Row: {
          id: string
          organization_id: string
          course_id: string
          intro_video_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          course_id: string
          intro_video_url: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          course_id?: string
          intro_video_url?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_course_intro_videos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_intro_videos_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_learning_path_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          intro_video_url: string | null
          learning_path_id: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          intro_video_url?: string | null
          learning_path_id: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          intro_video_url?: string | null
          learning_path_id?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_learning_path_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_learning_path_assignments_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_learning_path_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_analytics: {
        Row: {
          active_users: number | null
          average_completion_rate: number | null
          courses_assigned: number | null
          courses_completed: number | null
          created_at: string | null
          date: string
          id: string
          organization_id: string
          total_learning_hours: number | null
          total_users: number | null
          updated_at: string | null
        }
        Insert: {
          active_users?: number | null
          average_completion_rate?: number | null
          courses_assigned?: number | null
          courses_completed?: number | null
          created_at?: string | null
          date: string
          id?: string
          organization_id: string
          total_learning_hours?: number | null
          total_users?: number | null
          updated_at?: string | null
        }
        Update: {
          active_users?: number | null
          average_completion_rate?: number | null
          courses_assigned?: number | null
          courses_completed?: number | null
          created_at?: string | null
          date?: string
          id?: string
          organization_id?: string
          total_learning_hours?: number | null
          total_users?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organization_course_assignments: {
        Row: {
          approach: string | null
          assigned_at: string | null
          assigned_by: string | null
          completed_at: string | null
          completion_percentage: number | null
          course_id: string
          created_at: string | null
          due_date: string | null
          id: string
          message: string | null
          organization_id: string
          source_learning_path_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approach?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          course_id: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          message?: string | null
          organization_id: string
          source_learning_path_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approach?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          course_id?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          message?: string | null
          organization_id?: string
          source_learning_path_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organization_course_purchases: {
        Row: {
          access_granted_at: string | null
          access_status: string
          billing_month: string
          billing_month_number: number
          billing_year: number
          course_id: string
          created_at: string
          currency: string
          discount_cents: number | null
          discount_type: string | null
          discount_value: number | null
          discounted_price_cents: number
          expires_at: string | null
          final_price_cents: number
          internal_notes: string | null
          metadata: Json
          organization_id: string
          original_price_cents: number
          payment_method_id: string | null
          purchase_id: string
          purchase_method: string | null
          purchase_notes: string | null
          purchased_at: string
          purchased_by: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          access_granted_at?: string | null
          access_status?: string
          billing_month: string
          billing_month_number: number
          billing_year: number
          course_id: string
          created_at?: string
          currency?: string
          discount_cents?: number | null
          discount_type?: string | null
          discount_value?: number | null
          discounted_price_cents: number
          expires_at?: string | null
          final_price_cents: number
          internal_notes?: string | null
          metadata?: Json
          organization_id: string
          original_price_cents: number
          payment_method_id?: string | null
          purchase_id?: string
          purchase_method?: string | null
          purchase_notes?: string | null
          purchased_at?: string
          purchased_by: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          access_granted_at?: string | null
          access_status?: string
          billing_month?: string
          billing_month_number?: number
          billing_year?: number
          course_id?: string
          created_at?: string
          currency?: string
          discount_cents?: number | null
          discount_type?: string | null
          discount_value?: number | null
          discounted_price_cents?: number
          expires_at?: string | null
          final_price_cents?: number
          internal_notes?: string | null
          metadata?: Json
          organization_id?: string
          original_price_cents?: number
          payment_method_id?: string | null
          purchase_id?: string
          purchase_method?: string | null
          purchase_notes?: string | null
          purchased_at?: string
          purchased_by?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["payment_method_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_purchases_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
      organization_notification_preferences: {
        Row: {
          channels: Json | null
          created_at: string | null
          enabled: boolean | null
          event_type: string
          organization_id: string
          preference_id: string
          template: string | null
          updated_at: string | null
        }
        Insert: {
          channels?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          event_type: string
          organization_id: string
          preference_id?: string
          template?: string | null
          updated_at?: string | null
        }
        Update: {
          channels?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          event_type?: string
          organization_id?: string
          preference_id?: string
          template?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          job_description: string | null
          job_title: string | null
          joined_at: string | null
          organization_id: string
          role: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          job_description?: string | null
          job_title?: string | null
          joined_at?: string | null
          organization_id: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          job_description?: string | null
          job_title?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_cycle: string | null
          brand_banner_url: string | null
          brand_color_accent: string | null
          brand_color_primary: string | null
          brand_color_secondary: string | null
          brand_favicon_url: string | null
          brand_font_family: string | null
          brand_logo_url: string | null
          branding_enabled: boolean
          company_country: string | null
          company_mission: string | null
          company_size: string | null
          company_type: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          google_login_enabled: boolean | null
          id: string
          industry: string | null
          is_active: boolean | null
          login_styles: Json | null
          logo_url: string | null
          max_users: number | null
          microsoft_login_enabled: boolean | null
          name: string
          panel_styles: Json | null
          selected_theme: string | null
          show_navbar_name: boolean | null
          slug: string
          subscription_end_date: string | null
          subscription_plan: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          updated_at: string | null
          user_dashboard_styles: Json | null
          website_url: string | null
        }
        Insert: {
          billing_cycle?: string | null
          brand_banner_url?: string | null
          brand_color_accent?: string | null
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          brand_favicon_url?: string | null
          brand_font_family?: string | null
          brand_logo_url?: string | null
          branding_enabled?: boolean
          company_country?: string | null
          company_mission?: string | null
          company_size?: string | null
          company_type?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          google_login_enabled?: boolean | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          login_styles?: Json | null
          logo_url?: string | null
          max_users?: number | null
          microsoft_login_enabled?: boolean | null
          name: string
          panel_styles?: Json | null
          selected_theme?: string | null
          show_navbar_name?: boolean | null
          slug: string
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_dashboard_styles?: Json | null
          website_url?: string | null
        }
        Update: {
          billing_cycle?: string | null
          brand_banner_url?: string | null
          brand_color_accent?: string | null
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          brand_favicon_url?: string | null
          brand_font_family?: string | null
          brand_logo_url?: string | null
          branding_enabled?: boolean
          company_country?: string | null
          company_mission?: string | null
          company_size?: string | null
          company_type?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          google_login_enabled?: boolean | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          login_styles?: Json | null
          logo_url?: string | null
          max_users?: number | null
          microsoft_login_enabled?: boolean | null
          name?: string
          panel_styles?: Json | null
          selected_theme?: string | null
          show_navbar_name?: boolean | null
          slug?: string
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_dashboard_styles?: Json | null
          website_url?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string | null
          encrypted_data: Json
          is_active: boolean | null
          is_default: boolean | null
          payment_method_id: string
          payment_method_name: string
          payment_method_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_data: Json
          is_active?: boolean | null
          is_default?: boolean | null
          payment_method_id?: string
          payment_method_name: string
          payment_method_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_data?: Json
          is_active?: boolean | null
          is_default?: boolean | null
          payment_method_id?: string
          payment_method_name?: string
          payment_method_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      preguntas: {
        Row: {
          area_id: number | null
          bloque: string | null
          codigo: string | null
          created_at: string
          dificultad: number | null
          dimension: Json | null
          escala: Json | null
          exclusivo_nivel_id: number | null
          exclusivo_rol_id: number | null
          id: number
          locale: string | null
          opciones: Json | null
          peso: number | null
          respuesta_correcta: string | null
          scoring: Json | null
          section: string | null
          texto: string
          tipo: string
        }
        Insert: {
          area_id?: number | null
          bloque?: string | null
          codigo?: string | null
          created_at?: string
          dificultad?: number | null
          dimension?: Json | null
          escala?: Json | null
          exclusivo_nivel_id?: number | null
          exclusivo_rol_id?: number | null
          id?: number
          locale?: string | null
          opciones?: Json | null
          peso?: number | null
          respuesta_correcta?: string | null
          scoring?: Json | null
          section?: string | null
          texto: string
          tipo: string
        }
        Update: {
          area_id?: number | null
          bloque?: string | null
          codigo?: string | null
          created_at?: string
          dificultad?: number | null
          dimension?: Json | null
          escala?: Json | null
          exclusivo_nivel_id?: number | null
          exclusivo_rol_id?: number | null
          id?: number
          locale?: string | null
          opciones?: Json | null
          peso?: number | null
          respuesta_correcta?: string | null
          scoring?: Json | null
          section?: string | null
          texto?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "preguntas_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preguntas_exclusivo_nivel_id_fkey"
            columns: ["exclusivo_nivel_id"]
            isOneToOne: false
            referencedRelation: "niveles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preguntas_exclusivo_rol_id_fkey"
            columns: ["exclusivo_rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          expires_at: string
          id: string
          ip_address: string | null
          is_revoked: boolean | null
          last_used_at: string | null
          revoked_at: string | null
          revoked_reason: string | null
          token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          is_revoked?: boolean | null
          last_used_at?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_revoked?: boolean | null
          last_used_at?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      relaciones: {
        Row: {
          id: number
          nombre: string
          slug: string
        }
        Insert: {
          id?: number
          nombre: string
          slug: string
        }
        Update: {
          id?: number
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      reportes_problemas: {
        Row: {
          admin_asignado: string | null
          categoria: string
          comportamiento_esperado: string | null
          created_at: string | null
          descripcion: string
          estado: string | null
          id: string
          metadata: Json | null
          navegador: string | null
          notas_admin: string | null
          pagina_url: string
          pasos_reproducir: string | null
          pathname: string | null
          prioridad: string | null
          recording_duration: number | null
          recording_size: string | null
          resuelto_at: string | null
          screen_resolution: string | null
          screenshot_url: string | null
          session_recording: string | null
          titulo: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          admin_asignado?: string | null
          categoria: string
          comportamiento_esperado?: string | null
          created_at?: string | null
          descripcion: string
          estado?: string | null
          id?: string
          metadata?: Json | null
          navegador?: string | null
          notas_admin?: string | null
          pagina_url: string
          pasos_reproducir?: string | null
          pathname?: string | null
          prioridad?: string | null
          recording_duration?: number | null
          recording_size?: string | null
          resuelto_at?: string | null
          screen_resolution?: string | null
          screenshot_url?: string | null
          session_recording?: string | null
          titulo: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          admin_asignado?: string | null
          categoria?: string
          comportamiento_esperado?: string | null
          created_at?: string | null
          descripcion?: string
          estado?: string | null
          id?: string
          metadata?: Json | null
          navegador?: string | null
          notas_admin?: string | null
          pagina_url?: string
          pasos_reproducir?: string | null
          pathname?: string | null
          prioridad?: string | null
          recording_duration?: number | null
          recording_size?: string | null
          resuelto_at?: string | null
          screen_resolution?: string | null
          screenshot_url?: string | null
          session_recording?: string | null
          titulo?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      respuestas: {
        Row: {
          id: number
          pregunta_id: number
          respondido_en: string
          user_perfil_id: string
          valor: Json | null
        }
        Insert: {
          id?: number
          pregunta_id: number
          respondido_en?: string
          user_perfil_id: string
          valor?: Json | null
        }
        Update: {
          id?: number
          pregunta_id?: number
          respondido_en?: string
          user_perfil_id?: string
          valor?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_respuestas_user_perfil_id"
            columns: ["user_perfil_id"]
            isOneToOne: false
            referencedRelation: "user_perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_pregunta_id_fkey"
            columns: ["pregunta_id"]
            isOneToOne: false
            referencedRelation: "preguntas"
            referencedColumns: ["id"]
          },
        ]
      }
      role_synonyms: {
        Row: {
          alias: string
          id: number
          role_id: number | null
        }
        Insert: {
          alias: string
          id?: number
          role_id?: number | null
        }
        Update: {
          alias?: string
          id?: number
          role_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "role_synonyms_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          area_id: number | null
          id: number
          nombre: string
          slug: string
        }
        Insert: {
          area_id?: number | null
          id?: number
          nombre: string
          slug: string
        }
        Update: {
          area_id?: number | null
          id?: number
          nombre?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      scorm_attempts: {
        Row: {
          attempt_number: number | null
          completed_at: string | null
          credit: string | null
          entry: string | null
          exit_type: string | null
          id: string
          last_accessed_at: string | null
          lesson_location: string | null
          lesson_status: string | null
          package_id: string
          score_max: number | null
          score_min: number | null
          score_raw: number | null
          score_scaled: number | null
          session_time: unknown
          started_at: string | null
          suspend_data: string | null
          total_time: unknown
          user_id: string
        }
        Insert: {
          attempt_number?: number | null
          completed_at?: string | null
          credit?: string | null
          entry?: string | null
          exit_type?: string | null
          id?: string
          last_accessed_at?: string | null
          lesson_location?: string | null
          lesson_status?: string | null
          package_id: string
          score_max?: number | null
          score_min?: number | null
          score_raw?: number | null
          score_scaled?: number | null
          session_time?: unknown
          started_at?: string | null
          suspend_data?: string | null
          total_time?: unknown
          user_id: string
        }
        Update: {
          attempt_number?: number | null
          completed_at?: string | null
          credit?: string | null
          entry?: string | null
          exit_type?: string | null
          id?: string
          last_accessed_at?: string | null
          lesson_location?: string | null
          lesson_status?: string | null
          package_id?: string
          score_max?: number | null
          score_min?: number | null
          score_raw?: number | null
          score_scaled?: number | null
          session_time?: unknown
          started_at?: string | null
          suspend_data?: string | null
          total_time?: unknown
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scorm_attempts_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "scorm_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorm_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "scorm_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorm_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "scorm_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      scorm_interactions: {
        Row: {
          attempt_id: string | null
          correct_response: string | null
          description: string | null
          id: string
          interaction_id: string
          interaction_type: string | null
          latency: unknown
          learner_response: string | null
          result: string | null
          timestamp: string | null
          weighting: number | null
        }
        Insert: {
          attempt_id?: string | null
          correct_response?: string | null
          description?: string | null
          id?: string
          interaction_id: string
          interaction_type?: string | null
          latency?: unknown
          learner_response?: string | null
          result?: string | null
          timestamp?: string | null
          weighting?: number | null
        }
        Update: {
          attempt_id?: string | null
          correct_response?: string | null
          description?: string | null
          id?: string
          interaction_id?: string
          interaction_type?: string | null
          latency?: unknown
          learner_response?: string | null
          result?: string | null
          timestamp?: string | null
          weighting?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scorm_interactions_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "scorm_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      scorm_objectives: {
        Row: {
          attempt_id: string | null
          completion_status: string | null
          description: string | null
          id: string
          objective_id: string
          score_max: number | null
          score_min: number | null
          score_raw: number | null
          score_scaled: number | null
          success_status: string | null
        }
        Insert: {
          attempt_id?: string | null
          completion_status?: string | null
          description?: string | null
          id?: string
          objective_id: string
          score_max?: number | null
          score_min?: number | null
          score_raw?: number | null
          score_scaled?: number | null
          success_status?: string | null
        }
        Update: {
          attempt_id?: string | null
          completion_status?: string | null
          description?: string | null
          id?: string
          objective_id?: string
          score_max?: number | null
          score_min?: number | null
          score_raw?: number | null
          score_scaled?: number | null
          success_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scorm_objectives_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "scorm_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      scorm_packages: {
        Row: {
          course_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          entry_point: string
          file_size: number | null
          id: string
          manifest_data: Json
          organization_id: string | null
          status: string | null
          storage_path: string
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_point: string
          file_size?: number | null
          id?: string
          manifest_data: Json
          organization_id?: string | null
          status?: string | null
          storage_path: string
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_point?: string
          file_size?: number | null
          id?: string
          manifest_data?: Json
          organization_id?: string | null
          status?: string | null
          storage_path?: string
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scorm_packages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorm_packages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "scorm_packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "scorm_packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorm_packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "scorm_packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "scorm_packages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorm_packages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "scorm_packages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      sectores: {
        Row: {
          id: number
          nombre: string
          slug: string
        }
        Insert: {
          id?: number
          nombre: string
          slug: string
        }
        Update: {
          id?: number
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          ai_generation_metadata: Json | null
          break_duration_minutes: number | null
          break_intervals: Json | null
          calendar_analyzed: boolean | null
          calendar_provider: string | null
          course_ids: string[] | null
          created_at: string
          description: string | null
          end_date: string | null
          generation_mode: string | null
          goal_hours_per_week: number
          id: string
          lia_availability_analysis: Json | null
          lia_time_analysis: Json | null
          max_session_minutes: number | null
          max_study_session_minutes: number | null
          min_rest_minutes: number | null
          min_session_minutes: number | null
          min_study_minutes: number | null
          name: string
          organization_id: string | null
          preferred_days: number[]
          preferred_session_type: string | null
          preferred_time_blocks: Json | null
          start_date: string | null
          timezone: string
          updated_at: string
          user_id: string
          user_type: string | null
        }
        Insert: {
          ai_generation_metadata?: Json | null
          break_duration_minutes?: number | null
          break_intervals?: Json | null
          calendar_analyzed?: boolean | null
          calendar_provider?: string | null
          course_ids?: string[] | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          generation_mode?: string | null
          goal_hours_per_week?: number
          id?: string
          lia_availability_analysis?: Json | null
          lia_time_analysis?: Json | null
          max_session_minutes?: number | null
          max_study_session_minutes?: number | null
          min_rest_minutes?: number | null
          min_session_minutes?: number | null
          min_study_minutes?: number | null
          name: string
          organization_id?: string | null
          preferred_days?: number[]
          preferred_session_type?: string | null
          preferred_time_blocks?: Json | null
          start_date?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
          user_type?: string | null
        }
        Update: {
          ai_generation_metadata?: Json | null
          break_duration_minutes?: number | null
          break_intervals?: Json | null
          calendar_analyzed?: boolean | null
          calendar_provider?: string | null
          course_ids?: string[] | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          generation_mode?: string | null
          goal_hours_per_week?: number
          id?: string
          lia_availability_analysis?: Json | null
          lia_time_analysis?: Json | null
          max_session_minutes?: number | null
          max_study_session_minutes?: number | null
          min_rest_minutes?: number | null
          min_session_minutes?: number | null
          min_study_minutes?: number | null
          name?: string
          organization_id?: string | null
          preferred_days?: number[]
          preferred_session_type?: string | null
          preferred_time_blocks?: Json | null
          start_date?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "study_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      study_preferences: {
        Row: {
          break_duration_minutes: number | null
          calendar_connected: boolean | null
          calendar_provider: string | null
          created_at: string
          daily_target_minutes: number
          id: string
          max_session_minutes: number | null
          min_session_minutes: number | null
          preferred_days: number[]
          preferred_session_type: string | null
          preferred_time_of_day: string
          timezone: string
          updated_at: string
          user_id: string
          weekly_target_minutes: number
        }
        Insert: {
          break_duration_minutes?: number | null
          calendar_connected?: boolean | null
          calendar_provider?: string | null
          created_at?: string
          daily_target_minutes?: number
          id?: string
          max_session_minutes?: number | null
          min_session_minutes?: number | null
          preferred_days?: number[]
          preferred_session_type?: string | null
          preferred_time_of_day?: string
          timezone?: string
          updated_at?: string
          user_id: string
          weekly_target_minutes?: number
        }
        Update: {
          break_duration_minutes?: number | null
          calendar_connected?: boolean | null
          calendar_provider?: string | null
          created_at?: string
          daily_target_minutes?: number
          id?: string
          max_session_minutes?: number | null
          min_session_minutes?: number | null
          preferred_days?: number[]
          preferred_session_type?: string | null
          preferred_time_of_day?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          weekly_target_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          actual_duration_minutes: number | null
          break_duration_minutes: number | null
          calendar_conflict_checked: boolean | null
          calendar_provider: string | null
          calendar_synced_at: string | null
          completed_at: string | null
          completion_method: string | null
          course_complexity: Json | null
          course_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          duration_minutes: number | null
          end_time: string
          external_event_id: string | null
          focus_area: string | null
          id: string
          is_ai_generated: boolean | null
          lesson_id: string | null
          lesson_min_time_minutes: number | null
          lia_suggested: boolean | null
          metrics: Json | null
          notes: string | null
          organization_id: string | null
          plan_id: string | null
          recurrence: Json | null
          rescheduled_from: string | null
          self_evaluation: number | null
          session_type: string | null
          start_time: string
          started_at: string | null
          status: string
          streak_day: number | null
          title: string
          updated_at: string
          user_id: string
          was_rescheduled: boolean | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          break_duration_minutes?: number | null
          calendar_conflict_checked?: boolean | null
          calendar_provider?: string | null
          calendar_synced_at?: string | null
          completed_at?: string | null
          completion_method?: string | null
          course_complexity?: Json | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          end_time: string
          external_event_id?: string | null
          focus_area?: string | null
          id?: string
          is_ai_generated?: boolean | null
          lesson_id?: string | null
          lesson_min_time_minutes?: number | null
          lia_suggested?: boolean | null
          metrics?: Json | null
          notes?: string | null
          organization_id?: string | null
          plan_id?: string | null
          recurrence?: Json | null
          rescheduled_from?: string | null
          self_evaluation?: number | null
          session_type?: string | null
          start_time: string
          started_at?: string | null
          status?: string
          streak_day?: number | null
          title: string
          updated_at?: string
          user_id: string
          was_rescheduled?: boolean | null
        }
        Update: {
          actual_duration_minutes?: number | null
          break_duration_minutes?: number | null
          calendar_conflict_checked?: boolean | null
          calendar_provider?: string | null
          calendar_synced_at?: string | null
          completed_at?: string | null
          completion_method?: string | null
          course_complexity?: Json | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          end_time?: string
          external_event_id?: string | null
          focus_area?: string | null
          id?: string
          is_ai_generated?: boolean | null
          lesson_id?: string | null
          lesson_min_time_minutes?: number | null
          lia_suggested?: boolean | null
          metrics?: Json | null
          notes?: string | null
          organization_id?: string | null
          plan_id?: string | null
          recurrence?: Json | null
          rescheduled_from?: string | null
          self_evaluation?: number | null
          session_type?: string | null
          start_time?: string
          started_at?: string | null
          status?: string
          streak_day?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          was_rescheduled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "study_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "study_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "study_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "study_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "study_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plan_progress"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "study_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "v_ai_generated_plans"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          course_id: string | null
          created_at: string | null
          end_date: string | null
          next_billing_date: string | null
          plan_id: string | null
          price_cents: number
          start_date: string | null
          subscription_id: string
          subscription_status: string | null
          subscription_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          end_date?: string | null
          next_billing_date?: string | null
          plan_id?: string | null
          price_cents: number
          start_date?: string | null
          subscription_id?: string
          subscription_status?: string | null
          subscription_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          end_date?: string | null
          next_billing_date?: string | null
          plan_id?: string | null
          price_cents?: number
          start_date?: string | null
          subscription_id?: string
          subscription_status?: string | null
          subscription_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tamanos_empresa: {
        Row: {
          id: number
          max_empleados: number | null
          min_empleados: number | null
          nombre: string
          slug: string
        }
        Insert: {
          id?: number
          max_empleados?: number | null
          min_empleados?: number | null
          nombre: string
          slug: string
        }
        Update: {
          id?: number
          max_empleados?: number | null
          min_empleados?: number | null
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_cents: number
          course_id: string | null
          created_at: string | null
          currency: string
          payment_method_id: string
          processed_at: string | null
          processor_response: Json | null
          processor_transaction_id: string | null
          transaction_id: string
          transaction_status: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          course_id?: string | null
          created_at?: string | null
          currency?: string
          payment_method_id: string
          processed_at?: string | null
          processor_response?: Json | null
          processor_transaction_id?: string | null
          transaction_id?: string
          transaction_status?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          course_id?: string | null
          created_at?: string | null
          currency?: string
          payment_method_id?: string
          processed_at?: string | null
          processor_response?: Json | null
          processor_transaction_id?: string | null
          transaction_id?: string
          transaction_status?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["payment_method_id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          action_description: string | null
          action_timestamp: string | null
          action_type: string
          course_id: string | null
          ip_address: unknown
          lesson_id: string | null
          log_id: string
          organization_id: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_description?: string | null
          action_timestamp?: string | null
          action_type: string
          course_id?: string | null
          ip_address?: unknown
          lesson_id?: string | null
          log_id?: string
          organization_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_description?: string | null
          action_timestamp?: string | null
          action_type?: string
          course_id?: string | null
          ip_address?: unknown
          lesson_id?: string | null
          log_id?: string
          organization_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_log_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_activity_log_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_activity_log_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_activity_log_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_calendar_events: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          end_time: string
          google_event_id: string | null
          id: string
          is_all_day: boolean | null
          location: string | null
          microsoft_event_id: string | null
          provider: string | null
          source: string | null
          start_time: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          google_event_id?: string | null
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          microsoft_event_id?: string | null
          provider?: string | null
          source?: string | null
          start_time: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          google_event_id?: string | null
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          microsoft_event_id?: string | null
          provider?: string | null
          source?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_course_certificates: {
        Row: {
          branding_snapshot: Json | null
          certificate_hash: string | null
          certificate_id: string
          certificate_url: string
          course_id: string
          created_at: string
          document_snapshot: Json | null
          enrollment_id: string
          expires_at: string | null
          issued_at: string
          organization_id: string | null
          template_id: string | null
          user_id: string
        }
        Insert: {
          branding_snapshot?: Json | null
          certificate_hash?: string | null
          certificate_id?: string
          certificate_url: string
          course_id: string
          created_at?: string
          document_snapshot?: Json | null
          enrollment_id: string
          expires_at?: string | null
          issued_at?: string
          organization_id?: string | null
          template_id?: string | null
          user_id: string
        }
        Update: {
          branding_snapshot?: Json | null
          certificate_hash?: string | null
          certificate_id?: string
          certificate_url?: string
          course_id?: string
          created_at?: string
          document_snapshot?: Json | null
          enrollment_id?: string
          expires_at?: string | null
          issued_at?: string
          organization_id?: string | null
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_course_certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "user_course_certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_course_certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_course_certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_course_certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_course_certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_learning_path_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          learning_path_id: string
          organization_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          learning_path_id: string
          organization_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          learning_path_id?: string
          organization_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_path_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_learning_path_assignments_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_learning_path_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_learning_path_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_path_progress: {
        Row: {
          completed_at: string | null
          completed_items_count: number
          created_at: string
          current_course_id: string | null
          id: string
          last_unlocked_at: string | null
          learning_path_id: string
          lp_intro_watched_at: string | null
          next_course_id: string | null
          organization_id: string | null
          progress_percentage: number
          status: string
          total_items_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_items_count?: number
          created_at?: string
          current_course_id?: string | null
          id?: string
          last_unlocked_at?: string | null
          learning_path_id: string
          lp_intro_watched_at?: string | null
          next_course_id?: string | null
          organization_id?: string | null
          progress_percentage?: number
          status?: string
          total_items_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_items_count?: number
          created_at?: string
          current_course_id?: string | null
          id?: string
          last_unlocked_at?: string | null
          learning_path_id?: string
          lp_intro_watched_at?: string | null
          next_course_id?: string | null
          organization_id?: string | null
          progress_percentage?: number
          status?: string
          total_items_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_path_progress_current_course_id_fkey"
            columns: ["current_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_learning_path_progress_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_learning_path_progress_next_course_id_fkey"
            columns: ["next_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_learning_path_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_learning_path_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          course_intro_watched_at: string | null
          created_at: string | null
          enrolled_at: string | null
          enrollment_id: string
          enrollment_status: string | null
          last_accessed_at: string | null
          organization_id: string | null
          overall_progress_percentage: number | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          course_intro_watched_at?: string | null
          created_at?: string | null
          enrolled_at?: string | null
          enrollment_id?: string
          enrollment_status?: string | null
          last_accessed_at?: string | null
          organization_id?: string | null
          overall_progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          course_intro_watched_at?: string | null
          created_at?: string | null
          enrolled_at?: string | null
          enrollment_id?: string
          enrollment_status?: string | null
          last_accessed_at?: string | null
          organization_id?: string | null
          overall_progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_course_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_course_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_activity_evaluations: {
        Row: {
          created_at: string
          evaluation_id: string
          evaluator: string
          feedback_payload: Json
          model_name: string | null
          result_status: string
          rubric_snapshot: Json
          submission_id: string
        }
        Insert: {
          created_at?: string
          evaluation_id?: string
          evaluator?: string
          feedback_payload?: Json
          model_name?: string | null
          result_status: string
          rubric_snapshot?: Json
          submission_id: string
        }
        Update: {
          created_at?: string
          evaluation_id?: string
          evaluator?: string
          feedback_payload?: Json
          model_name?: string | null
          result_status?: string
          rubric_snapshot?: Json
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_evaluations_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "user_activity_submissions"
            referencedColumns: ["submission_id"]
          },
        ]
      }
      user_activity_submissions: {
        Row: {
          activity_id: string
          course_id: string
          created_at: string
          enrollment_id: string
          evidence_payload: Json | null
          last_validated_at: string | null
          lesson_id: string
          organization_id: string | null
          response_payload: Json
          response_text: string | null
          status: string
          submission_id: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          course_id: string
          created_at?: string
          enrollment_id: string
          evidence_payload?: Json | null
          last_validated_at?: string | null
          lesson_id: string
          organization_id?: string | null
          response_payload?: Json
          response_text?: string | null
          status?: string
          submission_id?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          course_id?: string
          created_at?: string
          enrollment_id?: string
          evidence_payload?: Json | null
          last_validated_at?: string | null
          lesson_id?: string
          organization_id?: string | null
          response_payload?: Json
          response_text?: string | null
          status?: string
          submission_id?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_submissions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lesson_activities"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "user_activity_submissions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_submissions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_activity_submissions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "user_activity_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_activity_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_activity_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_activity_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_activity_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_activity_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_activity_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_activity_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string
          id: string
          metadata: Json | null
          organization_id: string
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at: string
          id?: string
          metadata?: Json | null
          organization_id: string
          role?: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      module_learning_summaries: {
        Row: {
          content_html: string
          content_markdown: string
          course_id: string
          created_at: string
          error_message: string | null
          generated_at: string | null
          generation_type: string
          last_error_code: string | null
          locked_by: string | null
          locked_until: string | null
          model_name: string | null
          model_provider: string
          module_id: string
          next_retry_at: string
          organization_id: string | null
          processing_finished_at: string | null
          processing_started_at: string | null
          prompt_version: string
          retry_count: number
          source_snapshot: Json
          status: string
          summary_id: string
          title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          content_html?: string
          content_markdown?: string
          course_id: string
          created_at?: string
          error_message?: string | null
          generated_at?: string | null
          generation_type?: string
          last_error_code?: string | null
          locked_by?: string | null
          locked_until?: string | null
          model_name?: string | null
          model_provider?: string
          module_id: string
          next_retry_at?: string
          organization_id?: string | null
          processing_finished_at?: string | null
          processing_started_at?: string | null
          prompt_version?: string
          retry_count?: number
          source_snapshot?: Json
          status?: string
          summary_id?: string
          title: string
          updated_at?: string
          user_id: string
          version: number
        }
        Update: {
          content_html?: string
          content_markdown?: string
          course_id?: string
          created_at?: string
          error_message?: string | null
          generated_at?: string | null
          generation_type?: string
          last_error_code?: string | null
          locked_by?: string | null
          locked_until?: string | null
          model_name?: string | null
          model_provider?: string
          module_id?: string
          next_retry_at?: string
          organization_id?: string | null
          processing_finished_at?: string | null
          processing_started_at?: string | null
          prompt_version?: string
          retry_count?: number
          source_snapshot?: Json
          status?: string
          summary_id?: string
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "module_learning_summaries_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_learning_summaries_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "module_learning_summaries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_learning_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_notes: {
        Row: {
          course_id: string | null
          created_at: string | null
          enrollment_id: string | null
          is_auto_generated: boolean | null
          is_user_edited: boolean
          lesson_id: string | null
          note_content: string
          note_id: string
          note_tags: Json | null
          note_title: string
          organization_id: string | null
          source_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          enrollment_id?: string | null
          is_auto_generated?: boolean | null
          is_user_edited?: boolean
          lesson_id?: string | null
          note_content: string
          note_id?: string
          note_tags?: Json | null
          note_title: string
          organization_id?: string | null
          source_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          enrollment_id?: string | null
          is_auto_generated?: boolean | null
          is_user_edited?: boolean
          lesson_id?: string | null
          note_content?: string
          note_id?: string
          note_tags?: Json | null
          note_title?: string
          organization_id?: string | null
          source_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_notes_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "user_lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_lesson_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_lesson_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_lesson_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_lesson_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_lesson_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          activity_progress_percentage: number
          completed_at: string | null
          created_at: string | null
          current_time_seconds: number | null
          enrollment_id: string
          is_completed: boolean | null
          last_activity_submission_at: string | null
          last_accessed_at: string | null
          lesson_id: string
          lesson_status: string | null
          organization_id: string | null
          progress_id: string
          quiz_completed: boolean | null
          quiz_passed: boolean | null
          quiz_progress_percentage: number | null
          required_activities_completed: number
          required_activities_total: number
          started_at: string | null
          time_spent_minutes: number | null
          updated_at: string | null
          user_id: string
          video_progress_percentage: number | null
        }
        Insert: {
          activity_progress_percentage?: number
          completed_at?: string | null
          created_at?: string | null
          current_time_seconds?: number | null
          enrollment_id: string
          is_completed?: boolean | null
          last_activity_submission_at?: string | null
          last_accessed_at?: string | null
          lesson_id: string
          lesson_status?: string | null
          organization_id?: string | null
          progress_id?: string
          quiz_completed?: boolean | null
          quiz_passed?: boolean | null
          quiz_progress_percentage?: number | null
          required_activities_completed?: number
          required_activities_total?: number
          started_at?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
          user_id: string
          video_progress_percentage?: number | null
        }
        Update: {
          activity_progress_percentage?: number
          completed_at?: string | null
          created_at?: string | null
          current_time_seconds?: number | null
          enrollment_id?: string
          is_completed?: boolean | null
          last_activity_submission_at?: string | null
          last_accessed_at?: string | null
          lesson_id?: string
          lesson_status?: string | null
          organization_id?: string | null
          progress_id?: string
          quiz_completed?: boolean | null
          quiz_passed?: boolean | null
          quiz_progress_percentage?: number | null
          required_activities_completed?: number
          required_activities_total?: number
          started_at?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          video_progress_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_reading_audio_progress: {
        Row: {
          completed: boolean
          content_hash: string
          created_at: string
          id: string
          language: string
          lesson_id: string
          organization_id: string | null
          segment_index: number
          segment_time_seconds: number
          source_id: string
          source_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          content_hash: string
          created_at?: string
          id?: string
          language?: string
          lesson_id: string
          organization_id?: string | null
          segment_index?: number
          segment_time_seconds?: number
          source_id: string
          source_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          content_hash?: string
          created_at?: string
          id?: string
          language?: string
          lesson_id?: string
          organization_id?: string | null
          segment_index?: number
          segment_time_seconds?: number
          source_id?: string
          source_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_audio_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_reading_audio_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reading_audio_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          created_at: string | null
          do_not_disturb_days: Json | null
          do_not_disturb_end: string | null
          do_not_disturb_start: string | null
          email_enabled: boolean | null
          email_frequency: string | null
          in_app_enabled: boolean | null
          notification_type: string
          preference_id: string
          push_enabled: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          whatsapp_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          do_not_disturb_days?: Json | null
          do_not_disturb_end?: string | null
          do_not_disturb_start?: string | null
          email_enabled?: boolean | null
          email_frequency?: string | null
          in_app_enabled?: boolean | null
          notification_type: string
          preference_id?: string
          push_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          do_not_disturb_days?: Json | null
          do_not_disturb_end?: string | null
          do_not_disturb_start?: string | null
          email_enabled?: boolean | null
          email_frequency?: string | null
          in_app_enabled?: boolean | null
          notification_type?: string
          preference_id?: string
          push_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          channels_pending: Json | null
          channels_sent: Json | null
          created_at: string | null
          dedup_key: string | null
          expires_at: string | null
          group_id: string | null
          message: string
          metadata: Json | null
          notification_id: string
          notification_type: string
          organization_id: string | null
          priority: string | null
          read_at: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channels_pending?: Json | null
          channels_sent?: Json | null
          created_at?: string | null
          dedup_key?: string | null
          expires_at?: string | null
          group_id?: string | null
          message: string
          metadata?: Json | null
          notification_id?: string
          notification_type: string
          organization_id?: string | null
          priority?: string | null
          read_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channels_pending?: Json | null
          channels_sent?: Json | null
          created_at?: string | null
          dedup_key?: string | null
          expires_at?: string | null
          group_id?: string | null
          message?: string
          metadata?: Json | null
          notification_id?: string
          notification_type?: string
          organization_id?: string | null
          priority?: string | null
          read_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_perfil: {
        Row: {
          actualizado_en: string
          area_id: number | null
          cargo_titulo: string | null
          creado_en: string
          dificultad_id: number | null
          id: string
          nivel_id: number | null
          pais: string | null
          relacion_id: number | null
          rol_id: number | null
          sector_id: number | null
          tamano_id: number | null
          user_id: string
          uso_ia_respuesta: string | null
        }
        Insert: {
          actualizado_en?: string
          area_id?: number | null
          cargo_titulo?: string | null
          creado_en?: string
          dificultad_id?: number | null
          id?: string
          nivel_id?: number | null
          pais?: string | null
          relacion_id?: number | null
          rol_id?: number | null
          sector_id?: number | null
          tamano_id?: number | null
          user_id: string
          uso_ia_respuesta?: string | null
        }
        Update: {
          actualizado_en?: string
          area_id?: number | null
          cargo_titulo?: string | null
          creado_en?: string
          dificultad_id?: number | null
          id?: string
          nivel_id?: number | null
          pais?: string | null
          relacion_id?: number | null
          rol_id?: number | null
          sector_id?: number | null
          tamano_id?: number | null
          user_id?: string
          uso_ia_respuesta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_perfil_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_perfil_nivel_id_fkey"
            columns: ["nivel_id"]
            isOneToOne: false
            referencedRelation: "niveles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_perfil_relacion_id_fkey"
            columns: ["relacion_id"]
            isOneToOne: false
            referencedRelation: "relaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_perfil_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_perfil_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_perfil_tamano_id_fkey"
            columns: ["tamano_id"]
            isOneToOne: false
            referencedRelation: "tamanos_empresa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_perfil_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_perfil_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_perfil_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_perfil_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_quiz_submissions: {
        Row: {
          activity_id: string | null
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          enrollment_id: string
          is_passed: boolean | null
          lesson_id: string
          material_id: string | null
          organization_id: string | null
          percentage_score: number | null
          score: number | null
          submission_id: string
          total_points: number | null
          updated_at: string | null
          user_answers: Json
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          enrollment_id: string
          is_passed?: boolean | null
          lesson_id: string
          material_id?: string | null
          organization_id?: string | null
          percentage_score?: number | null
          score?: number | null
          submission_id?: string
          total_points?: number | null
          updated_at?: string | null
          user_answers?: Json
          user_id: string
        }
        Update: {
          activity_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          enrollment_id?: string
          is_passed?: boolean | null
          lesson_id?: string
          material_id?: string | null
          organization_id?: string | null
          percentage_score?: number | null
          score?: number | null
          submission_id?: string
          total_points?: number | null
          updated_at?: string | null
          user_answers?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_submissions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lesson_activities"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "lesson_materials"
            referencedColumns: ["material_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_session: {
        Row: {
          expires_at: string
          id: string
          ip: unknown
          issued_at: string
          jwt_id: string | null
          revoked: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          expires_at: string
          id?: string
          ip?: unknown
          issued_at?: string
          jwt_id?: string | null
          revoked?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string
          id?: string
          ip?: unknown
          issued_at?: string
          jwt_id?: string | null
          revoked?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_session_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_session_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_session_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_session_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_session_date: string | null
          longest_streak: number | null
          month_start_date: string | null
          monthly_sessions_completed: number | null
          monthly_study_minutes: number | null
          organization_id: string | null
          total_sessions_completed: number | null
          total_sessions_missed: number | null
          total_sessions_rescheduled: number | null
          total_study_minutes: number | null
          updated_at: string | null
          user_id: string
          week_start_date: string | null
          weekly_sessions_completed: number | null
          weekly_study_minutes: number | null
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_session_date?: string | null
          longest_streak?: number | null
          month_start_date?: string | null
          monthly_sessions_completed?: number | null
          monthly_study_minutes?: number | null
          organization_id?: string | null
          total_sessions_completed?: number | null
          total_sessions_missed?: number | null
          total_sessions_rescheduled?: number | null
          total_study_minutes?: number | null
          updated_at?: string | null
          user_id: string
          week_start_date?: string | null
          weekly_sessions_completed?: number | null
          weekly_study_minutes?: number | null
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_session_date?: string | null
          longest_streak?: number | null
          month_start_date?: string | null
          monthly_sessions_completed?: number | null
          monthly_study_minutes?: number | null
          organization_id?: string | null
          total_sessions_completed?: number | null
          total_sessions_missed?: number | null
          total_sessions_rescheduled?: number | null
          total_study_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          week_start_date?: string | null
          weekly_sessions_completed?: number | null
          weekly_study_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_streaks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_streaks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_tour_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          skipped_at: string | null
          step_reached: number | null
          tour_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          skipped_at?: string | null
          step_reached?: number | null
          tour_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          skipped_at?: string | null
          step_reached?: number | null
          tour_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tour_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_tour_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tour_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_tour_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_warnings: {
        Row: {
          blocked_content: string | null
          content_id: string | null
          content_type: string
          created_at: string
          reason: string
          user_id: string
          warning_id: string
        }
        Insert: {
          blocked_content?: string | null
          content_id?: string | null
          content_type: string
          created_at?: string
          reason: string
          user_id: string
          warning_id?: string
        }
        Update: {
          blocked_content?: string | null
          content_id?: string | null
          content_type?: string
          created_at?: string
          reason?: string
          user_id?: string
          warning_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          ban_reason: string | null
          banned_at: string | null
          bio: string | null
          platform_role: string | null
          country_code: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          email: string | null
          email_verified: boolean
          email_verified_at: string | null
          first_name: string | null
          gender: string | null
          id: string
          is_banned: boolean
          last_activity_at: string | null
          last_login_at: string | null
          last_name: string | null
          location: string | null
          notification_community_updates: boolean | null
          notification_course_updates: boolean | null
          notification_email: boolean | null
          notification_marketing: boolean | null
          notification_push: boolean | null
          oauth_provider: string | null
          oauth_provider_id: string | null
          password_hash: string | null
          phone: string | null
          profile_picture_url: string | null
          signature_name: string | null
          signature_url: string | null
          type_rol: string | null
          updated_at: string
          username: string
        }
        Insert: {
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          platform_role?: string | null
          country_code?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean
          email_verified_at?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          is_banned?: boolean
          last_activity_at?: string | null
          last_login_at?: string | null
          last_name?: string | null
          location?: string | null
          notification_community_updates?: boolean | null
          notification_course_updates?: boolean | null
          notification_email?: boolean | null
          notification_marketing?: boolean | null
          notification_push?: boolean | null
          oauth_provider?: string | null
          oauth_provider_id?: string | null
          password_hash?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          signature_name?: string | null
          signature_url?: string | null
          type_rol?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          platform_role?: string | null
          country_code?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean
          email_verified_at?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          is_banned?: boolean
          last_activity_at?: string | null
          last_login_at?: string | null
          last_name?: string | null
          location?: string | null
          notification_community_updates?: boolean | null
          notification_course_updates?: boolean | null
          notification_email?: boolean | null
          notification_marketing?: boolean | null
          notification_push?: boolean | null
          oauth_provider?: string | null
          oauth_provider_id?: string | null
          password_hash?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          signature_name?: string | null
          signature_url?: string | null
          type_rol?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          icon_type: string | null
          icon_url: string | null
          is_active: boolean | null
          level: string | null
          name: string
          skill_id: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          icon_type?: string | null
          icon_url?: string | null
          is_active?: boolean | null
          level?: string | null
          name: string
          skill_id?: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          icon_type?: string | null
          icon_url?: string | null
          is_active?: boolean | null
          level?: string | null
          name?: string
          skill_id?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      course_skills: {
        Row: {
          course_id: string
          created_at: string | null
          display_order: number | null
          id: string
          is_primary: boolean | null
          is_required: boolean | null
          proficiency_level: string | null
          skill_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          is_required?: boolean | null
          proficiency_level?: string | null
          skill_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          is_required?: boolean | null
          proficiency_level?: string | null
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      skill_badges: {
        Row: {
          badge_url: string
          created_at: string | null
          id: string
          level: string
          skill_id: string
        }
        Insert: {
          badge_url: string
          created_at?: string | null
          id?: string
          level: string
          skill_id: string
        }
        Update: {
          badge_url?: string
          created_at?: string | null
          id?: string
          level?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_badges_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      user_skills: {
        // Shape derived from runtime usage — this table has no versioned DDL.
        // Regenerate with `npm run gen:types` once the Supabase CLI is linked.
        Row: {
          course_id: string | null
          created_at: string | null
          display_order: number | null
          enrollment_id: string | null
          id: string
          is_displayed: boolean | null
          obtained_at: string | null
          proficiency_level: string | null
          skill_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          display_order?: number | null
          enrollment_id?: string | null
          id?: string
          is_displayed?: boolean | null
          obtained_at?: string | null
          proficiency_level?: string | null
          skill_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          display_order?: number | null
          enrollment_id?: string | null
          id?: string
          is_displayed?: boolean | null
          obtained_at?: string | null
          proficiency_level?: string | null
          skill_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      work_team_course_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          course_id: string
          created_at: string
          due_date: string | null
          id: string
          message: string | null
          status: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          course_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          message?: string | null
          status?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          course_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          message?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_team_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_course_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "work_teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      work_team_feedback: {
        Row: {
          content: string
          course_id: string | null
          created_at: string
          feedback_id: string
          feedback_type: string
          from_user_id: string
          is_anonymous: boolean | null
          rating: number | null
          team_id: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string
          feedback_id?: string
          feedback_type: string
          from_user_id: string
          is_anonymous?: boolean | null
          rating?: number | null
          team_id: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string
          feedback_id?: string
          feedback_type?: string
          from_user_id?: string
          is_anonymous?: boolean | null
          rating?: number | null
          team_id?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_team_feedback_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_feedback_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_feedback_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_feedback_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_feedback_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_feedback_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_feedback_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "work_teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "work_team_feedback_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_feedback_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_feedback_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_feedback_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      work_team_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          role: string | null
          status: string | null
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          role?: string | null
          status?: string | null
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          role?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "work_teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "work_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      work_team_messages: {
        Row: {
          content: string
          course_id: string | null
          created_at: string
          is_pinned: boolean | null
          message_id: string
          message_type: string | null
          reply_to_message_id: string | null
          sender_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string
          is_pinned?: boolean | null
          message_id?: string
          message_type?: string | null
          reply_to_message_id?: string | null
          sender_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string
          is_pinned?: boolean | null
          message_id?: string
          message_type?: string | null
          reply_to_message_id?: string | null
          sender_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_team_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_messages_reply_to_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "work_team_messages"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "work_team_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "work_teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      work_team_objectives: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string
          current_value: number | null
          deadline: string | null
          description: string | null
          metric_type: string
          objective_id: string
          status: string | null
          target_value: number
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by: string
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          metric_type: string
          objective_id?: string
          status?: string | null
          target_value: number
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          metric_type?: string
          objective_id?: string
          status?: string | null
          target_value?: number
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_team_objectives_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_objectives_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_objectives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_objectives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_objectives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_objectives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_objectives_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "work_teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      work_team_statistics: {
        Row: {
          active_members: number | null
          average_completion_percentage: number | null
          average_score: number | null
          calculated_at: string
          course_id: string | null
          metadata: Json | null
          stat_date: string
          stat_id: string
          team_id: string
          total_feedback_given: number | null
          total_interactions: number | null
          total_members: number | null
          total_messages: number | null
        }
        Insert: {
          active_members?: number | null
          average_completion_percentage?: number | null
          average_score?: number | null
          calculated_at?: string
          course_id?: string | null
          metadata?: Json | null
          stat_date: string
          stat_id?: string
          team_id: string
          total_feedback_given?: number | null
          total_interactions?: number | null
          total_members?: number | null
          total_messages?: number | null
        }
        Update: {
          active_members?: number | null
          average_completion_percentage?: number | null
          average_score?: number | null
          calculated_at?: string
          course_id?: string | null
          metadata?: Json | null
          stat_date?: string
          stat_id?: string
          team_id?: string
          total_feedback_given?: number | null
          total_interactions?: number | null
          total_members?: number | null
          total_messages?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_team_statistics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_statistics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_statistics_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "work_teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      work_teams: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string
          description: string | null
          image_url: string | null
          metadata: Json | null
          name: string
          organization_id: string
          slug: string
          status: string | null
          team_id: string
          team_leader_id: string | null
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          image_url?: string | null
          metadata?: Json | null
          name: string
          organization_id: string
          slug: string
          status?: string | null
          team_id?: string
          team_leader_id?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          image_url?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          slug?: string
          status?: string | null
          team_id?: string
          team_leader_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_teams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_teams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "work_teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "work_teams_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_teams_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_teams_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_teams_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      ai_moderation_pending_review: {
        Row: {
          categories: Json | null
          confidence_score: number | null
          content_id: string | null
          content_preview: string | null
          content_type: string | null
          created_at: string | null
          email: string | null
          is_flagged: boolean | null
          log_id: string | null
          reasoning: string | null
          user_id: string | null
          user_warning_count: number | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lia_activity_performance: {
        Row: {
          activity_id: string | null
          activity_title: string | null
          activity_type: string | null
          avg_attempts: number | null
          avg_time_seconds: number | null
          completed_count: number | null
          completion_rate_percentage: number | null
          course_id: string | null
          course_title: string | null
          help_needed_count: number | null
          total_attempts: number | null
          unique_users: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lia_activity_completions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lesson_activities"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "lia_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
        ]
      }
      lia_conversation_analytics: {
        Row: {
          avg_response_time_ms: number | null
          context_type: string | null
          conversation_completed: boolean | null
          conversation_id: string | null
          course_id: string | null
          course_title: string | null
          duration_seconds: number | null
          ended_at: string | null
          lesson_id: string | null
          lesson_title: string | null
          module_id: string | null
          module_title: string | null
          primary_model: string | null
          started_at: string | null
          total_cost_usd: number | null
          total_lia_messages: number | null
          total_messages: number | null
          total_tokens: number | null
          total_user_messages: number | null
          user_abandoned: boolean | null
          user_avatar: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lia_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "lia_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_conversations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lia_course_analytics: {
        Row: {
          avg_duration_seconds: number | null
          course_id: string | null
          course_title: string | null
          lesson_id: string | null
          lesson_title: string | null
          module_id: string | null
          module_title: string | null
          total_conversations: number | null
          total_cost_usd: number | null
          total_messages: number | null
          total_tokens_consumed: number | null
          unique_users: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lia_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "lia_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_conversations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["module_id"]
          },
        ]
      }
      moderation_stats: {
        Row: {
          ban_reason: string | null
          banned_at: string | null
          email: string | null
          is_banned: boolean | null
          last_warning_date: string | null
          total_warnings: number | null
          user_id: string | null
          username: string | null
          warning_reasons: string[] | null
        }
        Relationships: []
      }
      reportes_con_usuario: {
        Row: {
          admin_asignado: string | null
          admin_nombre: string | null
          categoria: string | null
          comportamiento_esperado: string | null
          created_at: string | null
          descripcion: string | null
          display_name: string | null
          email: string | null
          estado: string | null
          id: string | null
          metadata: Json | null
          navegador: string | null
          notas_admin: string | null
          pagina_url: string | null
          pasos_reproducir: string | null
          pathname: string | null
          prioridad: string | null
          resuelto_at: string | null
          screen_resolution: string | null
          screenshot_url: string | null
          titulo: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
          user_role: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      study_plan_progress: {
        Row: {
          avg_self_evaluation: number | null
          completion_percentage: number | null
          first_session_date: string | null
          last_completed_date: string | null
          last_session_date: string | null
          plan_created_at: string | null
          plan_id: string | null
          plan_name: string | null
          sessions_completed: number | null
          sessions_missed: number | null
          sessions_pending: number | null
          sessions_rescheduled: number | null
          total_planned_minutes: number | null
          total_sessions: number | null
          total_studied_minutes: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_calendar_subscriptions: {
        Row: {
          active_sessions_count: number | null
          created_at: string | null
          has_calendar_integrations: boolean | null
          last_used_at: string | null
          token: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          active_sessions_count?: never
          created_at?: string | null
          has_calendar_integrations?: never
          last_used_at?: string | null
          token?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          active_sessions_count?: never
          created_at?: string | null
          has_calendar_integrations?: never
          last_used_at?: string | null
          token?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_unread_notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          message: string | null
          notification_id: string | null
          notification_type: string | null
          priority: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          message?: string | null
          notification_id?: string | null
          notification_type?: string | null
          priority?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          message?: string | null
          notification_id?: string | null
          notification_type?: string | null
          priority?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_unread_notifications_count: {
        Row: {
          critical_count: number | null
          high_count: number | null
          unread_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_ai_generated_plans: {
        Row: {
          ai_generation_metadata: Json | null
          completed_sessions: number | null
          completion_percentage: number | null
          created_at: string | null
          plan_id: string | null
          plan_name: string | null
          preferred_session_type: string | null
          total_sessions: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_incomplete_lesson_times: {
        Row: {
          activities_missing_time: number | null
          course_id: string | null
          course_title: string | null
          current_total_time: number | null
          lesson_id: string | null
          lesson_order_index: number | null
          lesson_title: string | null
          materials_missing_time: number | null
          total_incomplete_items: number | null
        }
        Relationships: []
      }
      v_lessons_by_session_type_compatibility: {
        Row: {
          compatible_session_types: string[] | null
          course_title: string | null
          lesson_id: string | null
          lesson_title: string | null
          total_time_minutes: number | null
        }
        Relationships: []
      }
      v_organization_stats: {
        Row: {
          avg_completion_rate: number | null
          completed_assignments: number | null
          current_users: number | null
          max_users: number | null
          organization_id: string | null
          organization_name: string | null
          subscription_alert: string | null
          subscription_end_date: string | null
          subscription_plan: string | null
          subscription_status: string | null
          total_assignments: number | null
        }
        Relationships: []
      }
      v_organization_users_detailed: {
        Row: {
          display_name: string | null
          email: string | null
          joined_at: string | null
          org_role: string | null
          org_status: string | null
          organization_id: string | null
          organization_name: string | null
          user_created_at: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      v_session_type_distribution: {
        Row: {
          avg_duration_minutes: number | null
          completion_rate: number | null
          session_count: number | null
          session_type: string | null
          unique_users: number | null
        }
        Relationships: []
      }
      v_user_security_summary: {
        Row: {
          active_tokens_count: number | null
          email: string | null
          email_verified: boolean | null
          first_login_date: string | null
          last_login_date: string | null
          last_token_usage: string | null
          unique_devices_count: number | null
          unique_ips_count: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      // ---------------------------------------------------------------
      // Funciones RPC anadidas a mano para cerrar el desfase con la base real.
      // Firmas tomadas directamente del SQL de sus migraciones (indicadas en
      // cada bloque). `npm run gen:types` las regenerara; el formato replica el
      // del generador para minimizar ese diff. Solo se incluyen las funciones
      // con definicion SQL verificable; el resto requiere regeneracion.
      // ---------------------------------------------------------------
      // migracion 20260721130000_rename_cargo_rol_to_platform_role.sql
      get_admin_user_stats_learning: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      // migracion 20260721130000_rename_cargo_rol_to_platform_role.sql
      get_admin_user_stats_overview: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      // migracion 20260701150000_system_status_checks.sql
      get_public_system_status: {
        Args: { p_days?: number }
        Returns: {
          component_key: string
          worst_status: string
          checks_total: number
          checks_failed: number
        }[]
      }
      // migracion 20260701150000_system_status_checks.sql
      get_public_system_status_current: {
        Args: Record<PropertyKey, never>
        Returns: {
          component_key: string
          status: string
          checked_at: string
        }[]
      }
      approve_community_creation_request: {
        Args: { request_id: string; reviewer_id: string }
        Returns: string
      }
      archive_notification: {
        Args: { p_notification_id: string; p_user_id?: string }
        Returns: Json
      }
      calculate_course_complexity: {
        Args: { p_category: string; p_level: string }
        Returns: number
      }
      calculate_course_duration: {
        Args: { p_course_id: string }
        Returns: undefined
      }
      calculate_lesson_total_time: {
        Args: { p_lesson_id: string }
        Returns: number
      }
      calculate_module_duration: {
        Args: { p_module_id: string }
        Returns: undefined
      }
      calculate_reel_comment_count: {
        Args: { reel_uuid: string }
        Returns: number
      }
      can_assign_courses: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: boolean
      }
      can_organization_purchase_course: {
        Args: { p_max_courses_per_month?: number; p_organization_id: string }
        Returns: boolean
      }
      certificate_hash_immutable: {
        Args: {
          p_certificate_id: string
          p_certificate_url: string
          p_course_id: string
          p_enrollment_id: string
          p_issued_at: string
          p_user_id: string
        }
        Returns: string
      }
      claim_legacy_course_progress: {
        Args: {
          p_claimed_by?: string
          p_course_id: string
          p_target_organization_id: string
          p_user_id: string
        }
        Returns: Json
      }
      consolidate_user_course_learning_scope: {
        Args: {
          p_course_id?: string | null
          p_delete_source_enrollments?: boolean
          p_migrated_by?: string | null
          p_target_organization_id: string
          p_user_id: string
        }
        Returns: Json
      }
      consolidate_user_course_learning_scope_by_slug: {
        Args: {
          p_course_slug?: string | null
          p_delete_source_enrollments?: boolean
          p_migrated_by?: string | null
          p_target_organization_slug: string
          p_user_email: string
        }
        Returns: Json
      }
      check_b2b_deadlines: {
        Args: { p_user_id: string; p_weekly_study_minutes: number }
        Returns: {
          can_complete: boolean
          course_id: string
          course_title: string
          due_date: string
          remaining_minutes: number
          weeks_needed: number
        }[]
      }
      check_user_is_org_admin: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: boolean
      }
      check_user_org_membership: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: boolean
      }
      clean_expired_refresh_tokens: { Args: never; Returns: undefined }
      cleanup_expired_invitations: { Args: never; Returns: undefined }
      cleanup_expired_refresh_tokens: { Args: never; Returns: undefined }
      cleanup_old_community_data: { Args: never; Returns: undefined }
      close_conversation: {
        Args: { p_completed?: boolean; p_conversation_id: string }
        Returns: undefined
      }
      contains_forbidden_content: { Args: { p_text: string }; Returns: Json }
      count_active_users: {
        Args: { p_organization_id: string }
        Returns: number
      }
      decrement_comment_count: { Args: { post_id: string }; Returns: undefined }
      delete_notification: {
        Args: { p_notification_id: string; p_user_id?: string }
        Returns: Json
      }
      delete_user_cascade: { Args: { target_user_id: string }; Returns: Json }
      detect_suspicious_token_activity: {
        Args: never
        Returns: {
          active_tokens_count: number
          different_devices_count: number
          different_ips_count: number
          user_id: string
        }[]
      }
      expire_certificate: { Args: { p_cert_id: string }; Returns: undefined }
      extract_team_id_from_path: { Args: { p_path: string }; Returns: string }
      generate_team_slug: {
        Args: { p_team_id: string; p_team_name: string }
        Returns: string
      }
      get_ai_moderation_stats: { Args: { p_days?: number }; Returns: Json }
      get_comments_with_user_data: {
        Args: { p_limit?: number; p_offset?: number; p_post_id: string }
        Returns: {
          comment_id: string
          content: string
          created_at: string
          parent_comment_id: string
          post_id: string
          reply_count: number
          updated_at: string
          user_display_name: string
          user_id: string
          user_profile_picture_url: string
          user_username: string
        }[]
      }
      get_dashboard_stats: { Args: { p_user_id: string }; Returns: Json }
      get_entity_translations: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_language_code: string
        }
        Returns: Json
      }
      get_or_create_subscription_token: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_organization_monthly_course_count: {
        Args: { p_month?: number; p_organization_id: string; p_year?: number }
        Returns: number
      }
      get_posts_with_stats: {
        Args: { p_community_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          attachment_data: Json
          attachment_type: string
          attachment_url: string
          comments_count: number
          community_id: string
          content: string
          created_at: string
          is_edited: boolean
          is_pinned: boolean
          post_id: string
          reaction_count: number
          reaction_stats: Json
          title: string
          updated_at: string
          user_display_name: string
          user_id: string
          user_profile_picture_url: string
          user_username: string
        }[]
      }
      get_reactions_summary: {
        Args: { p_post_id: string }
        Returns: {
          count: number
          reaction_type: string
          users: Json
        }[]
      }
      get_reels_with_stats: {
        Args: {
          p_category?: string
          p_language?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          category: string
          comment_count: number
          created_at: string
          created_by: string
          creator_first_name: string
          creator_last_name: string
          creator_profile_picture_url: string
          creator_username: string
          description: string
          duration_seconds: number
          hashtags: string[]
          id: string
          is_featured: boolean
          language: string
          like_count: number
          published_at: string
          share_count: number
          thumbnail_url: string
          title: string
          video_url: string
          view_count: number
        }[]
      }
      get_reportes_stats: {
        Args: never
        Returns: {
          en_progreso: number
          en_revision: number
          pendientes: number
          por_categoria: Json
          resueltos: number
          tiempo_promedio_resolucion: unknown
          total_reportes: number
        }[]
      }
      get_session_type_duration_range: {
        Args: { p_session_type: string }
        Returns: {
          max_duration_minutes: number
          min_duration_minutes: number
          session_type: string
        }[]
      }
      get_translation: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_fallback_value: string
          p_field_name: string
          p_language_code: string
        }
        Returns: string
      }
      get_user_primary_org: { Args: { p_user_id: string }; Returns: string }
      get_user_primary_organization: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_user_skill_level: {
        Args: { p_skill_id: string; p_user_id: string }
        Returns: {
          course_count: number
          level: string
          next_level_courses_needed: number
        }[]
      }
      get_user_skill_levels: {
        Args: { p_skill_ids: string[]; p_user_id: string }
        Returns: {
          course_count: number
          level: string | null
          next_level_courses_needed: number
          skill_id: string
        }[]
      }
      get_course_notes_stats: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: {
          last_update: string | null
          lessons_with_notes: number
          total_lessons: number
          total_notes: number
        }[]
      }
      get_course_notes_stats_v2: {
        Args: {
          p_course_id: string
          p_enrollment_id: string | null
          p_user_id: string
        }
        Returns: {
          last_update: string | null
          lessons_with_notes: number
          total_lessons: number
          total_notes: number
        }[]
      }
      get_unread_notification_counts: {
        Args: { p_user_id: string }
        Returns: {
          critical: number
          high: number
          total: number
        }[]
      }
      get_unread_notifications_count: {
        Args: { p_user_id: string }
        Returns: {
          critical: number
          high: number
          total: number
        }[]
      }
      get_user_skills: {
        Args: { p_user_id: string }
        Returns: {
          color: string
          course_count: number
          courses: Json
          icon_name: string
          icon_type: string
          icon_url: string
          obtained_at: string
          proficiency_level: string
          skill_category: string
          skill_description: string
          skill_id: string
          skill_name: string
          skill_slug: string
        }[]
      }
      get_user_warning_history: {
        Args: { p_user_id: string }
        Returns: {
          content_type: string
          created_at: string
          reason: string
          warning_id: string
          warning_number: number
        }[]
      }
      get_user_warnings_count: { Args: { p_user_id: string }; Returns: number }
      is_active_team_member: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_leader_or_coleader: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_user_banned: { Args: { p_user_id: string }; Returns: boolean }
      ledger_block_hash_immutable: {
        Args: {
          p_cert_id: string
          p_created_at: string
          p_op: string
          p_payload: Json
          p_prev_hash: string
        }
        Returns: string
      }
      log_lia_message: {
        Args: {
          p_content: string
          p_conversation_id: string
          p_cost_usd?: number
          p_is_system_message?: boolean
          p_model_used?: string
          p_response_time_ms?: number
          p_role: string
          p_tokens_used?: number
        }
        Returns: string
      }
      mark_all_notifications_read: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      mark_notification_read: {
        Args: { p_notification_id: string; p_user_id?: string }
        Returns: Json
      }
      refresh_community_materialized_views: { Args: never; Returns: undefined }
      regenerate_subscription_token: {
        Args: { p_user_id: string }
        Returns: string
      }
      register_ai_moderation_analysis: {
        Args: {
          p_api_response: Json
          p_categories: Json
          p_confidence_score: number
          p_content_id: string
          p_content_text: string
          p_content_type: string
          p_is_flagged: boolean
          p_model_used: string
          p_processing_time_ms: number
          p_reasoning: string
          p_user_id: string
        }
        Returns: string
      }
      register_user_warning: {
        Args: {
          p_blocked_content?: string
          p_content_id?: string
          p_content_type: string
          p_reason: string
          p_user_id: string
        }
        Returns: Json
      }
      reject_community_creation_request: {
        Args: {
          rejection_reason: string
          request_id: string
          reviewer_id: string
        }
        Returns: undefined
      }
      revoke_all_user_tokens: {
        Args: { p_reason?: string; p_user_id: string }
        Returns: number
      }
      revoke_certificate: {
        Args: { p_cert_id: string; p_reason: string }
        Returns: undefined
      }
      update_all_reel_comment_counts: { Args: never; Returns: undefined }
      update_lesson_time_estimate: {
        Args: { p_lesson_id: string }
        Returns: undefined
      }
      update_reel_comment_count: {
        Args: { reel_uuid: string }
        Returns: undefined
      }
      update_token_usage: { Args: { p_token: string }; Returns: undefined }
      validate_certificate: {
        Args: { p_hash: string }
        Returns: {
          certificate_id: string
          chain_ok: boolean
          course_title: string
          is_expired: boolean
          is_valid: boolean
          issued_at: string
          last_block_at: string
          last_op: string
          user_id: string
        }[]
      }
      validate_lesson_fits_session_type: {
        Args: { p_lesson_id: string; p_session_type: string }
        Returns: boolean
      }
      validate_session_times: {
        Args: { p_plan_id: string }
        Returns: {
          error_message: string
          is_valid: boolean
          min_lesson_time: number
          plan_min_session: number
        }[]
      }
    }
    Enums: {
      access_status: "active" | "suspended" | "expired" | "cancelled"
      discount_type: "percentage" | "fixed_amount"
      purchase_method: "direct" | "subscription" | "gift" | "promo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_status: ["active", "suspended", "expired", "cancelled"],
      discount_type: ["percentage", "fixed_amount"],
      purchase_method: ["direct", "subscription", "gift", "promo"],
    },
  },
} as const
