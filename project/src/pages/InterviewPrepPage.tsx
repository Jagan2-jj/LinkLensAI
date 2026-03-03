import React, { useMemo, useRef, useState } from 'react';
import { GlassmorphismCard } from '@/components/GlassmorphismCard';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { useInterviewPrep } from '@/hooks/useInterviewPrep';
import { useAuth } from '@/hooks/useAuth';
import ConfettiBackground from '@/components/confetti-background';
import { Sparkles, Timer, Save, Play, RotateCcw, ListChecks, Target, BookOpen, BarChart2 } from 'lucide-react';

const InterviewPrepPage: React.FC = () => {
  const { user } = useAuth();
  const [role, setRole] = useState('Software Engineer');
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { state, actions } = useInterviewPrep({ targetRole: role, numQuestions: 8 });
  const { currentQuestion, currentIndex, questions, timeLeft, progress, loading, error, answers } = state as any;

  const currentResult = useMemo(() => {
    if (!currentQuestion) return null;
    const a = answers.find((x: any) => x.questionId === currentQuestion.id);
    return a?.result || null;
  }, [answers, currentQuestion]);

  const avgScore = useMemo(() => {
    const s = answers.map((a: any) => a.result?.score).filter((n: any) => typeof n === 'number');
    if (!s.length) return 0;
    return Math.round(s.reduce((a: number, b: number) => a + b, 0) / s.length);
  }, [answers]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) {
        await actions.submitAnswer(input.trim());
        setInput('');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <ConfettiBackground />
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Top Controls */}
        <GlassmorphismCard className="p-4 md:p-6 mb-6" variant="primary" glowEffect>
          <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-blue-300 mb-1 flex items-center gap-2"><Target className="w-4 h-4" /> Target Role</div>
              <input
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/60 border border-blue-400/30 rounded-xl text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Frontend Engineer"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => actions.generate({ targetRole: role })}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold shadow hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> {loading ? 'Generating...' : questions.length ? 'Regenerate' : 'Generate'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!user?.email) return;
                  setSaving(true);
                  try { await actions.saveSession(user.email); } finally { setSaving(false); }
                }}
                disabled={!user?.email || !questions.length || saving}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-semibold shadow hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Session'}
              </button>
            </div>
          </div>
          {error && <div className="text-red-400 mt-3">{error}</div>}
        </GlassmorphismCard>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left/Main: Q&A */}
          <div className="lg:col-span-2 space-y-6">
            <GlassmorphismCard className="p-6" variant="secondary">
              <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-blue-200">
                  <BookOpen className="w-4 h-4" />
                  {currentQuestion ? (
                    <>
                      <span className="uppercase tracking-wider">{currentQuestion.type}</span>
                      {currentQuestion.competency && <span>• {currentQuestion.competency}</span>}
                      {currentQuestion.difficulty && <span>• {currentQuestion.difficulty}</span>}
                    </>
                  ) : (
                    <span>Generate questions to begin</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-yellow-300"><Timer className="w-4 h-4" /> {timeLeft}s</div>
              </div>
              <div className="min-h-[64px] text-xl font-bold mb-4">
                {currentQuestion ? currentQuestion.text : 'No question loaded'}
              </div>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={6}
                placeholder={currentQuestion ? 'Type your answer here. Press Enter to submit, Shift+Enter for new line.' : 'Generate questions first.'}
                className="w-full px-3 py-3 bg-slate-900/60 border border-blue-400/30 rounded-xl text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => { setInput(''); textareaRef.current?.focus(); }}
                  className="px-3 py-2 bg-slate-800 rounded-lg border border-slate-700 text-blue-200 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
                <button
                  type="button"
                  disabled={loading || !input.trim() || !currentQuestion}
                  onClick={async () => {
                    await actions.submitAnswer(input.trim());
                    setInput('');
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold shadow hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> {loading ? 'Scoring...' : currentIndex < Math.max(questions.length - 1, 0) ? 'Submit & Next' : 'Submit'}
                </button>
              </div>
            </GlassmorphismCard>

            {/* Resources & Tips */}
            <GlassmorphismCard className="p-6" variant="primary">
              <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
              <div className="flex items-center gap-2 mb-3 text-lg font-bold"><ListChecks className="w-5 h-5 text-yellow-300" /> Tips & Resources</div>
              <ul className="list-disc list-inside text-blue-200 space-y-1">
                <li>Use STAR (Situation, Task, Action, Result) for behavioral questions.</li>
                <li>Quantify impact when possible (e.g., “reduced latency by 35%”).</li>
                <li>Mirror job description keywords in your answers.</li>
              </ul>
            </GlassmorphismCard>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <GlassmorphismCard className="p-6" variant="primary">
              <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-blue-200">Progress</div>
                <div className="text-sm text-blue-200">{questions.length ? `Q ${Math.min(currentIndex + 1, questions.length)} / ${questions.length}` : '—'}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-28 h-28">
                  <svg width="112" height="112" viewBox="0 0 112 112" className="absolute">
                    <circle cx="56" cy="56" r="48" stroke="#334155" strokeWidth="12" fill="none" />
                    <circle
                      cx="56" cy="56" r="48"
                      stroke="url(#g)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={2 * Math.PI * 48 * (1 - (progress || 0) / 100)}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
                    />
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="112" y2="112">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#a78bfa" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{progress}%</div>
                    <div className="text-xs text-blue-300">Complete</div>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-900/60 border border-blue-400/20 p-3">
                    <div className="text-xs text-blue-300">Avg. Score</div>
                    <div className="text-lg font-bold text-green-300">{avgScore || 0}</div>
                  </div>
                  <div className="rounded-xl bg-slate-900/60 border border-blue-400/20 p-3">
                    <div className="text-xs text-blue-300">Answered</div>
                    <div className="text-lg font-bold text-blue-200">{answers.length}</div>
                  </div>
                </div>
              </div>
            </GlassmorphismCard>

            {/* Queue */}
            <GlassmorphismCard className="p-6" variant="secondary">
              <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
              <div className="flex items-center gap-2 mb-3 text-lg font-bold"><BarChart2 className="w-5 h-5 text-green-300" /> Question Queue</div>
              <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
                {questions.map((q: any, i: number) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => actions.setCurrentIndex(i)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${i === currentIndex ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-900/60 border-blue-400/20 text-blue-200 hover:bg-slate-900/80'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold truncate">Q{i + 1}: {q.text}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30">{(q.type || '').toUpperCase()}</span>
                      {q.difficulty && <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30">{q.difficulty}</span>}
                      {q.competency && <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30">{q.competency}</span>}
                    </div>
                  </button>
                ))}
                {!questions.length && <div className="text-blue-300 text-sm">No questions yet.</div>}
              </div>
            </GlassmorphismCard>

            {/* Live Feedback */}
            <GlassmorphismCard className="p-6" variant="primary">
              <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
              <div className="flex items-center gap-2 mb-3 text-lg font-bold"><ListChecks className="w-5 h-5 text-purple-300" /> Live Feedback</div>
              {currentResult ? (
                <div>
                  <div className="text-sm text-blue-300">Score</div>
                  <div className="text-2xl font-extrabold text-green-300">{currentResult.score}/100</div>
                  {!!currentResult.feedback?.length && (
                    <div className="mt-3">
                      <div className="text-sm text-blue-300 mb-1">Feedback</div>
                      <ul className="list-disc list-inside text-blue-200 space-y-1">
                        {currentResult.feedback.map((f: string, i: number) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}
                  {!!currentResult.tips?.length && (
                    <div className="mt-3">
                      <div className="text-sm text-blue-300 mb-1">Tips</div>
                      <ul className="list-disc list-inside text-blue-200 space-y-1">
                        {currentResult.tips.map((t: string, i: number) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-blue-300 text-sm">Answer a question to see AI feedback here.</div>
              )}
            </GlassmorphismCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPrepPage;


