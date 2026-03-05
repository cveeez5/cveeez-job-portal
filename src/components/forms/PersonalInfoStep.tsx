'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalInfoSchema, type PersonalInfoData } from '@/lib/validations';
import { ChevronLeft } from 'lucide-react';

interface PersonalInfoStepProps {
  data: {
    name: string;
    email: string;
    phone: string;
    city: string;
  };
  onUpdate: (data: Partial<PersonalInfoData & { city: string }>) => void;
  onNext: () => void;
}

export default function PersonalInfoStep({
  data,
  onUpdate,
  onNext,
}: PersonalInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      city: data.city,
    },
  });

  const onSubmit = (values: PersonalInfoData) => {
    onUpdate(values);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-bold text-white mb-6">
        👤 المعلومات الشخصية
      </h2>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
          الاسم الكامل
          <span aria-hidden="true" className="text-red-400 mr-1">*</span>
        </label>
        <input
          id="name"
          type="text"
          className={`glass-input ${errors.name ? 'error' : ''}`}
          placeholder="مثال: أحمد محمد علي"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'nameError' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="nameError" role="alert" className="mt-1.5 text-sm text-red-400">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
          البريد الإلكتروني
          <span aria-hidden="true" className="text-red-400 mr-1">*</span>
        </label>
        <input
          id="email"
          type="email"
          dir="ltr"
          className={`glass-input text-left ${errors.email ? 'error' : ''}`}
          placeholder="name@example.com"
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'emailError' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="emailError" role="alert" className="mt-1.5 text-sm text-red-400">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-2">
          رقم الموبايل
          <span aria-hidden="true" className="text-red-400 mr-1">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          dir="ltr"
          className={`glass-input text-left ${errors.phone ? 'error' : ''}`}
          placeholder="01XXXXXXXXX"
          aria-required="true"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phoneError' : 'phoneHint'}
          {...register('phone')}
        />
        <p id="phoneHint" className="mt-1 text-xs text-white/40">
          مثال: 01065236963
        </p>
        {errors.phone && (
          <p id="phoneError" role="alert" className="mt-1 text-sm text-red-400">
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* City */}
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-white/80 mb-2">
          المدينة
          <span className="text-white/30 text-xs mr-1">(اختياري)</span>
        </label>
        <input
          id="city"
          type="text"
          className="glass-input"
          placeholder="مثال: القاهرة"
          {...register('city')}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-start pt-4">
        <button type="submit" className="btn-primary w-full sm:w-auto">
          التالي
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
