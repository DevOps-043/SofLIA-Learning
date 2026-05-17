import type { CourseSkill, Skill } from "./types";

interface SkillsResponse {
  success?: boolean;
  skills?: Skill[];
}

interface CourseSkillsResponse {
  success?: boolean;
  skills?: CourseSkill[];
}

export async function fetchAvailableSkillsApi() {
  const response = await fetch("/api/skills?is_active=true");
  const data = (await response.json()) as SkillsResponse;
  return data.success ? data.skills || [] : [];
}

export async function fetchCourseSkillsApi(courseId: string) {
  const response = await fetch(`/api/courses/${courseId}/skills`);
  const data = (await response.json()) as CourseSkillsResponse;
  return data.success ? data.skills || [] : [];
}
