'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  steps: Array<{ title: string; icon: string }>;
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: index === currentStep ? 1.1 : 1,
                  backgroundColor:
                    index < currentStep
                      ? '#22c55e'
                      : index === currentStep
                        ? 'rgba(34, 197, 94, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base',
                  index < currentStep && 'text-white shadow-lg shadow-green-500/30',
                  index === currentStep &&
                    'border-2 border-green-500 text-green-400',
                  index > currentStep && 'text-white/30',
                )}
              >
                {index < currentStep ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    ✓
                  </motion.span>
                ) : (
                  <span className="text-lg">{step.icon}</span>
                )}
              </motion.div>
              <span
                className={cn(
                  'mt-2 text-[10px] sm:text-xs text-center hidden sm:block',
                  index <= currentStep ? 'text-white/80' : 'text-white/30',
                )}
              >
                {step.title}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 sm:mx-3 h-0.5 rounded-full overflow-hidden bg-white/5">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{
                    width: index < currentStep ? '100%' : '0%',
                  }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="h-full bg-gradient-to-l from-green-500 to-green-400 rounded-full"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile step label */}
      <div className="sm:hidden mt-3 text-center">
        <p className="text-xs text-white/60">
          الخطوة {currentStep + 1} من {steps.length}
        </p>
        <p className="text-sm text-green-400 font-medium mt-0.5">
          {steps[currentStep]?.icon} {steps[currentStep]?.title}
        </p>
      </div>
    </div>
  );
}
