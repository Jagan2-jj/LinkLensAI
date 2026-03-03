import React, { useEffect, useRef, useState } from 'react';
import {
  Linkedin, Info, BookOpen, Briefcase, Sparkles, GraduationCap, Lightbulb, ArrowLeft, Trophy, Star, Award, BarChart2, CheckCircle, XCircle, Activity, Wand2, User
} from 'lucide-react';
import { GlassmorphismCard } from './GlassmorphismCard';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import ConfettiBackground from './confetti-background';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';

interface ResultsPanelProps {
  analysis: any; // Accepts the new Gemini JSON structure
  onBack: () => void;
}

const sectionMeta = [
  { key: 'summary', label: 'Summary', icon: <BookOpen className="w-6 h-6 text-blue-400" /> },
  { key: 'experience', label: 'Experience', icon: <Briefcase className="w-6 h-6 text-purple-400" /> },
  { key: 'skills', label: 'Skills', icon: <Sparkles className="w-6 h-6 text-green-400" /> },
  { key: 'education', label: 'Education', icon: <GraduationCap className="w-6 h-6 text-yellow-400" /> },
];

// Typewriter effect for guide
function useTypewriter(text: string, speed: number = 30, resetKey?: any) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      setDisplayed(t => t + text[i]);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, resetKey]);
  return displayed;
}

// Tooltip component
const TooltipInfo: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block align-middle"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
    >
      {children}
      {show && (
        <span className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 px-4 py-2 bg-white/80 text-slate-900 text-xs font-semibold rounded-xl shadow-xl border border-blue-400/20 backdrop-blur-xl whitespace-pre-line min-w-[180px] max-w-xs animate-fade-in pointer-events-none">
          {text}
        </span>
      )}
    </span>
  );
};

// Add a function to clean AI responses (same as in AIAgent)
function cleanAIResponse(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold**
    .replace(/\*([^*]+)\*/g, '$1')       // *italic*
    .replace(/`([^`]+)`/g, '$1')           // `code`
    .replace(/^\*+|\*+$/g, '')           // leading/trailing *
    .replace(/^- /gm, '')                  // leading - for bullet points
    .replace(/^\s+|\s+$/g, '');          // trim
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ analysis, onBack }) => {
  // Animated score
  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = analysis.overallScore || analysis.score || 0;
    const duration = 1200;
    const startTime = performance.now();
    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = start + (end - start) * progress;
      setAnimatedScore(parseFloat(value.toFixed(1)));
      if (progress < 1) requestAnimationFrame(animate);
    }
    animate(performance.now());
  }, [analysis.overallScore, analysis.score]);

  // Badges
  const badges = [];
  if ((analysis.overallScore || analysis.score) >= 85) {
    badges.push({ name: 'Profile Pro', icon: <Trophy className="w-6 h-6 text-yellow-300 animate-bounce" />, color: 'bg-gradient-to-r from-yellow-400 to-orange-400' });
  }
  if ((analysis.engagement || 0) >= 80) {
    badges.push({ name: 'Engagement Star', icon: <Star className="w-6 h-6 text-pink-300 animate-pulse" />, color: 'bg-gradient-to-r from-pink-400 to-purple-400' });
    }
  if ((analysis.keywords?.length || 0) >= 7) {
    badges.push({ name: 'Keyword Guru', icon: <Sparkles className="w-6 h-6 text-blue-300 animate-spin-slow" />, color: 'bg-gradient-to-r from-blue-400 to-cyan-400' });
  }
  if ((analysis.completeness || 0) >= 90 || (analysis.completenessChecklist && Object.values(analysis.completenessChecklist).every(Boolean))) {
    badges.push({ name: 'All-Star', icon: <Award className="w-6 h-6 text-green-300 animate-bounce" />, color: 'bg-gradient-to-r from-green-400 to-emerald-400' });
  }

  // Section data
  const sectionData = sectionMeta.map(meta => ({
    ...meta,
    ...(analysis[meta.key] || { score: 0, strengths: [], improvements: [], content: '' }),
    industryAvg: analysis.industryAverages?.[meta.key],
  }));

  // Next Steps
  const allImprovements = sectionMeta.flatMap(s => (analysis[s.key]?.improvements || []));
  const nextSteps = allImprovements.slice(0, 3);

  // Completeness checklist
  const completeness = analysis.completenessChecklist || {};
  const completenessItems = Object.entries(completeness);

  // Keywords
  const presentKeywords = analysis.keywords || [];
  const missingKeywords = analysis.missingKeywords || [];

  // Recent activity
  const recentActivity = analysis.recentActivity || {};

  // Percentile
  const percentile = analysis.percentile;

  // Industry averages
  const industryAverages = analysis.industryAverages || {};

  // TEMP: Add mock industry averages if missing (for testing)
  if (!industryAverages.summary) {
    industryAverages.summary = 70;
    industryAverages.experience = 75;
    industryAverages.skills = 80;
    industryAverages.education = 85;
    industryAverages.overall = 78;
    analysis.industryAverages = industryAverages;
  }

  // Timestamp
  const timestamp = analysis.timestamp || new Date();

  // Determine LinkedIn user's name for welcome
  let linkedInName = analysis.fullName || analysis.name || '';
  if (!linkedInName && analysis.summary && typeof analysis.summary.content === 'string') {
    // Try to extract a name from the summary if it looks like a name
    const firstLine = analysis.summary.content.split('\n')[0];
    if (firstLine && firstLine.split(' ').length <= 5 && /^[A-Z][a-z]+( [A-Z][a-z]+)+$/.test(firstLine.trim())) {
      linkedInName = firstLine.trim();
    }
  }
  if (!linkedInName) {
    try {
      const user = JSON.parse(localStorage.getItem('linklens_user') || '{}');
      if (user && user.name) linkedInName = user.name;
    } catch {}
  }
  // Fallback: extract a name from the LinkedIn profile URL if all else fails
  if (!linkedInName && analysis.profileUrl) {
    const match = analysis.profileUrl.match(/linkedin\.com\/in\/([^/?#]+)/i);
    if (match) {
      let name = match[1].replace(/[-_]/g, ' ').replace(/\d+/g, '');
      name = name.replace(/\b\w/g, (c: string) => c.toUpperCase());
      linkedInName = name.trim();
    }
  }
  // Do NOT fallback to email; if no name, leave as empty string for generic welcome

  // AI Enhancement State
  const [enhancingSection, setEnhancingSection] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [aiError, setAiError] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Helper to get profile context for AI
  const getProfileContext = () => {
    // Use all section contents as context
    const context: Record<string, any> = {};
    sectionMeta.forEach(meta => {
      context[meta.key] = analysis[meta.key]?.content || '';
      });
    context.fullName = analysis.fullName || analysis.name || '';
    context.industry = analysis.industry || '';
    context.keywords = analysis.keywords || [];
    return context;
  };

  // Enhance section with AI
  const handleEnhance = async (sectionKey: string, sectionLabel: string, currentContent: string) => {
    setEnhancingSection(sectionKey);
    setAiSuggestion('');
    setAiError('');
    setAiLoading(true);
    try {
      const prompt = `Rewrite the following LinkedIn ${sectionLabel} section to maximize its score and impact. Make it more compelling, keyword-rich, and professional. Return only the improved text.\nSection: ${currentContent}\nProfile context: ${JSON.stringify(getProfileContext())}`;
      const res = await fetch('http://localhost:3001/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok || !data.response) {
        setAiError(data.response || 'AI enhancement failed');
      } else {
        setAiSuggestion(data.response.trim());
      }
    } catch (err) {
      setAiError('AI enhancement failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // Profile photo (if available)
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('linklens_user') || '{}');
    } catch { return {}; }
  })();
  // Prefer analysis.picture (from LinkedIn API), then user.picture, then default
  const [photoUrl, setPhotoUrl] = useState(analysis.picture || user?.picture || 'https://static.licdn.com/scds/common/u/images/themes/katy/ghosts/person/ghost_person_80x80_v1.png');
  const [refreshingPhoto, setRefreshingPhoto] = useState(false);
  const handleRefreshPhoto = async () => {
    setRefreshingPhoto(true);
    try {
      const userObj = JSON.parse(localStorage.getItem('linklens_user') || '{}');
      const accessToken = userObj?.linkedinAccessToken;
      if (!accessToken) throw new Error('No LinkedIn access token');
      const res = await fetch('http://localhost:3001/api/linkedin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      const profile = await res.json();
      if (profile.picture) {
        setPhotoUrl(profile.picture);
        // Update localStorage user object
        userObj.picture = profile.picture;
        localStorage.setItem('linklens_user', JSON.stringify(userObj));
      }
    } catch {}
    setRefreshingPhoto(false);
  };

  // Radar Chart Modal State
  const [showRadar, setShowRadar] = useState(false);
  const [showRadarGuide, setShowRadarGuide] = useState(false);
  // Remove neverShowRadarGuide state and logic

  // Radar chart guide text
  const radarGuideText =
    `A Radar Chart (also called a Spider Chart) is a visual tool that helps you compare your LinkedIn profile sections—Summary, Experience, Skills, and Education—against industry averages.\n\nEach axis represents a section. The blue area shows your scores; the purple area shows the industry average.\n\nLook for areas where your profile stands out or needs improvement. Aim for a balanced, filled shape!`;
  const radarGuideTyped = useTypewriter(radarGuideText, 18, showRadarGuide);

  // Enhanced Radar Button Handler
  const handleRadarButtonClick = () => {
    setShowRadarGuide(true);
  };

  // Remove handleNeverShowRadarGuide

  // Handler for "Continue to Radar Chart"
  const handleContinueRadar = () => {
    setShowRadarGuide(false);
    setShowRadar(true);
  };

  // Radar chart data
  const radarLabels = sectionMeta.map(s => s.label);
  const userScores = sectionMeta.map(s => (analysis[s.key]?.score ?? 0));
  const industryScores = sectionMeta.map(s => (analysis.industryAverages?.[s.key] ?? null));
  // Debug log for chart data
  console.log('Radar Chart Data:', { userScores, industryScores });
  const hasIndustry = industryScores.some(v => typeof v === 'number');
  const hasUserScores = userScores.some(v => typeof v === 'number');
  const radarDatasets = [
    {
      label: 'Your Score',
      data: userScores,
      backgroundColor: 'rgba(59,130,246,0.25)', // blue-500, more visible
      borderColor: 'rgba(59,130,246,0.95)',     // blue-500, strong
      borderWidth: 4,
      pointBackgroundColor: 'rgba(59,130,246,1)',
      pointBorderColor: '#fff',
      pointRadius: 6,
      pointHoverRadius: 8,
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(59,130,246,1)',
    }
  ];
  if (hasIndustry) {
    radarDatasets.push({
      label: 'Industry Avg',
      data: industryScores,
      backgroundColor: 'rgba(168,139,250,0.18)', // purple-400, more visible
      borderColor: 'rgba(168,139,250,0.95)',     // purple-400, strong
      borderWidth: 4,
      pointBackgroundColor: 'rgba(168,139,250,1)',
      pointBorderColor: '#fff',
      pointRadius: 6,
      pointHoverRadius: 8,
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(168,139,250,1)',
    });
  }
  const radarData = {
    labels: radarLabels,
    datasets: radarDatasets,
  };
  const radarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#1e293b', // slate-800
          font: { size: 16, weight: 700 },
        },
      },
      tooltip: { enabled: true },
    },
    scales: {
      r: {
        angleLines: { display: true, color: 'rgba(59,130,246,0.25)' },
        suggestedMin: 0,
        suggestedMax: 100,
        pointLabels: { font: { size: 18, weight: 700 }, color: '#1e293b' },
        ticks: { stepSize: 20, color: '#1e293b', font: { size: 14, weight: 700 } },
        grid: { color: 'rgba(59,130,246,0.13)' },
      },
    },
  };

  ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 relative">
      {/* Confetti Background */}
      <ConfettiBackground />
      {/* Animated background blobs */}
      <div className="absolute -z-10 inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500 opacity-20 rounded-full blur-3xl animate-blob1" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-500 opacity-20 rounded-full blur-3xl animate-blob2" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 opacity-10 rounded-full blur-2xl animate-blob3" />
      </div>
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 py-6 px-4 md:px-10 bg-gradient-to-r from-blue-900/60 via-purple-900/60 to-slate-900/60 rounded-3xl shadow-xl border border-blue-400/20 animate-float">
        <div className="flex items-center gap-6">
          {photoUrl ? (
            <div className="relative">
              <img src={photoUrl} alt={linkedInName || 'LinkedIn profile photo'} className="w-20 h-20 rounded-full border-4 border-blue-400 shadow-lg object-cover bg-white" />
              <button
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 shadow-lg border-2 border-white transition-all"
                style={{ width: 32, height: 32 }}
                onClick={handleRefreshPhoto}
                disabled={refreshingPhoto}
                title="Refresh LinkedIn Photo"
              >
                {refreshingPhoto ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M4 4v5h.582M20 20v-5h-.581M5.07 19.07A9 9 0 1 1 12 21a9 9 0 0 1-6.93-1.93M19.07 4.93A9 9 0 0 0 12 3a9 9 0 0 0-6.93 1.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-900 flex items-center justify-center border-4 border-blue-400 shadow-lg">
              <User className="w-10 h-10 text-blue-300" />
            </div>
          )}
          <div>
            <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse drop-shadow-glow">
              {linkedInName ? `Welcome, ${linkedInName}!` : 'Welcome!'}
            </div>
            <div className="text-blue-200 text-lg font-medium mt-1">
              {analysis.industry ? `Industry: ${analysis.industry}` : ''}
            </div>
            <div className="text-xs text-gray-400 mt-1">Analyzed: {new Date(timestamp).toLocaleString()}</div>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <a
            href={analysis.profileUrl?.startsWith('http') ? analysis.profileUrl : `https://${analysis.profileUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Linkedin className="w-5 h-5 mr-2 text-blue-200" /> View Profile
          </a>
          {/* Enhanced Radar Chart Button (replaces Back button) */}
          {hasUserScores && hasIndustry && (
            <button
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow hover:from-blue-700 hover:to-purple-700 transition-all mt-3"
              onClick={handleRadarButtonClick}
              style={{ letterSpacing: 0.5 }}
            >
              <BarChart2 className="w-5 h-5 text-yellow-300 mr-2" />
              Show Radar Chart
            </button>
          )}
        </div>
      </div>
      {/* Radar Chart Guide Modal (typewriter effect) */}
      {showRadarGuide && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" onClick={() => setShowRadarGuide(false)} />
          {/* Card */}
          <div className="relative z-10 flex items-center justify-center w-full h-full px-2 sm:px-0">
            <GlassmorphismCard className="max-w-lg w-full p-0 overflow-hidden animate-fade-in relative" variant="primary" glowEffect>
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 text-blue-700 hover:text-purple-600 bg-white/80 rounded-full p-2 shadow-lg text-2xl font-bold z-20 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => setShowRadarGuide(false)}
                aria-label="Close"
              >
                ×
              </button>
              {/* Content */}
              <div className="flex flex-col items-center gap-6 px-8 py-10 sm:py-12">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-yellow-100 text-center mb-1 drop-shadow-glow">How the Radar Chart Works</h2>
                <div className="text-yellow-100 text-base sm:text-lg font-medium text-center min-h-[120px] whitespace-pre-line animate-fade-in" style={{lineHeight:1.7}}>
                  <span>{radarGuideTyped}</span>
                  {radarGuideTyped.length < radarGuideText.length && <span className="animate-pulse">|</span>}
                </div>
                <button
                  className="px-7 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg mt-2"
                  onClick={handleContinueRadar}
                  disabled={radarGuideTyped.length < radarGuideText.length}
                >
                  Continue to Radar Chart
                </button>
              </div>
            </GlassmorphismCard>
          </div>
        </div>
      )}
      {/* Radar Chart Modal */}
      {showRadar && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" onClick={() => setShowRadar(false)} />
          {/* Card */}
          <div className="relative z-10 flex items-center justify-center w-full h-full px-2 sm:px-0">
            <GlassmorphismCard className="max-w-lg w-full p-0 overflow-hidden animate-fade-in relative" variant="primary" glowEffect>
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 text-blue-700 hover:text-purple-600 bg-white/80 rounded-full p-2 shadow-lg text-2xl font-bold z-20 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => setShowRadar(false)}
                aria-label="Close"
              >
                ×
              </button>
              {/* Content */}
              <div className="flex flex-col items-center gap-6 px-8 py-10 sm:py-12">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-yellow-100 text-center mb-1 drop-shadow-glow">Profile Radar Chart</h2>
                <p className="text-base sm:text-lg text-yellow-100 text-center mb-2 max-w-md">See how your LinkedIn profile sections compare to industry averages. Each axis shows your score for a key section—aim for a balanced, filled shape!</p>
                {/* Radar Chart Area */}
                <div className="w-full flex justify-center items-center mb-4">
                  <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-xs sm:max-w-sm">
                    <Radar
                      data={radarData}
                      options={radarOptions}
                      style={{ background: '#fff', borderRadius: '1rem' }}
                    />
                  </div>
                </div>
              </div>
            </GlassmorphismCard>
          </div>
        </div>
      )}
      {/* Score Card */}
      <GlassmorphismCard className="p-10 text-center max-w-xl mx-auto animate-float" variant="primary" glowEffect>
        <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-40 h-40 flex items-center justify-center mb-2">
            <svg width="160" height="160" viewBox="0 0 160 160" className="absolute top-0 left-0">
              <circle cx="80" cy="80" r="70" stroke="#334155" strokeWidth="14" fill="none" />
              <circle
                cx="80" cy="80" r="70"
                stroke="url(#score-gradient)"
                strokeWidth="14"
                fill="none"
                strokeDasharray={2 * Math.PI * 70}
                strokeDashoffset={2 * Math.PI * 70 * (1 - (isNaN(animatedScore) ? 0 : animatedScore) / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
              />
              <defs>
                <linearGradient id="score-gradient" x1="0" y1="0" x2="160" y2="160">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center text-6xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-glow">
              {animatedScore.toFixed(1)}
              <span className="text-lg text-blue-200 font-semibold">/100</span>
            </span>
          </div>
          <div className="text-2xl font-bold text-white mb-1 flex items-center gap-2 justify-center">
            Overall Profile Score
            <TooltipInfo text="This is your overall LinkedIn profile score, based on all sections and industry benchmarks.">
              <Info className="w-4 h-4 text-blue-300 cursor-pointer hover:text-blue-400" />
            </TooltipInfo>
          </div>
          {typeof percentile === 'number' && (
            <div className="text-blue-300 text-base mb-1">Top {percentile}% in your industry</div>
          )}
          {industryAverages.overall && (
            <div className="text-blue-200 text-xs mb-1">Industry average: {industryAverages.overall}/100</div>
          )}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {badges.map(b => (
                <span key={b.name} className={`flex items-center gap-2 px-3 py-1 rounded-full text-base font-semibold text-white shadow ${b.color} hover:scale-105 transition-transform`} title={b.name}>
                  {b.icon} {b.name}
                  <TooltipInfo text={`Badge: ${b.name}\n${b.name === 'Profile Pro' ? 'Awarded for an overall score of 85+.' : b.name === 'Engagement Star' ? 'Awarded for high engagement.' : b.name === 'Keyword Guru' ? 'Awarded for using many relevant keywords.' : b.name === 'All-Star' ? 'Awarded for profile completeness.' : ''}`}>
                    <Info className="w-4 h-4 text-yellow-100 cursor-pointer hover:text-yellow-200" />
                  </TooltipInfo>
                </span>
              ))}
            </div>
          )}
          </div>
        </GlassmorphismCard>
      {/* Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sectionData.map((section, idx) => (
          <GlassmorphismCard key={section.label} className="p-7 flex flex-col gap-4 animate-float" variant="secondary">
            <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
            <div className="flex items-center gap-2 mb-1">
              {section.icon}
              <span className="text-xl font-bold text-white flex items-center gap-1">
                {section.label}
                <TooltipInfo text={`This is your ${section.label} section score. It reflects how well your ${section.label.toLowerCase()} stands out to recruiters and matches industry best practices.`}>
                  <Info className="w-4 h-4 text-blue-300 cursor-pointer hover:text-blue-400" />
                </TooltipInfo>
              </span>
              <span className={`ml-auto font-bold text-lg px-3 py-1 rounded-full ${section.score >= 80 ? 'bg-green-500/20 text-green-300' : section.score >= 60 ? 'bg-yellow-500/20 text-yellow-200' : 'bg-red-500/20 text-red-300'}`}>{section.score}/100</span>
            </div>
            {/* Progress Bar for Section Score */}
            <div className="w-full mb-2 flex items-center gap-2">
              <div className="relative h-5 flex-1 rounded-xl overflow-hidden bg-gradient-to-r from-slate-800/60 via-slate-700/60 to-slate-800/60 shadow-inner border border-white/10">
                <div
                  className={`absolute left-0 top-0 h-full rounded-xl transition-all duration-700 ease-in-out ${section.score >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' : section.score >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
                  style={{ width: `${Math.max(0, Math.min(100, section.score))}%` }}
                />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white drop-shadow-glow select-none">
                  {section.score}/100
                </span>
              </div>
              <TooltipInfo text="This bar shows your score for this section. Aim for green!">
                <Info className="w-4 h-4 text-blue-300 cursor-pointer hover:text-blue-400 ml-1" />
              </TooltipInfo>
            </div>
            {typeof section.industryAvg === 'number' && (
              <div className="text-blue-200 text-xs mb-1">Industry avg: {section.industryAvg}/100</div>
            )}
            {/* Enhance with AI Button */}
            <div className="flex gap-2 mb-2">
              <button
                className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-xs font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 animate-pulse"
                onClick={() => handleEnhance(sectionMeta[idx].key, sectionMeta[idx].label, Array.isArray(section.content) ? section.content.join('\n') : section.content || '')}
                disabled={aiLoading && enhancingSection !== sectionMeta[idx].key}
              >
                <Wand2 className="w-4 h-4" />
                {aiLoading && enhancingSection === sectionMeta[idx].key ? 'Enhancing...' : 'Enhance with AI'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-1">
              {section.strengths?.length > 0 && section.strengths.map((s: string, i: number) => (
                <span key={i} className="px-2 py-1 bg-green-500/10 text-green-300 rounded-full text-xs font-medium">{s}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-1">
              {section.improvements?.length > 0 && section.improvements.map((s: string, i: number) => (
                <span key={i} className="px-2 py-1 bg-yellow-500/10 text-yellow-200 rounded-full text-xs font-medium flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 inline" /> {s}
                </span>
              ))}
            </div>
            {/* Section Content */}
            <div className="mt-2">
              <div className="text-blue-400 font-medium mb-1">Section Content:</div>
              {Array.isArray(section.content) ? (
                <ul className="list-disc list-inside text-blue-200 text-sm space-y-1">
                  {section.content.map((c: string, i: number) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-blue-200 text-sm whitespace-pre-line">{section.content || <span className="text-gray-400">No content provided.</span>}</div>
              )}
            </div>
            {/* AI Suggestion Inline */}
            {enhancingSection === sectionMeta[idx].key && (
              <div className="mt-3 p-3 rounded-xl bg-blue-900/60 border border-blue-500/30 text-blue-100 text-sm relative animate-fade-in">
                {aiLoading ? (
                  <span className="text-blue-300 animate-pulse">Generating enhanced {section.label}...</span>
                ) : aiError ? (
                  <span className="text-red-400">{aiError}</span>
                ) : aiSuggestion ? (
                  <>
                    <div className="font-semibold mb-1 text-blue-300">AI-Enhanced {section.label}:</div>
                    <div className="whitespace-pre-wrap break-all mb-2 overflow-x-auto max-w-full" style={{ wordBreak: 'break-all' }}>
                      {cleanAIResponse(aiSuggestion)}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-xs font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition-all"
                        onClick={() => {
                          navigator.clipboard.writeText(cleanAIResponse(aiSuggestion));
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </>
                ) : null}
                </div>
            )}
          </GlassmorphismCard>
              ))}
            </div>
      {/* Profile Completeness Checklist */}
      {completenessItems.length > 0 && (
        <GlassmorphismCard className="p-6" variant="primary">
          <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            <span className="text-lg font-bold text-white">Profile Completeness</span>
          </div>
          <ul className="flex flex-wrap gap-4">
            {completenessItems.map(([item, complete]) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                {complete
                  ? <CheckCircle className="w-4 h-4 text-green-400" />
                  : <XCircle className="w-4 h-4 text-red-400" />}
                <span className={complete ? 'text-green-300' : 'text-red-300'}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </span>
              </li>
            ))}
          </ul>
        </GlassmorphismCard>
      )}
      {/* Keywords Panel */}
      <GlassmorphismCard className="p-6" variant="primary">
        <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-lg font-bold text-white">Keywords</span>
            <button
              className="ml-auto px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-xs font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition-all"
              onClick={() => navigator.clipboard.writeText(presentKeywords.join(', '))}
            >
              Copy All
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-1">
            {presentKeywords.map((kw: string, idx: number) => (
              <span key={idx} className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm">
                {kw}
              </span>
            ))}
          </div>
          {missingKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-red-400 font-medium">Missing:</span>
              {missingKeywords.map((kw: string, idx: number) => (
                <span key={idx} className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-300 text-sm">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      </GlassmorphismCard>
      {/* Recent Activity */}
      {recentActivity && (
        <GlassmorphismCard className="p-6" variant="secondary">
          <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-pink-400" />
            <span className="text-lg font-bold text-white">Recent Activity</span>
          </div>
          <div className="text-blue-200 text-sm">
            <span className="font-semibold">Your posts/month:</span> {recentActivity.postsPerMonth ?? 'N/A'}
            <span className="mx-2">|</span>
            <span className="font-semibold">Industry avg:</span> {recentActivity.industryAvgPosts ?? 'N/A'}
          </div>
        </GlassmorphismCard>
      )}
      {/* Next Steps Checklist */}
      {nextSteps.length > 0 && (
        <GlassmorphismCard className="p-6" variant="accent">
          <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-6 h-6 text-yellow-400" />
            <span className="text-xl font-bold text-white">Next Steps</span>
          </div>
          <ol className="list-decimal list-inside text-gray-200 text-base space-y-2">
            {nextSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </GlassmorphismCard>
      )}
      <style>{`
        .drop-shadow-glow { filter: drop-shadow(0 0 8px #fff7) drop-shadow(0 0 16px #fff3); }
        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        @keyframes blob1 { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(-40px) scale(1.1);} }
        @keyframes blob2 { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(40px) scale(1.1);} }
        @keyframes blob3 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-30px,30px) scale(1.08);} }
        .animate-blob1 { animation: blob1 8s infinite ease-in-out; }
        .animate-blob2 { animation: blob2 10s infinite ease-in-out; }
        .animate-blob3 { animation: blob3 12s infinite ease-in-out; }
        .animate-float { animation: floatCard 8s ease-in-out infinite; }
        @keyframes floatCard { 0%, 100% { transform: translateY(0) scale(1.01); } 50% { transform: translateY(-18px) scale(1.04); } }
        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.4,0,0.2,1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
};