// src/lib/validations.ts
import { z } from 'zod';

export const personalInfoSchema = z.object({
  name: z
    .string()
    .min(3, 'الاسم لازم يكون على الأقل 3 حروف')
    .max(100, 'الاسم طويل جداً'),
  email: z
    .string()
    .email('الإيميل ده مش صحيح - تأكد إنه بالشكل ده: name@example.com'),
  phone: z
    .string()
    .regex(
      /^01[0-9]{9}$/,
      'رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 01'
    ),
  city: z.string().min(2, 'من فضلك اكتب المدينة').optional().or(z.literal('')),
});

export const experienceSchema = z.object({
  yearsOfExperience: z.string().min(1, 'من فضلك اختار سنوات الخبرة'),
  linkedinUrl: z
    .string()
    .url('الرابط مش صحيح')
    .optional()
    .or(z.literal('')),
});

export type PersonalInfoData = z.infer<typeof personalInfoSchema>;
export type ExperienceData = z.infer<typeof experienceSchema>;

export const applicationSchema = personalInfoSchema.merge(experienceSchema);
export type ApplicationData = z.infer<typeof applicationSchema>;
