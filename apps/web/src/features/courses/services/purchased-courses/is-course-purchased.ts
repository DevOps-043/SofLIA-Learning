import { createClient } from "@/lib/supabase/server";
import { fromLoose } from "@/lib/supabase/looseQuery";
import {
  isMissingCoursePurchasesError,
  markCoursePurchasesUnavailable,
  shouldSkipCoursePurchasesTable,
} from "./course-purchases-availability";
import { isCourseEnrolled } from "./enrolled-courses.query";

export async function isCoursePurchased(userId: string, courseId: string): Promise<boolean> {
  try {
    if (shouldSkipCoursePurchasesTable()) {
      return isCourseEnrolled(userId, courseId);
    }

    const supabase = await createClient();
    const { data, error } = await fromLoose<{ purchase_id: string }>(supabase, "course_purchases")
      .select("purchase_id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("access_status", "active")
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      if (isMissingCoursePurchasesError(error)) {
        markCoursePurchasesUnavailable();
        return isCourseEnrolled(userId, courseId);
      }

      return false;
    }

    return !!data;
  } catch {
    return false;
  }
}
