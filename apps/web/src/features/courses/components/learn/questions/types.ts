"use client";

export type CourseQuestionUser = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile_picture_url?: string | null;
};

export type CourseQuestion = {
  id: string;
  content: string;
  view_count: number;
  response_count: number;
  reaction_count: number;
  is_pinned: boolean;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  course_id?: string | null;
  user_reaction?: string | null;
  user: CourseQuestionUser;
};

export type CourseQuestionResponse = {
  id: string;
  question_id: string;
  parent_response_id?: string | null;
  content: string;
  created_at: string;
  updated_at?: string | null;
  reaction_count?: number;
  user_reaction?: string | null;
  is_instructor_answer?: boolean;
  is_approved_answer?: boolean;
  replies?: CourseQuestionResponse[];
  user: CourseQuestionUser;
};

export type QuestionReactionResult = {
  action: "added" | "removed" | "exists";
  reaction_type: string;
  new_count?: number;
  user_reaction?: string | null;
};

export type QuestionResponseReactionState = {
  counts: Record<string, number>;
  reactions: Record<string, string>;
};
