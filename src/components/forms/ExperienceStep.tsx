'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Upload, X, FileText } from 'lucide-react';

interface ExperienceStepProps {
  data: {
    yearsOfExperience: string;
    linkedinUrl: string;
    cvFile: File | null;
  };
  onUpdate: (data: {
    yearsOfExperience?: string;
    linkedinUrl?: string;
    cvFile?: File | null;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

const experienceOptions = [
  'بدون خبرة',
  'أقل من سنة',
  '1-2 سنة',
  '2-4 سنوات',
  '4+ سنوات',
];

export default function ExperienceStep({
  data,
  onUpdate,
  onNext,
  onBack,
}: ExperienceStepProps) {
  const [experience, setExperience] = useState(data.yearsOfExperience);
  const [linkedin, setLinkedin] = useState(data.linkedinUrl);
  const [cvFile, setCvFile] = useState<File | null>(data.cvFile);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('صيغة الملف مش مدعومة — ارفع PDF أو DOCX');
      return;
    }

    if (file.size > maxSize) {
      setError('حجم الملف أكبر من 5MB — حاول ترفع ملف أصغر');
      return;
    }

    setError('');
    setCvFile(file);
  };

  const removeFile = () => {
    setCvFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNext = () => {
    if (!experience) {
      setError('من فضلك اختار سنوات الخبرة');
      return;
    }
    setError('');
    onUpdate({
      yearsOfExperience: experience,
      linkedinUrl: linkedin,
      cvFile,
    });
    onNext();
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white mb-6">
        📋 الخبرة والسيرة الذاتية
      </h2>

      {/* Years of Experience */}
      <div>
        <label htmlFor="experience" className="block text-sm font-medium text-white/80 mb-2">
          سنوات الخبرة
          <span aria-hidden="true" className="text-red-400 mr-1">*</span>
        </label>
        <select
          id="experience"
          className="glass-select"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          aria-required="true"
        >
          <option value="" disabled>
            اختار سنوات الخبرة
          </option>
          {experienceOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* CV Upload */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          السيرة الذاتية (CV)
          <span className="text-white/30 text-xs mr-1">(اختياري)</span>
        </label>

        {cvFile ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <FileText className="w-8 h-8 text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {cvFile.name}
              </p>
              <p className="text-xs text-white/40">
                {(cvFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-6 rounded-xl border-2 border-dashed border-white/10 hover:border-green-500/30 transition-colors group cursor-pointer"
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-white/30 group-hover:text-green-400 transition-colors" />
              <p className="text-sm text-white/50 group-hover:text-white/70">
                اضغط هنا لرفع السيرة الذاتية
              </p>
              <p className="text-xs text-white/30">PDF أو DOCX — حد أقصى 5MB</p>
            </div>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* LinkedIn */}
      <div>
        <label htmlFor="linkedin" className="block text-sm font-medium text-white/80 mb-2">
          رابط LinkedIn
          <span className="text-white/30 text-xs mr-1">(اختياري)</span>
        </label>
        <input
          id="linkedin"
          type="url"
          dir="ltr"
          className="glass-input text-left"
          placeholder="https://linkedin.com/in/..."
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
        />
      </div>

      {/* Error */}
      {error && (
        <p role="alert" className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">
          {error}
        </p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button type="button" onClick={onBack} className="btn-secondary">
          <ChevronRight className="w-4 h-4" />
          السابق
        </button>
        <button type="button" onClick={handleNext} className="btn-primary">
          التالي
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
