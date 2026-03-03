import React, { useEffect, useRef } from 'react';
import LinklensLogo from '../../Linklens.jpg';
import { useAuth } from '../hooks/useAuth';
import { createMagneticEffect } from '../utils/animations';
import { GlassmorphismCard } from './GlassmorphismCard';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const logoRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (logoRef.current) {
      const cleanup = createMagneticEffect(logoRef.current, 0.1);
      return cleanup;
    }
  }, []);

  // Robust back button logic: if on a sub-route of /app, go to /app; if already on /app, go to landing page; otherwise, go back in history
  const handleBack = () => {
    if (location.pathname !== '/app' && location.pathname.startsWith('/app')) {
      // If on a sub-route of /app, go to /app
      navigate('/app');
    } else if (location.pathname === '/app') {
      // If already on /app, go to landing page
      navigate('/');
    } else {
      // Otherwise, go back in history
      navigate(-1);
    }
  };

  return (
    <header className="relative z-50 p-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div ref={logoRef} className="flex items-center space-x-3 cursor-pointer">
          <img
            src={LinklensLogo}
            alt="LinkLens Logo"
            className="w-10 h-10 rounded-lg shadow-lg object-cover mr-2"
            style={{ background: '#fff' }}
          />
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            LinkLens
          </div>
        </div>
        {/* Back button aligned right */}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-blue-300 hover:text-blue-400 font-semibold px-3 py-2 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md shadow"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>
      {/* Optionally, user info could go here if needed */}
    </header>
  );
};