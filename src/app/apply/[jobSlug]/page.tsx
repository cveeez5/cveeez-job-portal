'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import StepIndicator from '@/components/forms/StepIndicator';
import PersonalInfoStep from '@/components/forms/PersonalInfoStep';
import ExperienceStep from '@/components/forms/ExperienceStep';
import QuestionsStep from '@/components/forms/QuestionsStep';
import ReviewStep from '@/components/forms/ReviewStep';
import { JOBS, JOB_QUESTIONS } from '@/lib/constants';
import { FORM_STEPS } from '@/types';

const Background3D = dynamic(() => import('@/components/3d/Background3D'), {
  ssr: false,
});

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

export default function JobApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const jobSlug = params.jobSlug as string;

  const job = JOBS.find((j) => j.id === jobSlug);
  const questions = JOB_QUESTIONS[jobSlug] || [];

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    yearsOfExperience: '',
    linkedinUrl: '',
    cvFile: null as File | null,
    answers: {} as Record<string, string>,
  });

  // Steps for this form (excluding job selection step since job is already chosen)
  const steps = FORM_STEPS.slice(1); // Skip "اختيار الوظيفة"

  const updateFormData = useCallback(
    (data: Partial<typeof formData>) => {
      setFormData((prev) => ({ ...prev, ...data }));
    },
    []
  );

  const nextStep = useCallback(() => {
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('jobSlug', jobSlug);
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('city', formData.city);
      submitData.append('yearsOfExperience', formData.yearsOfExperience);
      submitData.append('linkedinUrl', formData.linkedinUrl);
      submitData.append('answers', JSON.stringify(formData.answers));

      if (formData.cvFile) {
        submitData.append('cv', formData.cvFile);
      }

      const res = await fetch('/api/applications', {
        method: 'POST',
        body: submitData,
      });

      if (res.ok) {
        router.push(`/success?job=${jobSlug}`);
      } else {
        alert('حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.');
      }
    } catch {
      alert('حدث خطأ في الاتصال. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <p className="text-2xl mb-4">😕</p>
          <h2 className="text-xl font-bold text-white mb-2">الوظيفة مش موجودة</h2>
          <p className="text-white/50 mb-4">الرابط ده مش صحيح أو الوظيفة اتشالت</p>
          <button onClick={() => router.push('/apply')} className="btn-primary">
            ارجع للوظائف
          </button>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PersonalInfoStep
            data={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        );
      case 1:
        return (
          <ExperienceStep
            data={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 2:
        return (
          <QuestionsStep
            questions={questions}
            answers={formData.answers}
            onUpdate={(answers) => updateFormData({ answers })}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <ReviewStep
            formData={formData}
            job={job}
            questions={questions}
            onSubmit={handleSubmit}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Background3D />
      <Header />

      <main className="relative z-10 min-h-screen pt-28 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Job header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="text-4xl mb-3">{job.icon}</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              التقديم على وظيفة: {job.title}
            </h1>
            <p className="text-sm text-white/50">{job.description}</p>
          </motion.div>

          {/* Step Indicator */}
          <StepIndicator
            steps={steps.map((s) => ({ title: s.title, icon: s.icon }))}
            currentStep={currentStep}
          />

          {/* Form Steps */}
          <div className="glass-card p-6 sm:p-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </>
  );
}
