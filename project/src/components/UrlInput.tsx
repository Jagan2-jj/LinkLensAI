import React, { useState, useEffect, useRef } from 'react';
import { Link, Send, Sparkles } from 'lucide-react';
import { GlassmorphismCard } from './GlassmorphismCard';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { createMagneticEffect } from '../utils/animations';
import { useAuth } from '../hooks/useAuth';

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('');
  const [suggestions] = useState([
    'linkedin.com/in/john-doe',
    'linkedin.com/in/jane-smith',
    'linkedin.com/in/alex-johnson',
  ]);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const { user } = useAuth();
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [linkedInId, setLinkedInId] = useState<string | null>(null);
  const [linkedInVanity, setLinkedInVanity] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check LinkedIn sign-in on mount
  useEffect(() => {
    const userObj = JSON.parse(localStorage.getItem('linklens_user') || '{}');
    if (!userObj?.linkedinAccessToken) {
      setShowLinkedInModal(true);
    }
  }, []);

  // Fetch signed-in LinkedIn id on mount if access token exists
  useEffect(() => {
    const fetchLinkedInId = async () => {
      const user = JSON.parse(localStorage.getItem('linklens_user') || '{}');
      const accessToken = user?.linkedinAccessToken;
      if (accessToken) {
        try {
          const res = await fetch('http://localhost:3001/api/linkedin/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken }),
          });
          if (res.ok) {
            const profile = await res.json();
            setLinkedInId(profile.id || null);
            setLinkedInVanity(profile.vanityName || null);
          }
        } catch (err) {
          setLinkedInId(null);
          setLinkedInVanity(null);
        }
      } else {
        setLinkedInId(null);
        setLinkedInVanity(null);
      }
    };
    fetchLinkedInId();
  }, [user?.linkedinAccessToken]);

  useEffect(() => {
    if (submitButtonRef.current) {
      const cleanup = createMagneticEffect(submitButtonRef.current, 0.2);
      return cleanup;
    }
  }, []);

  // Listen for LinkedIn sign-in and auto-analyze if pendingUrl is set
  useEffect(() => {
    const handler = () => {
      const updatedUser = JSON.parse(localStorage.getItem('linklens_user') || '{}');
      if (updatedUser?.linkedinAccessToken && pendingUrl) {
        setShowLinkedInModal(false);
        setPendingUrl(null);
        // Refetch LinkedIn id and vanity after sign-in
        (async () => {
          try {
            const res = await fetch('http://localhost:3001/api/linkedin/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken: updatedUser.linkedinAccessToken }),
            });
            if (res.ok) {
              const profile = await res.json();
              setLinkedInId(profile.id || null);
              setLinkedInVanity(profile.vanityName || null);
              // Now check if the url matches the new vanity
              const urlId = extractLinkedInId(pendingUrl);
              if (profile.vanityName && urlId && profile.vanityName === urlId) {
                onAnalyze(pendingUrl);
              } else {
                setShowLinkedInModal(true);
              }
            }
          } catch (err) {
            setLinkedInId(null);
            setLinkedInVanity(null);
          }
        })();
      }
    };
    window.addEventListener('linklens-auth-changed', handler);
    return () => window.removeEventListener('linklens-auth-changed', handler);
  }, [pendingUrl, onAnalyze]);

  // Helper to extract LinkedIn id/username from profile URL
  function extractLinkedInId(profileUrl: string): string | null {
    try {
      const match = profileUrl.match(/linkedin\.com\/in\/([^/?#]+)/i);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!/^https?:\/\/(www\.)?linkedin\.com\/in\/[^/?]+/.test(url.trim())) {
      alert('Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)');
      return;
    }
    // Allow analysis attempt for any URL, regardless of sign-in
    if (url.trim()) {
      try {
        await onAnalyze(url.trim());
      } catch (e) {
        // If backend signals auth required, show modal
        if (e instanceof Error && e.message === 'LINKEDIN_AUTH_REQUIRED') {
          setPendingUrl(url.trim());
          setShowLinkedInModal(true);
          return;
        }
        setErrorMsg('Failed to analyze profile. Please try again.');
      }
    }
  };

  // LinkedIn Sign-In Modal Component
  const [isRedirecting, setIsRedirecting] = useState(false);
  const LinkedInSignInModal = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0" />
      <div className="relative z-10 flex items-center justify-center">
        <GlassmorphismCard className="p-8 max-w-md w-full shadow-2xl animate-float" variant="primary" glowEffect>
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                Sign in with LinkedIn
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-xl" />
            </div>
            <div className="space-y-2">
              <p className="text-gray-300 font-medium">To analyze a LinkedIn profile, you must sign in with LinkedIn. This allows us to securely fetch your real profile data for the most accurate AI-powered results. <span className='text-blue-300 font-semibold'>We never store your data permanently.</span></p>
              <p className="text-blue-200 text-xs">Your LinkedIn data is used <b>only</b> for analysis and is never shared or saved.</p>
            </div>
            <button
              onClick={() => {
                if (isRedirecting) return;
                setIsRedirecting(true);
                const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '86t08xffcmxl9z';
                const redirectUri = 'http://localhost:5173/auth/linkedin/callback';
                const scope = 'openid profile email';
                const state = Math.random().toString(36).substring(2);
                const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&prompt=login`;
                setTimeout(() => { window.location.href = authUrl; }, 600); // Give spinner time to show
              }}
              className={`w-full py-3 px-6 bg-[#0077B5] rounded-lg text-white font-semibold flex items-center justify-center gap-3 hover:bg-[#005983] transition shadow ${isRedirecting ? 'opacity-60 cursor-not-allowed' : ''}`}
              aria-label="Sign in with LinkedIn"
              disabled={isRedirecting}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="12" fill="#0077B5"/>
                <path d="M17.1 17.1h-2.2v-3.3c0-.8 0-1.8-1.1-1.8-1.1 0-1.3.9-1.3 1.7v3.4h-2.2V10h2.1v1h.1c.3-.6 1-1.1 2-1.1 2.1 0 2.5 1.4 2.5 3.1v4.1zM7.3 9c-.7 0-1.2-.6-1.2-1.2 0-.7.5-1.2 1.2-1.2.7 0 1.2.5 1.2 1.2 0 .6-.5 1.2-1.2 1.2zm-1.1 8.1h2.2V10H6.2v7.1z" fill="#fff"/>
              </svg>
              <span className="font-semibold text-base" style={{ letterSpacing: 0.2 }}>Sign in with LinkedIn</span>
              {isRedirecting && <span className="ml-3"><span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin align-middle" /></span>}
            </button>
            <div className="text-xs text-blue-200 mt-2">
              <b>Tip:</b> To sign in as a different LinkedIn user, <a href="https://www.linkedin.com/m/logout/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">log out of LinkedIn</a> in your browser first.
            </div>
            <div className="text-xs text-blue-200 mt-2">
              <a href="https://www.linkedin.com/help/linkedin/answer/62703" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">Having trouble signing in?</a>
            </div>
            <button
              onClick={() => {
                if (isRedirecting) return;
                setShowLinkedInModal(false);
                setPendingUrl(null);
              }}
              className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              disabled={isRedirecting}
            >
              Cancel
            </button>
          </div>
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
      `}</style>
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {showLinkedInModal && <LinkedInSignInModal />}
      <GlassmorphismCard className="p-8" variant="primary" glowEffect>
        <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Analyze Your LinkedIn Profile
            </h2>
            <p className="text-gray-300">
              Enter your LinkedIn profile URL to get AI-powered insights
            </p>
          </div>

          <div className="relative">
            <div className="relative">
              <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://linkedin.com/in/your-profile"
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         backdrop-blur-sm transition-all duration-300"
                disabled={isLoading || showLinkedInModal || !user?.linkedinAccessToken}
              />
            </div>

            {/* Predictive Suggestions */}
            {url && !isLoading && (
              <div className="absolute top-full left-0 right-0 mt-2 z-10">
                <GlassmorphismCard className="p-2" variant="secondary">
                  {suggestions
                    .filter(suggestion => suggestion.toLowerCase().includes(url.toLowerCase()))
                    .map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setUrl(`https://${suggestion}`)}
                        className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                </GlassmorphismCard>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mb-4 text-center text-red-400 font-semibold animate-pulse">
              {errorMsg}
            </div>
          )}

          <button
            ref={submitButtonRef}
            type="submit"
            disabled={!url.trim() || isLoading || showLinkedInModal || !user?.linkedinAccessToken}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold 
                     hover:from-blue-700 hover:to-purple-700 transition-all duration-300 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
          >
            <div className="flex items-center justify-center space-x-2">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Analyze Profile</span>
                  <Send className="w-5 h-5" />
                </>
              )}
            </div>
          </button>
        </form>
      </GlassmorphismCard>
    </div>
  );
};