import React, { useState, useEffect } from 'react';
import { GlassmorphismCard } from './GlassmorphismCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertTriangle, FileText, Briefcase, BookOpen, GraduationCap, ChevronDown, ChevronUp, Lightbulb, Users, CheckCircle, XCircle, TrendingUp, Trophy, Building, Scale } from 'lucide-react';

interface ResumeResultsPanelProps {
  result: any;
  file?: File | null;
  text?: string;
  onEditSections?: () => void;
}

const likelihoodColor = (likelihood: string) => {
  if (!likelihood) return '';
  if (likelihood.toLowerCase() === 'high') return 'text-green-400 bg-green-900/40 border-green-500/30';
  if (likelihood.toLowerCase() === 'medium') return 'text-yellow-400 bg-yellow-900/40 border-yellow-500/30';
  if (likelihood.toLowerCase() === 'low') return 'text-red-400 bg-red-900/40 border-red-500/30';
  return '';
};

const sectionIcons: Record<string, React.ReactNode> = {
  summary: <BookOpen className="w-5 h-5 text-blue-400" />,
  experience: <Briefcase className="w-5 h-5 text-purple-400" />,
  skills: <Sparkles className="w-5 h-5 text-green-400" />,
  education: <GraduationCap className="w-5 h-5 text-yellow-400" />,
};

const AnimatedGauge: React.FC<{ score: number }> = ({ score }) => {
  const [displayScore, setDisplayScore] = React.useState(0);
  React.useEffect(() => {
    let raf: number | undefined;
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(start + (score - start) * progress);
      setDisplayScore(value);
      if (progress < 1) raf = requestAnimationFrame(animate);
    }
    animate(performance.now());
    return () => {
      if (raf !== undefined) cancelAnimationFrame(raf);
    };
  }, [score]);
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg width="160" height="160" className="absolute">
        <circle cx="80" cy="80" r="70" stroke="#334155" strokeWidth="16" fill="none" />
        <circle
          cx="80" cy="80" r="70"
          stroke="url(#score-gradient)"
          strokeWidth="16"
          fill="none"
          strokeDasharray={2 * Math.PI * 70}
          strokeDashoffset={2 * Math.PI * 70 * (1 - displayScore / 100)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <defs>
          <linearGradient id="score-gradient" x1="0" y1="0" x2="160" y2="160">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse drop-shadow-glow">
        {displayScore}
        <span className="text-lg text-blue-300 font-semibold">/100</span>
      </span>
    </div>
  );
};

export const ResumeResultsPanel: React.FC<ResumeResultsPanelProps> = ({ result, file, text, onEditSections }) => {
  const [aiSuggestion, setAISuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enhancedSection, setEnhancedSection] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Section keys and labels
  const sections = [
    { key: 'summary', label: 'Summary', value: result.summary },
    { key: 'experience', label: 'Experience', value: result.experience },
    { key: 'skills', label: 'Skills', value: result.skills },
    { key: 'education', label: 'Education', value: result.education },
  ];

  // Warn if any section is empty
  const missingSections = sections.filter(s => !s.value || !s.value.trim());

  // Preview handler
  const handlePreview = () => {
    setShowPreview(true);
  };

  // Helper for PDF/DOCX preview
  let fileUrl: string | null = null;
  if (file) {
    fileUrl = URL.createObjectURL(file);
  }

  // Restore handleEnhance
  const handleEnhance = async (section: string, text: string) => {
    setLoading(true);
    setAISuggestion(null);
    setEnhancedSection(section);
    const res = await fetch('http://localhost:3001/api/resume/enhance-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, text }),
    });
    const data = await res.json();
    setAISuggestion(data.enhancedText);
    setLoading(false);
  };

  return (
    <div className="space-y-10">
      {/* Edit Resume Sections Button */}
      {onEditSections && (
        <div className="flex justify-end mb-2">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition"
            onClick={onEditSections}
          >
            Edit Resume Sections
          </button>
        </div>
      )}
      {/* Resume Preview Button */}
      {(file || text) && (
        <div className="flex justify-end">
          <button
            type="button"
            className="mb-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition"
            onClick={handlePreview}
          >
            Preview Uploaded Resume
          </button>
        </div>
      )}
      {/* Modal for resume preview (PDF/DOCX or text) */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 rounded-xl p-6 max-w-2xl w-full shadow-2xl relative flex flex-col items-center">
            <button
              className="absolute top-2 right-2 text-blue-300 hover:text-white text-xl"
              onClick={() => setShowPreview(false)}
            >×</button>
            <h3 className="text-lg font-bold text-blue-200 mb-2">Resume Preview</h3>
            {file && file.type === 'application/pdf' && fileUrl && (
              <embed src={fileUrl} type="application/pdf" className="w-full h-[60vh] rounded border" />
            )}
            {file && file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && fileUrl && (
              <div className="w-full h-[60vh] flex flex-col items-center justify-center">
                <p className="text-blue-200 mb-2">DOCX preview is not supported in-browser. <a href={fileUrl} download={file.name} className="underline text-blue-400">Download and open</a> to view.</p>
              </div>
            )}
            {!file && text && (
              <pre className="bg-slate-800 p-4 rounded text-blue-100 whitespace-pre-wrap max-h-[60vh] overflow-auto w-full">{text}</pre>
            )}
          </div>
        </div>
      )}
      <GlassmorphismCard className="p-10 flex flex-col gap-10 min-h-[400px]" variant="primary">
        {/* Hero Score Section */}
        <div className="flex flex-col md:flex-row items-center gap-10 justify-center">
          <div className="flex flex-col items-center gap-2">
            <AnimatedGauge score={result.score || 0} />
            <div className={`mt-3 px-4 py-2 rounded-full border font-bold text-lg shadow ${likelihoodColor(result.likelihood)}`}>{result.likelihood} chance of interview</div>
            {result.likelihood_explanation && (
              <div className="text-xs text-blue-200 text-center mt-1 max-w-xs">{result.likelihood_explanation}</div>
            )}
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Matched Keywords */}
            <div className="bg-green-900/30 rounded-2xl p-5 border border-green-500/20 shadow flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="font-bold text-green-200">Matched Keywords</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(result.matched_keywords || []).map((k: string) => (
                  <span key={k} className="px-3 py-1 rounded-full bg-green-700/30 text-green-300 text-xs font-semibold border border-green-500/30">{k}</span>
                ))}
              </div>
            </div>
            {/* Missing Keywords */}
            <div className="bg-red-900/30 rounded-2xl p-5 border border-red-500/20 shadow flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="font-bold text-red-200">Missing Keywords</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(result.missing_keywords || []).map((k: string) => (
                  <span key={k} className="px-3 py-1 rounded-full bg-red-700/30 text-red-300 text-xs font-semibold border border-red-500/30">{k}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Warning for missing sections */}
        {missingSections.length > 0 && (
          <div className="p-4 bg-yellow-900/60 border border-yellow-500/30 rounded-xl text-yellow-200 font-semibold">
            {`We could not extract the following section${missingSections.length > 1 ? 's' : ''} from your resume: `}
            {missingSections.map(s => s.label).join(', ')}. Please check your resume formatting for best results.
          </div>
        )}
        {/* Section Feedback */}
        <div>
          <div className="font-bold text-blue-200 mb-4 text-xl flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-400" /> Section Feedback & AI Enhancement</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map(section => (
              <div key={section.key} className="bg-slate-800/70 rounded-2xl p-5 border border-blue-400/10 shadow-lg flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  {sectionIcons[section.key]}
                  <span className="font-semibold text-blue-100 text-lg">{section.label}</span>
                  <button
                    className="ml-auto px-2 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded text-white font-semibold flex items-center gap-1 text-xs shadow"
                    onClick={() => handleEnhance(section.key, section.value)}
                    disabled={loading && enhancedSection === section.key}
                  >
                    <Sparkles className="w-4 h-4" />
                    {loading && enhancedSection === section.key ? 'Enhancing...' : 'Enhance with AI'}
                  </button>
                </div>
                {/* Collapsible Original Content */}
                <div className="mb-2">
                  <button
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-200 font-bold mb-1"
                    onClick={() => setExpandedSections(prev => ({ ...prev, [section.key]: !prev[section.key] }))}
                  >
                    {expandedSections[section.key] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {expandedSections[section.key] ? 'Hide' : 'Show'} Original Resume Content
                  </button>
                  {expandedSections[section.key] && (
                    <pre className="bg-slate-900/60 p-2 rounded text-blue-100 text-xs whitespace-pre-wrap mb-2 max-h-40 overflow-auto">{section.value}</pre>
                  )}
                </div>
                <div className="mb-2">
                  <div className="text-xs text-purple-400 font-bold mb-1">AI Feedback</div>
                  <div className="text-blue-300 text-sm">
                    {(() => {
                      const fb = result.feedback?.[section.key];
                      if (!fb) return null;
                      if (typeof fb === 'string') return fb;
                      if (typeof fb === 'object' && fb !== null) {
                        return (
                          <div>
                            {fb.original && (
                              <div><span className="font-bold text-blue-400">Original:</span> <span>{fb.original}</span></div>
                            )}
                            {fb.feedback && (
                              <div><span className="font-bold text-purple-400">Feedback:</span> <span>{fb.feedback}</span></div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                {/* Show AI suggestion for this section */}
                {aiSuggestion && enhancedSection === section.key && (
                  <GlassmorphismCard className="mt-2 p-3 bg-slate-900 border border-blue-400 rounded-xl" variant="secondary">
                    <div className="font-bold text-blue-300 mb-2">AI-Enhanced Suggestion:</div>
                    <div className="text-white whitespace-pre-line text-xs">{aiSuggestion}</div>
                    <button
                      className="mt-2 px-4 py-2 bg-blue-700 rounded text-white text-xs"
                      onClick={() => {
                        setAISuggestion(null);
                        setEnhancedSection(null);
                      }}
                    >
                      Close
                    </button>
                  </GlassmorphismCard>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Improvements */}
        <div>
          <GlassmorphismCard className="p-6 bg-gradient-to-br from-blue-900/60 via-purple-900/60 to-slate-900/60 border border-blue-400/20 shadow-xl flex flex-col gap-3 mt-8" variant="accent">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-yellow-200 text-lg">AI Suggestions for Improvement</span>
            </div>
            <ul className="list-disc list-inside text-blue-100 text-base pl-2">
              {(result.improvements || []).map((imp: string, i: number) => (
                <li key={i}>{imp}</li>
              ))}
            </ul>
          </GlassmorphismCard>
        </div>
      </GlassmorphismCard>

      {/* Company Vibe Check */}
      {result.company_vibe && result.company_vibe.analysis && (
        <GlassmorphismCard>
          <div className="flex items-center text-xl font-bold text-cyan-300 mb-3">
            <Building className="w-6 h-6 mr-3 text-cyan-400" />
            Company Vibe Check
          </div>
          <p className="text-blue-200 mb-4 italic">{result.company_vibe.analysis}</p>
          <div className="mb-4">
            <h4 className="font-semibold text-lg mb-2 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-300" />
              Key Values Identified:
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.company_vibe.keywords?.map((kw: string) => (
                <span key={kw} className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm">
                  {kw}
                </span>
              )) || <span className="text-gray-400">No specific keywords identified.</span>}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-300" />
              Suggestions to Align:
            </h4>
            <ul className="list-disc list-inside space-y-2 text-blue-200 pl-2">
              {result.company_vibe.suggestions?.map((s: string, i: number) => <li key={i}>{s}</li>) || (
                <li className="text-gray-400">No specific suggestions available.</li>
              )}
            </ul>
          </div>
        </GlassmorphismCard>
      )}

      {/* Industry Benchmark */}
      {result.industry_benchmark && result.industry_benchmark.summary && (
        <GlassmorphismCard>
          <div className="flex items-center text-xl font-bold text-purple-300 mb-3">
            <Scale className="w-6 h-6 mr-3 text-purple-400" />
            How You Compare (Industry Benchmark)
          </div>
          <p className="text-blue-200 mb-4 italic">{result.industry_benchmark.summary}</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-lg mb-2 flex items-center text-green-300">
                <Trophy className="w-5 h-5 mr-2" />
                Your Strengths vs. Benchmark
              </h4>
              <ul className="list-disc list-inside space-y-2 text-blue-200 pl-2">
                {result.industry_benchmark.strengths_vs_benchmark?.map((s: string, i: number) => <li key={i}>{s}</li>) || (
                  <li className="text-gray-400">No specific strengths identified.</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2 flex items-center text-yellow-300">
                <TrendingUp className="w-5 h-5 mr-2" />
                Growth Opportunities
              </h4>
              <ul className="list-disc list-inside space-y-2 text-blue-200 pl-2">
                {result.industry_benchmark.gaps_vs_benchmark?.map((s: string, i: number) => <li key={i}>{s}</li>) || (
                  <li className="text-gray-400">No specific gaps identified.</li>
                )}
              </ul>
            </div>
          </div>
        </GlassmorphismCard>
      )}

      <GlassmorphismCard>
        <h3 className="text-xl font-bold text-green-300 mb-3 flex items-center">
          <Sparkles className="w-6 h-6 mr-3 text-green-400" />
          Resume Summary
        </h3>
        <p className="text-blue-200 text-base">{result.summary}</p>
      </GlassmorphismCard>
    </div>
  );
}; 