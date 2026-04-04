
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface CourseCategoryItem {
  name: string
}

interface LessonTimeEstimate {
  total_time_minutes?: number | null
  video_minutes?: number | null
  reading_time_minutes?: number | null
  activities_time_minutes?: number | null
  quiz_time_minutes?: number | null
  exercise_time_minutes?: number | null
}

interface LessonDurationItem {
  estimated_time_minutes?: number | null
}

interface DeadlineCourseLessonRow {
  lesson_title: string | null
  duration_seconds: number | null
  lesson_time_estimates: LessonTimeEstimate[] | LessonTimeEstimate | null
  lesson_activities: LessonDurationItem[] | null
  lesson_materials: LessonDurationItem[] | null
}

interface DeadlineCourseModuleRow {
  module_title: string | null
  module_description: string | null
  course_lessons: DeadlineCourseLessonRow[] | null
}

interface DeadlineCourseRow {
  id: string
  title: string
  description: string | null
  level: string | null
  duration_total_minutes: number | null
  category: CourseCategoryItem[] | CourseCategoryItem | null
  course_modules: DeadlineCourseModuleRow[] | null
}

function getCategoryLabel(category: DeadlineCourseRow['category']): string {
  if (Array.isArray(category)) {
    return category.map((item) => item.name).join(', ')
  }

  return category?.name || 'General'
}

export const maxDuration = 60; // Allow more time for AI processing

// Standard reference paces (used as baseline for AI)
const BASELINE_PACES = {
  fast: 12,      // hours/week
  balanced: 4,   // hours/week
  long: 2        // hours/week
};

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;

  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return NextResponse.json({ error: 'Organización requerida' }, { status: 403 })
    }

    const supabase = await createClient()


    // 1. Fetch Precise Course Data
    // Fixed query: removed invalid 'categories' join
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        level,
        duration_total_minutes,
        category,
        course_modules (
          module_title,
          module_description,
          course_lessons (
            lesson_title,
            duration_seconds,
            lesson_time_estimates (
              total_time_minutes,
              video_minutes,
              reading_time_minutes,
              activities_time_minutes,
              quiz_time_minutes,
              exercise_time_minutes
            ),
            lesson_activities (
              activity_title,
              estimated_time_minutes
            ),
            lesson_materials (
              material_title,
              estimated_time_minutes
            )
          )
        )
      `)
      .eq('id', params.id)
      .single<DeadlineCourseRow>()

    if (courseError || !course) {
      console.error("Error fetching course data:", courseError);
      return NextResponse.json({ error: 'Curso no encontrado', details: courseError }, { status: 404 })
    }


    // 2. Aggregate REAL DB Times
    let totalVideoMinutes = 0;
    let totalReadingMinutes = 0;
    let totalActivityMinutes = 0;
    
    let syllabusContext = `COURSE: "${course.title}"\n`;
    syllabusContext += `LEVEL: ${course.level || 'Not specified'}\n`;
    syllabusContext += `CATEGORY: ${getCategoryLabel(course.category)}\n`;
    syllabusContext += `DESCRIPTION: ${course.description || ''}\n\n`;
    syllabusContext += `CONTENT BREAKDOWN (Real Times):\n`;

    if (course.course_modules && Array.isArray(course.course_modules)) {
      course.course_modules.forEach((module, i: number) => {
        syllabusContext += `\nMODULE ${i+1}: ${module.module_title}`;
        
        if (module.course_lessons && Array.isArray(module.course_lessons)) {
          module.course_lessons.forEach((lesson) => {
             const estimates = lesson.lesson_time_estimates; 
             const est = Array.isArray(estimates) ? estimates[0] : estimates;

             // Video
             const vidMin = est?.video_minutes ?? Math.round(lesson.duration_seconds / 60);
             totalVideoMinutes += vidMin;

             // Reading
             let readMin = est?.reading_time_minutes ?? 0;
             if (!est && lesson.lesson_materials && Array.isArray(lesson.lesson_materials)) {
                lesson.lesson_materials.forEach((material) => readMin += (material.estimated_time_minutes || 0));
             }
             totalReadingMinutes += readMin;

             // Activity
             let actMin = (est?.activities_time_minutes || 0) + (est?.quiz_time_minutes || 0) + (est?.exercise_time_minutes || 0);
             if (!est && lesson.lesson_activities && Array.isArray(lesson.lesson_activities)) {
                 lesson.lesson_activities.forEach((activity) => actMin += (activity.estimated_time_minutes || 0));
             }
             totalActivityMinutes += actMin;

             syllabusContext += `\n  - Lesson: "${lesson.lesson_title}" [Video: ${vidMin}m, Read: ${readMin}m, Act: ${actMin}m]`;
          })
        }
      });
    }

    const dbTotalMinutes = totalVideoMinutes + totalReadingMinutes + totalActivityMinutes;
    // Safety floor: At least video duration or 1 min
    const finalTotalMinutes = Math.max(dbTotalMinutes, course.duration_total_minutes || 0, 1);
    const finalTotalHours = finalTotalMinutes / 60;

    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get('start_date')
    let startDate = startDateParam ? new Date(startDateParam) : new Date()
    if (isNaN(startDate.getTime())) startDate = new Date()

    // 3. AI Analysis & Deadline Calculation
    let aiReasoning = {
        summary: `Estimación basada en contenido: ${finalTotalHours.toFixed(1)}h totales.`,
        fast: "Ritmo intensivo.",
        balanced: "Ritmo moderado.",
        long: "Ritmo pausado."
    };
    
    // MATH FALLBACK (Pure Math)
    let deadlines = {
        fast: Math.max(2, Math.ceil((finalTotalHours / BASELINE_PACES.fast) * 7)),
        balanced: Math.max(5, Math.ceil((finalTotalHours / BASELINE_PACES.balanced) * 7)),
        long: Math.max(10, Math.ceil((finalTotalHours / BASELINE_PACES.long) * 7))
    };

    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash-exp",
          generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
          Calculate the RECOMMENDED DEADLINES for this course.
          
          HARD DATA (Summed from Database):
          - Total Real Content Duration: ${finalTotalHours.toFixed(2)} hours
          - Breakdown: Video ${totalVideoMinutes}m + Reading ${totalReadingMinutes}m + Practice ${totalActivityMinutes}m
          
          COURSE CONTEXT:
          ${syllabusContext.substring(0, 4000)}

          INSTRUCTIONS:
          The system has computed a raw duration of ${finalTotalHours.toFixed(2)} hours.
          However, raw hours != learning days.
          
          You must determine the "Learning Efficiency Factor" based on Cognitive Load.
          - High Cognitive Load (Coding, Math): Pace is SLOWER. (e.g. 1 hour of content takes 1.5h to absorb).
          - Low Cognitive Load (History, Soft Skills): Pace is standard.
          
          Standard Paces (Reference):
          - Fast: ~12h/week
          - Balanced: ~4h/week
          - Long: ~2h/week
          
          Return JSON with your CALCULATED days for each profile:
          {
            "deadlines": {
                "fast_days": (number, integer, min 1),
                "balanced_days": (number, integer, min 3),
                "long_days": (number, integer, min 7)
            },
            "reasoning_summary": "One sentence reasoning like: 'Due to heavy coding exercises, I added 20% buffer to the standard math.'",
            "approaches_desc": {
               "fast": "short motivational text",
               "balanced": "short text",
               "long": "short text"
            }
          }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const aiData = JSON.parse(text);

        if (aiData.deadlines) {
             deadlines.fast = Math.max(1, Number(aiData.deadlines.fast_days));
             deadlines.balanced = Math.max(3, Number(aiData.deadlines.balanced_days));
             deadlines.long = Math.max(7, Number(aiData.deadlines.long_days));
        }
        if (aiData.approaches_desc) {
          aiReasoning = { ...aiReasoning, ...aiData.approaches_desc };
          if (aiData.reasoning_summary) aiReasoning.summary = aiData.reasoning_summary;
        }

      } catch (e) {
        console.error("LIA Calculation failed (using math fallback):", e);
      }
    }

    // 4. Construct Response
    const createSuggestion = (key: 'fast' | 'balanced' | 'long', rate: string, days: number) => {
      // Recalculate implied hours/week for display based on the Date LIA chose
      // HoursPerWeek = TotalHours / (Days/7)
      const weeks = Math.max(0.14, days / 7); // min 1 day
      const impliedPace = Math.round((finalTotalHours / weeks) * 10) / 10;
      
      const deadline = new Date(startDate);
      deadline.setDate(deadline.getDate() + days);
      deadline.setHours(23, 59, 59, 999);

      return {
        approach: key,
        deadline_date: deadline.toISOString(),
        duration_days: days,
        duration_weeks: Math.ceil(weeks),
        hours_per_week: impliedPace, // Show the pace LIA decided was appropriate
        description: aiReasoning[key],
        estimated_completion_rate: rate
      };
    };

    const suggestions = [
      createSuggestion('fast', '85%', deadlines.fast),
      createSuggestion('balanced', '92%', deadlines.balanced),
      createSuggestion('long', '95%', deadlines.long)
    ];

    return NextResponse.json({
      success: true,
      course_id: course.id,
      title: course.title,
      total_content_minutes: dbTotalMinutes,
      total_effort_hours: Math.round(finalTotalHours * 10) / 10,
      ai_reasoning: aiReasoning.summary,
      suggestions,
      source: 'lia_smart_calc_v2'
    });

  } catch (error) {
    console.error('Error calculating suggestions:', error)
    return NextResponse.json(
      { error: 'Error interno de cálculo' },
      { status: 500 }
    )
  }
}
