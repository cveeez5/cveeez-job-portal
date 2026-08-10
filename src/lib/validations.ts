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

// ===================== فورم المودريتور v2 =====================
// تحقق إضافي لحقول معينة بره شرط «مطلوب». الأسئلة والصياغة نفسها في moderator-v2.ts
const egyptianMobile = z
  .string()
  .regex(/^01[0-9]{9}$/, 'رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 01');

const MODERATOR_V2_FIELD_SCHEMAS: Record<string, z.ZodType<string>> = {
  b1: z.string().min(3, 'اكتبي اسمك الكامل'),
  b_email: z
    .string()
    .email('الإيميل ده مش صحيح — تأكدي إنه بالشكل ده: name@example.com'),
  b2: z
    .string()
    .refine((v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 16 && n <= 60;
    }, 'اكتبي سن صحيح'),
  b3: egyptianMobile,
  b4: z.union([egyptianMobile, z.literal('')]),
};

/** بيرجّع رسالة الخطأ أو null لو القيمة سليمة (أو مفيش قاعدة للسؤال ده). */
export function validateModeratorV2Field(id: string, value: string): string | null {
  const schema = MODERATOR_V2_FIELD_SCHEMAS[id];
  if (!schema) return null;
  const result = schema.safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? 'القيمة مش صحيحة';
}
