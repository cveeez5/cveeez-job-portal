// src/types/index.ts
export interface Job {
  id: string;
  title: string;
  titleEn: string;
  icon: string;
  description: string;
  color: string;
}

export interface JobQuestion {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'url' | 'file' | 'radio';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface ApplicationFormData {
  // Personal Info (Step 2)
  name: string;
  email: string;
  phone: string;
  city?: string;
  // Experience (Step 3)
  yearsOfExperience: string;
  linkedinUrl?: string;
  cvFile?: File | null;
  // Dynamic answers (Step 4)
  answers: Record<string, string>;
}

export interface FormStep {
  id: number;
  title: string;
  titleEn: string;
  icon: string;
}

export const FORM_STEPS: FormStep[] = [
  { id: 0, title: 'اختيار الوظيفة', titleEn: 'Select Job', icon: '💼' },
  { id: 1, title: 'المعلومات الشخصية', titleEn: 'Personal Info', icon: '👤' },
  { id: 2, title: 'الخبرة والسيرة الذاتية', titleEn: 'Experience & CV', icon: '📋' },
  { id: 3, title: 'أسئلة الوظيفة', titleEn: 'Job Questions', icon: '❓' },
  { id: 4, title: 'المراجعة والإرسال', titleEn: 'Review & Submit', icon: '✅' },
];

export type ApplicationStatus =
  | 'PENDING'
  | 'REVIEWED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'SHORTLISTED';

export const STATUS_LABELS: Record<ApplicationStatus, { label: string; color: string }> = {
  PENDING: { label: 'قيد المراجعة', color: 'bg-yellow-500/20 text-yellow-400' },
  REVIEWED: { label: 'تمت المراجعة', color: 'bg-blue-500/20 text-blue-400' },
  ACCEPTED: { label: 'مقبول', color: 'bg-green-500/20 text-green-400' },
  REJECTED: { label: 'مرفوض', color: 'bg-red-500/20 text-red-400' },
  SHORTLISTED: { label: 'في القائمة المختصرة', color: 'bg-purple-500/20 text-purple-400' },
};
