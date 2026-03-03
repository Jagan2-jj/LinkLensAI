import React, { useEffect } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { UrlInput } from './components/UrlInput';
import { NeuralNetworkLoader } from './components/NeuralNetworkLoader';
import { ResultsPanel } from './components/ResultsPanel';
import { ParticleCanvas } from './components/ParticleCanvas';
import { BackgroundAnimation } from './components/BackgroundAnimation';
import { useLinkedInAnalysis } from './hooks/useLinkedInAnalysis';
import { validateApiConfig, logApiStatus } from './config/api';
import { AIAgent } from './components/AIAgent';
import AnimatedLanding from './components/AnimatedLanding';
import { AuthModal } from './components/AuthModal';
import LinkedInCallback from './pages/LinkedInCallback';
import { useAuth } from './hooks/useAuth';
import { ProfileFieldEditor } from './components/ProfileFieldEditor';
import { ArrowLeft } from 'lucide-react';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import InterviewPrepPage from './pages/InterviewPrepPage';
import ConfettiBackground from './components/confetti-background';
import { LoginCard } from './components/LoginCard';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [authVersion, setAuthVersion] = React.useState(0);

  React.useEffect(() => {
    const handler = () => setAuthVersion(v => v + 1);
    window.addEventListener('linklens-auth-changed', handler);
    return () => window.removeEventListener('linklens-auth-changed', handler);
  }, []);

  React.useEffect(() => {
    const user = localStorage.getItem('linklens_user');
    console.log('[RequireAuth] Checking auth:', { user });
    if (!user) {
      console.log('[RequireAuth] No user found, redirecting to /');
      navigate('/', { replace: true });
    } else {
      console.log('[RequireAuth] User found, rendering children');
    }
  }, [navigate, authVersion]);
  return <>{children}</>;
}

function App() {
  const { isAnalyzing, analysis, error, analyzeProfile, analyzeWithManualFields, resetAnalysis, missingFields, initialProfileFields } = useLinkedInAnalysis();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingUrl, setPendingUrl] = React.useState<string | null>(null);
  const [showLogin, setShowLogin] = React.useState(false);

  useEffect(() => {
    // Validate API configuration on app startup
    try {
      validateApiConfig();
      logApiStatus();
    } catch (error) {
      console.error('⚠️ API Configuration Error:', error);
      // In production, you might want to show a user-friendly error message
    }
  }, []);

  const handleAnalyze = async (url: string) => {
    setPendingUrl(url);
    await analyzeProfile(url);
  };

  const handleReset = () => {
    resetAnalysis();
    setPendingUrl(null);
    navigate('/app');
  };

  // Handler for manual field submission
  const handleManualFields = async (fields: any) => {
    if (pendingUrl) {
      await analyzeWithManualFields(pendingUrl, fields);
    }
  };

  return (
    <>
      {showLogin && <LoginCard onSuccess={() => setShowLogin(false)} />}
      <Routes>
        <Route path="/" element={<AnimatedLanding showLogin={showLogin} setShowLogin={setShowLogin} />} />
        <Route path="/app" element={
          <RequireAuth>
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
        <main className="container mx-auto px-6 py-8">
            <div className="space-y-12">
                {/* Show manual field editor if missing fields */}
                {missingFields.length > 0 && (
                  <ProfileFieldEditor
                    initialValues={initialProfileFields}
                    missingFields={missingFields}
                    onSubmit={handleManualFields}
                    onCancel={handleReset}
                  />
                )}
                {/* Show analysis form to any authenticated user, but hide if manual editor is open */}
                {!analysis && !isAnalyzing && missingFields.length === 0 && (
                <>
                  <Hero />
                  <div className="flex justify-center">
                    <UrlInput onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
                  </div>
                </>
              )}
              {isAnalyzing && (
                <div className="flex justify-center">
                  <NeuralNetworkLoader />
                </div>
              )}
              {error && (
                <div className="flex justify-center">
                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 max-w-md text-center">
                    <h3 className="text-xl font-bold text-red-400 mb-2">Analysis Error</h3>
                    <p className="text-red-300 mb-4">{error}</p>
                    <button
                      onClick={handleReset}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
              {analysis && (
                <div className="space-y-8">
                    <ResultsPanel analysis={analysis} onBack={handleReset} />
                  <div className="flex justify-center">
                    <button
                      onClick={handleReset}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold 
                               hover:from-blue-700 hover:to-purple-700 transition-all duration-300 
                               transform hover:scale-105 hover:shadow-lg"
                    >
                      Analyze Another Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
        </main>
        </div>
              <AIAgent />
      </div>
          </RequireAuth>
        } />
        <Route path="/resume-analyzer" element={
          <RequireAuth>
            <ResumeAnalyzerPage />
          </RequireAuth>
        } />
        <Route path="/interview-prep" element={
          <RequireAuth>
            <InterviewPrepPage />
          </RequireAuth>
        } />
        <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <AIAgent />
    </>
  );
}

export default App;