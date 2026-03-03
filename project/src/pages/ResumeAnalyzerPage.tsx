import React, { useState, useRef, useEffect } from 'react';
import { Header } from '../components/Header';
import { GlassmorphismCard } from '../components/GlassmorphismCard';
import { ArrowLeft, FileText, UploadCloud, ClipboardList, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResumeResultsPanel } from '../components/ResumeResultsPanel';
import ConfettiBackground from '../components/confetti-background';
import { BackgroundAnimation } from '../components/BackgroundAnimation';
import { ParticleCanvas } from '../components/ParticleCanvas';
import { ResumeUploadSection } from '../components/ResumeUploadSection';
import { ResumeSectionEditor } from '../components/ResumeSectionEditor';

const ResumeAnalyzerPage: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [editingSections, setEditingSections] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Smooth scroll to results when result is set
  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!jobDesc.trim()) {
      setError('Please paste the job description.');
      return;
    }
    setIsAnalyzing(true);
    try {
      // 1. Parse resume
      let sections;
      if (resumeFile) {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        const res = await fetch('http://localhost:3001/api/resume/parse', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          setIsAnalyzing(false);
          return;
        }
        sections = data.sections;
      } else {
        const res = await fetch('http://localhost:3001/api/resume/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: resumeText }),
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          setIsAnalyzing(false);
          return;
        }
        sections = data.sections;
      }
      // 2. ATS scoring
      const atsRes = await fetch('http://localhost:3001/api/resume/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections, jobDescription: jobDesc, companyUrl: companyUrl }),
      });
      const atsData = await atsRes.json();
      if (atsData.error) {
        setError(atsData.error);
        setIsAnalyzing(false);
        return;
      }
      setResult({
        ...atsData,
        ...sections,
        jobDescription: jobDesc,
      });
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBack = () => {
    setResult(null);
    setResumeText('');
    setResumeFile(null);
    setJobDesc('');
    setError(null);
  };

  // Handle save from ResumeSectionEditor
  const handleSaveSections = async (sections: { summary: string; experience: string; skills: string; education: string }) => {
    setEditingSections(false);
    setIsAnalyzing(true);
    try {
      // Re-analyze with updated sections
      const atsRes = await fetch('http://localhost:3001/api/resume/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections, jobDescription: jobDesc, companyUrl: companyUrl }),
      });
      const atsData = await atsRes.json();
      if (atsData.error) {
        setError(atsData.error);
        setIsAnalyzing(false);
        return;
      }
      setResult({
        ...atsData,
        ...sections,
        jobDescription: jobDesc,
      });
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Confetti Background */}
      <ConfettiBackground />
      {/* Background Animations */}
      <BackgroundAnimation />
      <ParticleCanvas />
      {/* Cyberpunk Grid Overlay */}
      <div 
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      <div className="relative z-10">
        <Header />
        <main className="container mx-auto px-6 py-8 flex flex-col items-center justify-center min-h-[80vh]">
          {editingSections && result ? (
            <ResumeSectionEditor
              initialSections={{
                summary: result.summary || '',
                experience: result.experience || '',
                skills: result.skills || '',
                education: result.education || '',
              }}
              onSave={handleSaveSections}
              onCancel={() => setEditingSections(false)}
            />
          ) : result ? (
            <div ref={resultsRef} className="w-full">
              <ResumeResultsPanel result={result} file={resumeFile} text={resumeText} onEditSections={() => setEditingSections(true)} />
            </div>
          ) : isAnalyzing ? (
            <div className="flex flex-col md:flex-row items-stretch gap-12 w-full max-w-5xl">
              <div className="flex-1 flex flex-col justify-center items-start md:pr-8 mb-8 md:mb-0">
                <FileText className="w-14 h-14 text-blue-400 mb-4" />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse mb-2">Resume ATS Checker</h2>
                <p className="text-blue-200">Upload your resume (PDF/DOCX) or paste your resume text, and the job description to see how well you match. Get an ATS-style score and improvement suggestions.</p>
              </div>
              <GlassmorphismCard className="flex-1 p-8 flex flex-col items-center justify-center relative min-h-[400px]" variant="primary" glowEffect>
                {/* Stylized Resume Icon with Scan Effect */}
                <div className="relative w-40 h-48 flex items-center justify-center mb-8">
                  {/* Resume SVG */}
                  <svg viewBox="0 0 120 140" className="w-40 h-48" fill="none">
                    <rect x="10" y="10" width="100" height="120" rx="12" fill="#fff" fillOpacity="0.08" stroke="#a5b4fc" strokeWidth="2"/>
                    <circle cx="40" cy="38" r="12" fill="#a5b4fc" fillOpacity="0.5"/>
                    <rect x="60" y="28" width="35" height="8" rx="3" fill="#a5b4fc" fillOpacity="0.2"/>
                    <rect x="25" y="60" width="70" height="7" rx="3.5" fill="#a5b4fc" fillOpacity="0.15"/>
                    <rect x="25" y="75" width="70" height="7" rx="3.5" fill="#a5b4fc" fillOpacity="0.15"/>
                    <rect x="25" y="90" width="40" height="7" rx="3.5" fill="#a5b4fc" fillOpacity="0.15"/>
                  </svg>
                  {/* Scanning Effect: animated vertical scan line */}
                  <div className="absolute left-0 top-0 w-full h-full pointer-events-none overflow-hidden z-10">
                    <div className="absolute left-0 w-full h-12 animate-vertical-scan"
                      style={{
                        top: 0,
                        background: 'linear-gradient(180deg, transparent 0%, #60a5fa99 50%, transparent 100%)',
                        filter: 'blur(4px)',
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <style>{`
                    @keyframes vertical-scan {
                      0% { top: 0; }
                      100% { top: 75%; }
                    }
                    .animate-vertical-scan {
                      animation: vertical-scan 1.5s cubic-bezier(0.4,0,0.2,1) infinite;
                    }
                  `}</style>
                </div>
                {/* Scanning Text */}
                <div className="text-blue-200 text-lg font-semibold tracking-wide mb-1 text-center">SCANNING RESUME...</div>
                <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wider text-center">AI</div>
                {/* Dim the card with a subtle overlay */}
                <div className="absolute inset-0 bg-black/30 rounded-xl z-0 pointer-events-none" />
              </GlassmorphismCard>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row items-stretch gap-12 w-full max-w-5xl">
                {/* Left: Heading and description */}
                <div className="flex-1 flex flex-col justify-center items-start md:pr-8 mb-8 md:mb-0">
                  <FileText className="w-14 h-14 text-blue-400 mb-4" />
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse mb-2">Resume ATS Checker</h2>
                  <p className="text-blue-200">Upload your resume (PDF/DOCX) or paste your resume text, and the job description to see how well you match. Get an ATS-style score and improvement suggestions.</p>
                </div>
                {/* Right: Form Card */}
                <GlassmorphismCard className="flex-1 p-8 flex flex-col gap-6 relative" variant="primary" glowEffect>
                  <ResumeUploadSection
                    file={resumeFile}
                    onFile={setResumeFile}
                    text={resumeText}
                    onText={setResumeText}
                    isLoading={isAnalyzing}
                  />
                  <div>
                    <label className="block text-blue-200 font-semibold mb-2 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5" /> Paste Job Description
                    </label>
                    <textarea
                      value={jobDesc}
                      onChange={e => setJobDesc(e.target.value)}
                      rows={6}
                      placeholder="Paste the job description here..."
                      className="w-full px-4 py-3 bg-slate-900/60 border border-blue-400/30 rounded-xl text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 text-base"
                      disabled={isAnalyzing}
                    />
                  </div>

                  <div className="w-full">
                    <label htmlFor="company-url" className="block text-sm font-medium text-blue-300 mb-2">
                      Company Website URL (Optional)
                    </label>
                    <input
                      id="company-url"
                      type="url"
                      value={companyUrl}
                      onChange={(e) => setCompanyUrl(e.target.value)}
                      placeholder="e.g., https://www.company.com/about"
                      className="w-full p-3 rounded-xl border border-blue-700 bg-slate-800 text-blue-100 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {error && <div className="text-red-400 text-center font-semibold animate-pulse mt-2">{error}</div>}
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {isAnalyzing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>Analyze Resume</span>
                        </>
                      )}
                    </div>
                  </button>
                </GlassmorphismCard>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ResumeAnalyzerPage; 