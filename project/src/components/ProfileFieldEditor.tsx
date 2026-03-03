import React, { useState } from 'react';
import { GlassmorphismCard } from './GlassmorphismCard';
import { Sparkles, XCircle, BookOpen, Briefcase, Sparkle, GraduationCap } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';

interface ProfileFieldEditorProps {
  initialValues: Partial<LinkedInProfileFields>;
  missingFields: (keyof LinkedInProfileFields)[];
  onSubmit: (fields: LinkedInProfileFields) => void;
  onCancel?: () => void;
}

export interface LinkedInProfileFields {
  summary: string;
  experience: string;
  skills: string;
  education: string;
}

const FIELD_LABELS: Record<keyof LinkedInProfileFields, string> = {
  summary: 'Summary',
  experience: 'Experience',
  skills: 'Skills (comma separated)',
  education: 'Education',
};

const FIELD_ICONS: Record<keyof LinkedInProfileFields, React.ReactNode> = {
  summary: <BookOpen className="w-6 h-6 text-blue-400" />,
  experience: <Briefcase className="w-6 h-6 text-purple-400" />,
  skills: <Sparkle className="w-6 h-6 text-green-400" />,
  education: <GraduationCap className="w-6 h-6 text-yellow-400" />,
};

export const ProfileFieldEditor: React.FC<ProfileFieldEditorProps> = ({
  initialValues,
  missingFields,
  onSubmit,
  onCancel,
}) => {
  const [fields, setFields] = useState<LinkedInProfileFields>({
    summary: initialValues.summary || '',
    experience: initialValues.experience || '',
    skills: initialValues.skills || '',
    education: initialValues.education || '',
  });
  const [showAll, setShowAll] = useState(false);

  const handleChange = (key: keyof LinkedInProfileFields, value: string) => {
    setFields(f => ({ ...f, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(fields);
  };

  const fieldsToShow = showAll ? (Object.keys(FIELD_LABELS) as (keyof LinkedInProfileFields)[]) : missingFields;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-auto"
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[3px] z-0" />
      {/* Card */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <GlassmorphismCard className="p-4 sm:p-6 max-w-sm sm:max-w-md w-full shadow-2xl animate-float border-2 border-blue-500/30" variant="primary" glowEffect>
          <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
          {/* Close Button */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="absolute top-2 right-2 text-blue-300 hover:text-white transition-colors text-lg z-20"
              aria-label="Close"
            >
              <XCircle className="w-6 h-6" />
            </button>
          )}
          {/* Holographic Header */}
          <div className="relative mb-2">
            <div className="text-lg md:text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse text-center drop-shadow-glow">
              Complete Your LinkedIn Profile Data
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-xl pointer-events-none" />
            <div className="flex justify-center mt-1">
              <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
            </div>
            <p className="text-blue-200 text-center mt-1 text-xs md:text-sm font-medium">
              We couldn't fetch all your profile data.<br />Please fill in the missing fields for best results.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col gap-2">
              {fieldsToShow.map((key) => (
                <div key={key} className="flex items-start gap-2 bg-white/5 rounded-xl p-2 border border-blue-400/10 shadow-lg">
                  <div className="mt-1">{FIELD_ICONS[key]}</div>
                  <div className="flex-1">
                    <label className="block text-blue-200 font-semibold mb-1 text-sm">{FIELD_LABELS[key]}</label>
                    {key === 'skills' ? (
                      <input
                        type="text"
                        value={fields.skills}
                        onChange={e => handleChange('skills', e.target.value)}
                        placeholder="e.g. React, Node.js, Leadership"
                        className="w-full px-3 py-2 bg-slate-900/60 border border-blue-400/30 rounded-xl text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 text-sm"
                      />
                    ) : (
                      <textarea
                        value={fields[key]}
                        onChange={e => handleChange(key, e.target.value)}
                        rows={key === 'summary' ? 3 : 2}
                        placeholder={`Enter your ${FIELD_LABELS[key].toLowerCase()}`}
                        className="w-full px-3 py-2 bg-slate-900/60 border border-blue-400/30 rounded-xl text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 text-sm"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {missingFields.length > 0 && (
              <button
                type="button"
                className="text-blue-400 underline text-xs mt-1 hover:text-blue-200"
                onClick={() => setShowAll(s => !s)}
              >
                {showAll ? 'Show only missing fields' : 'Edit all fields'}
              </button>
            )}
            <div className="flex gap-2 justify-end mt-2">
              {onCancel && (
                <button type="button" onClick={onCancel} className="px-3 py-1 bg-gray-700 rounded-lg text-white hover:bg-gray-800 transition text-xs md:text-sm font-semibold">Cancel</button>
              )}
              <button type="submit" className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-bold text-xs md:text-sm shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all">Save & Continue</button>
            </div>
          </form>
        </GlassmorphismCard>
      </div>
      <style>{`
        .animate-float {
          animation: floatCard 6s ease-in-out infinite;
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0) scale(1.01); }
          50% { transform: translateY(-18px) scale(1.04); }
        }
        .drop-shadow-glow { filter: drop-shadow(0 0 8px #fff7) drop-shadow(0 0 16px #fff3); }
      `}</style>
    </div>
  );
}; 