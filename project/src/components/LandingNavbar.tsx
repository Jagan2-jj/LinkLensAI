import React, { useState, useRef, useEffect } from 'react';
import LinklensLogo from '../../Linklens.jpg';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { FileText, Sparkles } from 'lucide-react';

interface LandingNavbarProps {
  setShowLogin?: (show: boolean) => void;
}
export const LandingNavbar: React.FC<LandingNavbarProps> = ({ setShowLogin }) => {
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Add a state to force re-render on auth change
  const [authVersion, setAuthVersion] = useState(0);
  // Track avatar image load errors to fallback gracefully
  const [avatarError, setAvatarError] = useState(false);

  // Listen for auth changes to force re-render
  useEffect(() => {
    const handler = () => setAuthVersion(v => v + 1);
    window.addEventListener('linklens-auth-changed', handler);
    return () => window.removeEventListener('linklens-auth-changed', handler);
  }, []);

  // Helpers
  const getInitials = (nameOrEmail?: string) => {
    if (!nameOrEmail) return 'U';
    const clean = nameOrEmail.trim();
    if (clean.includes(' ')) {
      const parts = clean.split(' ').filter(Boolean);
      return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
    }
    // For email or single token, take first two letters
    return clean.slice(0, 2).toUpperCase();
  };

  const toTitleCase = (str: string) =>
    str
      .split(' ')
      .filter(Boolean)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join(' ');

  const rawName = (user && (user.name?.trim() || user.email)) || '';
  const displayName = rawName.includes('@') ? rawName : toTitleCase(rawName);
  const generatedAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || 'User')}&backgroundType=gradientLinear&fontFamily=Arial&fontWeight=700&fontSize=50`;
  const avatarSrc = (user?.picture && !avatarError) ? user.picture : (!avatarError ? generatedAvatar : '');

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  return (
    <nav className="w-full flex flex-wrap items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-gradient-to-r from-blue-900/80 to-purple-900/80 shadow-lg fixed top-0 left-0 z-50 backdrop-blur-md">
      {/* Left: Logo + App Name */}
      <div className="flex items-center space-x-2 md:space-x-3">
        <img
          src={LinklensLogo}
          alt="LinkLens Logo"
          className="w-8 h-8 md:w-10 md:h-10 rounded-lg shadow object-cover border-2 border-blue-400 bg-white"
          style={{ background: '#fff' }}
        />
        <span className="text-white font-bold text-lg md:text-xl tracking-wide select-none">LinkLens</span>
      </div>
      {/* Right: Nav Buttons + User (if authenticated) */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 md:mt-0">
        <Link
          to={user && user.isAuthenticated ? "/app" : "#"}
          className="flex items-center gap-2 px-3 md:px-5 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-bold shadow hover:from-green-600 hover:to-blue-700 transition-all text-sm md:text-base"
          onClick={e => {
            if (!user || !user.isAuthenticated) {
              e.preventDefault();
              setShowLogin && setShowLogin(true);
            }
          }}
        >
          <Sparkles className="w-5 h-5" />
          Profile Analyzer
        </Link>
        <Link
          to={user && user.isAuthenticated ? "/resume-analyzer" : "#"}
          className="flex items-center gap-2 px-3 md:px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold shadow hover:from-blue-700 hover:to-purple-700 transition-all text-sm md:text-base"
          onClick={e => {
            if (!user || !user.isAuthenticated) {
              e.preventDefault();
              setShowLogin && setShowLogin(true);
            }
          }}
        >
          <FileText className="w-5 h-5" />
          Resume Analyser
        </Link>
        <Link
          to={user && user.isAuthenticated ? "/interview-prep" : "#"}
          className="flex items-center gap-2 px-3 md:px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold shadow hover:from-purple-700 hover:to-pink-700 transition-all text-sm md:text-base"
          onClick={e => {
            if (!user || !user.isAuthenticated) {
              e.preventDefault();
              setShowLogin && setShowLogin(true);
            }
          }}
        >
          <Sparkles className="w-5 h-5" />
          Interview Prep
        </Link>
        {user && user.isAuthenticated && (
          <div className="relative flex items-center gap-2 md:gap-3 ml-2 md:ml-4" ref={dropdownRef}>
            <button
              type="button"
              className="flex items-center gap-2 focus:outline-none"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-blue-400 shadow object-cover bg-white overflow-hidden"
                  onError={() => setAvatarError(true)}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-blue-400 shadow bg-blue-700 flex items-center justify-center text-white font-bold text-xs md:text-sm">
                  {getInitials(displayName)}
                </div>
              )}
              <span className="text-white font-semibold text-xs md:text-base max-w-[6rem] md:max-w-xs truncate">
                {displayName}
              </span>
              <svg className={`w-4 h-4 text-blue-200 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 md:w-48 bg-gradient-to-br from-blue-900/90 to-purple-900/90 border border-blue-400/20 rounded-xl shadow-xl z-50 animate-fade-in" style={{top: '100%'}}>
                <div className="flex flex-col p-4 gap-2">
                  <div className="flex items-center gap-2 mb-2">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-blue-400 shadow object-cover bg-white overflow-hidden"
                        onError={() => setAvatarError(true)}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-blue-400 shadow bg-blue-700 flex items-center justify-center text-white font-bold text-xs">
                        {getInitials(displayName)}
                      </div>
                    )}
                    <span className="text-white font-semibold text-xs md:text-sm max-w-[6rem] md:max-w-[8rem] truncate">{displayName}</span>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setDropdownOpen(false);
                      window.dispatchEvent(new Event('linklens-auth-changed'));
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-bold shadow hover:from-pink-700 hover:to-purple-700 transition-all text-left text-xs md:text-base"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}; 