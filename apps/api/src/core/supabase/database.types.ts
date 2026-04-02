export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string | null
          is_active: boolean | null
          subscription_status: string | null
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          is_active?: boolean | null
          subscription_status?: string | null
        }
        Update: {
          name?: string
          slug?: string | null
          is_active?: boolean | null
          subscription_status?: string | null
        }
        Relationships: []
      }
      organization_users: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          role: string | null
          status: string | null
          joined_at: string | null
          job_title: string | null
          invited_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          role?: string | null
          status?: string | null
          joined_at?: string | null
          job_title?: string | null
          invited_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          role?: string | null
          status?: string | null
          joined_at?: string | null
          job_title?: string | null
          invited_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      organization_course_assignments: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          course_id: string
          status: string | null
          completion_percentage: number | null
          assigned_at: string | null
          due_date: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          course_id: string
          status?: string | null
          completion_percentage?: number | null
          assigned_at?: string | null
          due_date?: string | null
          completed_at?: string | null
        }
        Update: {
          status?: string | null
          completion_percentage?: number | null
          assigned_at?: string | null
          due_date?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      organization_node_users: {
        Row: {
          node_id: string
          user_id: string
          status: string | null
        }
        Insert: {
          node_id: string
          user_id: string
          status?: string | null
        }
        Update: {
          status?: string | null
        }
        Relationships: []
      }
      organization_nodes: {
        Row: {
          id: string
          organization_id: string
          name: string
          type: string | null
          properties: Json
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          type?: string | null
          properties?: Json
        }
        Update: {
          name?: string
          type?: string | null
          properties?: Json
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          title: string | null
        }
        Insert: {
          id?: string
          title?: string | null
        }
        Update: {
          title?: string | null
        }
        Relationships: []
      }
      daily_progress: {
        Row: {
          user_id: string
          progress_date: string
          had_activity: boolean | null
          streak_count: number | null
          study_minutes: number | null
          sessions_completed: number | null
          sessions_missed: number | null
        }
        Insert: {
          user_id: string
          progress_date: string
          had_activity?: boolean | null
          streak_count?: number | null
          study_minutes?: number | null
          sessions_completed?: number | null
          sessions_missed?: number | null
        }
        Update: {
          had_activity?: boolean | null
          streak_count?: number | null
          study_minutes?: number | null
          sessions_completed?: number | null
          sessions_missed?: number | null
        }
        Relationships: []
      }
      lia_conversations: {
        Row: {
          id: string
          user_id: string
          context_type: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          context_type?: string | null
          created_at?: string | null
        }
        Update: {
          context_type?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      lia_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          role?: string | null
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          start_time: string | null
          actual_duration_minutes: number | null
          status: string | null
          completed_at: string | null
          session_type: string | null
        }
        Insert: {
          id?: string
          user_id: string
          start_time?: string | null
          actual_duration_minutes?: number | null
          status?: string | null
          completed_at?: string | null
          session_type?: string | null
        }
        Update: {
          start_time?: string | null
          actual_duration_minutes?: number | null
          status?: string | null
          completed_at?: string | null
          session_type?: string | null
        }
        Relationships: []
      }
      user_course_certificates: {
        Row: {
          certificate_id: string
          organization_id: string | null
          user_id: string
          course_id: string
          issued_at: string | null
        }
        Insert: {
          certificate_id?: string
          organization_id?: string | null
          user_id: string
          course_id: string
          issued_at?: string | null
        }
        Update: {
          organization_id?: string | null
          issued_at?: string | null
        }
        Relationships: []
      }
      user_course_enrollments: {
        Row: {
          enrollment_id: string
          user_id: string
          course_id: string
          overall_progress_percentage: number | null
          enrollment_status: string | null
          completed_at: string | null
          started_at: string | null
        }
        Insert: {
          enrollment_id?: string
          user_id: string
          course_id: string
          overall_progress_percentage?: number | null
          enrollment_status?: string | null
          completed_at?: string | null
          started_at?: string | null
        }
        Update: {
          overall_progress_percentage?: number | null
          enrollment_status?: string | null
          completed_at?: string | null
          started_at?: string | null
        }
        Relationships: []
      }
      user_lesson_notes: {
        Row: {
          note_id: string
          user_id: string
        }
        Insert: {
          note_id?: string
          user_id: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          progress_id: string
          user_id: string
          lesson_id: string
          enrollment_id: string | null
          time_spent_minutes: number | null
          is_completed: boolean | null
          completed_at: string | null
          last_accessed_at: string | null
          quiz_completed: boolean | null
          quiz_passed: boolean | null
        }
        Insert: {
          progress_id?: string
          user_id: string
          lesson_id: string
          enrollment_id?: string | null
          time_spent_minutes?: number | null
          is_completed?: boolean | null
          completed_at?: string | null
          last_accessed_at?: string | null
          quiz_completed?: boolean | null
          quiz_passed?: boolean | null
        }
        Update: {
          enrollment_id?: string | null
          time_spent_minutes?: number | null
          is_completed?: boolean | null
          completed_at?: string | null
          last_accessed_at?: string | null
          quiz_completed?: boolean | null
          quiz_passed?: boolean | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          notification_id: string
          user_id: string
          notification_type: string
          title: string
          message: string
          metadata: Json
          priority: 'critical' | 'high' | 'medium' | 'low'
          status: 'unread' | 'read' | 'archived'
          channels_sent: Json
          channels_pending: Json
          read_at: string | null
          expires_at: string | null
          organization_id: string | null
          group_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          notification_id?: string
          user_id: string
          notification_type: string
          title: string
          message: string
          metadata?: Json
          priority?: 'critical' | 'high' | 'medium' | 'low'
          status?: 'unread' | 'read' | 'archived'
          channels_sent?: Json
          channels_pending?: Json
          read_at?: string | null
          expires_at?: string | null
          organization_id?: string | null
          group_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'unread' | 'read' | 'archived'
          read_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          username: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          display_name: string | null
          cargo_rol: string | null
          type_rol: string | null
          email_verified: boolean
          email_verified_at: string | null
          phone: string | null
          bio: string | null
          location: string | null
          profile_picture_url: string | null
          country_code: string | null
          created_at: string | null
          updated_at: string | null
          last_login_at: string | null
          is_banned: boolean
          banned_at: string | null
          ban_reason: string | null
        }
        Insert: {
          id?: string
          username?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          cargo_rol?: string | null
          type_rol?: string | null
          email_verified?: boolean
          email_verified_at?: string | null
          phone?: string | null
          bio?: string | null
          location?: string | null
          profile_picture_url?: string | null
          country_code?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_login_at?: string | null
          is_banned?: boolean
          banned_at?: string | null
          ban_reason?: string | null
        }
        Update: {
          username?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          cargo_rol?: string | null
          type_rol?: string | null
          email_verified?: boolean
          email_verified_at?: string | null
          phone?: string | null
          bio?: string | null
          location?: string | null
          profile_picture_url?: string | null
          country_code?: string | null
          updated_at?: string | null
          last_login_at?: string | null
          is_banned?: boolean
          banned_at?: string | null
          ban_reason?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_unread_notifications_count: {
        Args: { p_user_id: string }
        Returns: {
          total: number
          critical: number
          high: number
        }[]
      }
      mark_all_notifications_read: {
        Args: { p_user_id: string }
        Returns: {
          updated_count: number
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
