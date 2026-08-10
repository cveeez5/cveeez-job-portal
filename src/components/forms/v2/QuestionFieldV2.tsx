'use client';

import { useCallback, useRef } from 'react';
import RichLabel from './RichLabel';
import type { V2Question } from '@/lib/moderator-v2';
import type { V2AnswerMeta } from '@/lib/scoring-v2';

interface QuestionFieldV2Props {
  question: V2Question;
  index: number;
  value: string;
  error?: string;
  onChange: (id: string, value: string) => void;
  /** مؤشرات النسخ للأسئلة المفتوحة — بتتبعت للأدمن كمؤشر مش كاستبعاد. */
  onMeta?: (id: string, meta: V2AnswerMeta) => void;
  meta?: V2AnswerMeta;
}

export default function QuestionFieldV2({
  question,
  index,
  value,
  error,
  onChange,
  onMeta,
  meta,
}: QuestionFieldV2Props) {
  const focusStartedAt = useRef<number | null>(null);
  const metaRef = useRef<V2AnswerMeta>(meta ?? { seconds: 0, pasted: false, chars: 0 });

  const pushMeta = useCallback(
    (patch: Partial<V2AnswerMeta>) => {
      metaRef.current = { ...metaRef.current, ...patch };
      onMeta?.(question.id, metaRef.current);
    },
    [onMeta, question.id]
  );

  const handleFocus = useCallback(() => {
    focusStartedAt.current = Date.now();
  }, []);

  const handleBlur = useCallback(() => {
    if (focusStartedAt.current === null) return;
    const elapsed = Math.round((Date.now() - focusStartedAt.current) / 1000);
    focusStartedAt.current = null;
    if (elapsed > 0) pushMeta({ seconds: metaRef.current.seconds + elapsed });
  }, [pushMeta]);

  const handlePaste = useCallback(() => {
    pushMeta({ pasted: true });
  }, [pushMeta]);

  const handleChange = useCallback(
    (next: string) => {
      onChange(question.id, next);
      if (onMeta) pushMeta({ chars: next.trim().length });
    },
    [onChange, onMeta, pushMeta, question.id]
  );

  const hasError = !!error;
  const describedBy = hasError ? `${question.id}-error` : question.hint ? `${question.id}-hint` : undefined;

  const renderField = () => {
    switch (question.type) {
      case 'textarea':
        return (
          <textarea
            id={question.id}
            className={`glass-input min-h-[130px] resize-y leading-relaxed ${hasError ? 'error' : ''}`}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onPaste={handlePaste}
            aria-required={question.required}
            aria-invalid={hasError}
            aria-describedby={describedBy}
          />
        );

      case 'select':
        return (
          <select
            id={question.id}
            className={`glass-select ${hasError ? 'error' : ''}`}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            aria-required={question.required}
            aria-invalid={hasError}
            aria-describedby={describedBy}
          >
            <option value="" disabled>
              اختاري الإجابة
            </option>
            {question.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2.5" role="radiogroup" aria-labelledby={`label-${question.id}`}>
            {question.options?.map((opt) => {
              const selected = value === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3.5 min-h-[52px] rounded-xl cursor-pointer transition-all ${
                    selected
                      ? 'bg-green-500/15 border border-green-500/40'
                      : 'bg-white/5 border border-white/5 active:bg-white/10 sm:hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={opt.value}
                    checked={selected}
                    onChange={(e) => handleChange(e.target.value)}
                    className="w-5 h-5 mt-0.5 shrink-0 accent-green-500"
                  />
                  <span className="text-sm text-white/85 leading-relaxed">{opt.label}</span>
                </label>
              );
            })}
          </div>
        );

      case 'number':
        return (
          <input
            id={question.id}
            type="number"
            inputMode="numeric"
            dir="ltr"
            className={`glass-input text-left ${hasError ? 'error' : ''}`}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            aria-required={question.required}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            min={0}
          />
        );

      case 'tel':
        return (
          <input
            id={question.id}
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            className={`glass-input text-left ${hasError ? 'error' : ''}`}
            placeholder="01XXXXXXXXX"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            aria-required={question.required}
            aria-invalid={hasError}
            aria-describedby={describedBy}
          />
        );

      case 'email':
        return (
          <input
            id={question.id}
            type="email"
            inputMode="email"
            dir="ltr"
            autoComplete="email"
            className={`glass-input text-left ${hasError ? 'error' : ''}`}
            placeholder="name@example.com"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            aria-required={question.required}
            aria-invalid={hasError}
            aria-describedby={describedBy}
          />
        );

      default:
        return (
          <input
            id={question.id}
            type="text"
            className={`glass-input ${hasError ? 'error' : ''}`}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            aria-required={question.required}
            aria-invalid={hasError}
            aria-describedby={describedBy}
          />
        );
    }
  };

  return (
    <div className="space-y-2.5">
      <label
        id={`label-${question.id}`}
        htmlFor={question.type !== 'radio' ? question.id : undefined}
        className="block text-sm font-medium text-white/85 leading-relaxed"
      >
        <span className="flex items-start gap-1.5">
          <span className="text-green-400/70 shrink-0">{index}.</span>
          <span className="flex-1 min-w-0">
            <RichLabel text={question.label} />
          </span>
          {question.required && (
            <span aria-hidden="true" className="text-red-400 shrink-0">
              *
            </span>
          )}
        </span>
      </label>

      {question.hint && (
        <p id={`${question.id}-hint`} className="text-xs text-white/40 leading-relaxed">
          {question.hint}
        </p>
      )}

      {renderField()}

      {error && (
        <p id={`${question.id}-error`} role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
