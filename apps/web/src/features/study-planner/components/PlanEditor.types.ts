export interface PlanEditorProps {
  plan: {
    id: string;
    name: string;
    description?: string;
    courses: Array<{
      courseId: string;
      title: string;
      isSelected: boolean;
    }>;
    selectedDays: string[];
    minSessionMinutes: number;
    maxSessionMinutes: number;
    preferredSessionType: 'short' | 'medium' | 'long';
    breakDurationMinutes: number;
  };
  availableCourses: Array<{
    courseId: string;
    title: string;
  }>;
  onSave: (updates: Partial<PlanEditorProps['plan']>) => Promise<void>;
  onCancel: () => void;
}
