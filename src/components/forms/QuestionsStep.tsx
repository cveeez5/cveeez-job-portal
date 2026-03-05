'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { JobQuestion } from '@/types';

interface QuestionsStepProps {
  questions: JobQuestion[];
  answers: Record<string, string>;
  onUpdate: (answers: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function QuestionsStep({
  questions,
  answers,
  onUpdate,
  onNext,
  onBack,
}: QuestionsStepProps) {
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>(answers);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateAnswer = (id: string, value: string) => {
    setLocalAnswers((prev) => ({ ...prev, [id]: value }));
    // Clear error on change
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    questions.forEach((q) => {
      if (q.required && !localAnswers[q.id]?.trim()) {
        newErrors[q.id] = 'هذا السؤال مطلوب';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onUpdate(localAnswers);
      onNext();
    }
  };

  const renderField = (question: JobQuestion) => {
    const hasError = !!errors[question.id];
    const value = localAnswers[question.id] || '';

    switch (question.type) {
      case 'textarea':
        return (
          <textarea
            id={question.id}
            className={`glass-input min-h-[100px] resize-y ${hasError ? 'error' : ''}`}
            placeholder={question.placeholder}
            value={value}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            aria-required={question.required}
            aria-invalid={hasError}
          />
        );

      case 'select':
        return (
          <select
            id={question.id}
            className={`glass-select ${hasError ? 'error' : ''}`}
            value={value}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            aria-required={question.required}
            aria-invalid={hasError}
          >
            <option value="" disabled>
              اختار الإجابة
            </option>
            {question.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2" role="radiogroup" aria-labelledby={`label-${question.id}`}>
            {question.options?.map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  value === opt
                    ? 'bg-green-500/15 border border-green-500/30'
                    : 'bg-white/5 border border-white/5 hover:bg-white/10'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  className="w-4 h-4 accent-green-500"
                />
                <span className="text-sm text-white/80">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'number':
        return (
          <input
            id={question.id}
            type="number"
            dir="ltr"
            className={`glass-input text-left ${hasError ? 'error' : ''}`}
            placeholder={question.placeholder}
            value={value}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            aria-required={question.required}
            aria-invalid={hasError}
            min={0}
          />
        );

      case 'url':
        return (
          <input
            id={question.id}
            type="url"
            dir="ltr"
            className={`glass-input text-left ${hasError ? 'error' : ''}`}
            placeholder={question.placeholder || 'https://...'}
            value={value}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            aria-required={question.required}
            aria-invalid={hasError}
          />
        );

      default: // text
        return (
          <input
            id={question.id}
            type="text"
            className={`glass-input ${hasError ? 'error' : ''}`}
            placeholder={question.placeholder}
            value={value}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            aria-required={question.required}
            aria-invalid={hasError}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">
        ❓ أسئلة الوظيفة
      </h2>

      {questions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/50">مفيش أسئلة إضافية لهذه الوظيفة</p>
        </div>
      ) : (
        questions.map((question, index) => (
          <div key={question.id} className="space-y-2">
            <label
              id={`label-${question.id}`}
              htmlFor={question.type !== 'radio' ? question.id : undefined}
              className="block text-sm font-medium text-white/80"
            >
              <span className="text-green-400/60 ml-2">{index + 1}.</span>
              {question.text}
              {question.required && (
                <span aria-hidden="true" className="text-red-400 mr-1">*</span>
              )}
            </label>
            {renderField(question)}
            {errors[question.id] && (
              <p role="alert" className="text-sm text-red-400">
                {errors[question.id]}
              </p>
            )}
          </div>
        ))
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button type="button" onClick={onBack} className="btn-secondary">
          <ChevronRight className="w-4 h-4" />
          السابق
        </button>
        <button type="button" onClick={handleNext} className="btn-primary">
          التالي - المراجعة
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
