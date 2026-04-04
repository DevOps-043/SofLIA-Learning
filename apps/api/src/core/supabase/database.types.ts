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
            foreignKeyName: "fk_courses_instructor"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
          completed_at: string | null
          created_at: string | null
          current_time_seconds: number | null
          enrollment_id: string
          is_completed: boolean | null
          last_accessed_at: string | null
          lesson_id: string
          lesson_status: string | null
          organization_id: string | null
          progress_id: string
          quiz_completed: boolean | null
          quiz_passed: boolean | null
          quiz_progress_percentage: number | null
          started_at: string | null
          time_spent_minutes: number | null
          updated_at: string | null
          user_id: string
          video_progress_percentage: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_time_seconds?: number | null
          enrollment_id: string
          is_completed?: boolean | null
          last_accessed_at?: string | null
          lesson_id: string
          lesson_status?: string | null
          organization_id?: string | null
          progress_id?: string
          quiz_completed?: boolean | null
          quiz_passed?: boolean | null
          quiz_progress_percentage?: number | null
          started_at?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
          user_id: string
          video_progress_percentage?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_time_seconds?: number | null
          enrollment_id?: string
          is_completed?: boolean | null
          last_accessed_at?: string | null
          lesson_id?: string
          lesson_status?: string | null
          organization_id?: string | null
          progress_id?: string
          quiz_completed?: boolean | null
          quiz_passed?: boolean | null
          quiz_progress_percentage?: number | null
          started_at?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          video_progress_percentage?: number | null
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
