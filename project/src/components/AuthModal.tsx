import React, { useEffect, useRef, useState } from 'react';
import { Chrome, Sparkles, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { GlassmorphismCard } from './GlassmorphismCard';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { createTiltEffect } from '../utils/animations';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

const GoogleIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

export const AuthModal: React.FC = () => {
  const { signInWithEmail, isLoading, user, signInWithGoogle } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    isSignUp: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [pendingSignup, setPendingSignup] = useState<{ email: string; password: string; name: string } | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (modalRef.current) {
      const cleanup = createTiltEffect(modalRef.current, 5);
      return cleanup;
    }
  }, []);

  // NEW: Close modal or redirect if user is set
  useEffect(() => {
    if (user && user.isAuthenticated) {
      // Notify other components (like AnimatedLanding) to re-check auth state
      window.dispatchEvent(new Event('linklens-auth-changed'));
      navigate('/'); // Redirect to landing page instead of /app
    }
  }, [user, navigate]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (signInWithGoogle) {
        await signInWithGoogle(tokenResponse);
      }
    },
    onError: () => {
      console.log('Login Failed');
      setError('Google authentication failed. Please try again.');
    },
  });

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpError(null);
    if (formData.isSignUp) {
      // Step 1: Send OTP
      try {
        const res = await fetch('http://localhost:3001/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to send OTP');
        setOtpSent(true);
        setPendingSignup({ email: formData.email, password: formData.password, name: formData.name });
      } catch (err: any) {
        setError(err?.message || 'Failed to send OTP.');
      }
      return;
    }
    // Normal sign in
    try {
      await signInWithEmail(formData.email, formData.password, formData.name);
      // Redirect will happen in useEffect
    } catch {
      setError('Email authentication failed. Please try again.');
    }
  };

  // OTP verification handler
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (!pendingSignup) return;
    try {
      const res = await fetch('http://localhost:3001/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingSignup.email, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Invalid OTP');
      // Now complete registration
      await signInWithEmail(
        pendingSignup.email,
        pendingSignup.password,
        pendingSignup.name,
        true
      );
      setOtpSent(false);
      setOtp('');
      setPendingSignup(null);
    } catch (err: any) {
      setOtpError(err?.message || 'OTP verification failed.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassmorphismCard className="p-5 max-w-md w-full" variant="primary" glowEffect>
        <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
        <div ref={modalRef} className="text-center space-y-6">
          {/* Holographic Header */}
          <div className="relative">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
              Welcome to LinkLens
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-xl" />
          </div>

          {/* DNA Helix Animation */}
          <div className="relative h-14 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <div className="absolute w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
            </div>
            <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">
              Unlock Your LinkedIn Potential
            </h2>
            <p className="text-gray-300 text-sm">
              Sign in to get AI-powered insights and recommendations for your LinkedIn profile.
            </p>
          </div>

          {!showEmailForm ? (
            <div className="space-y-4">
              {/* Google Sign In Button */}
              <button
                onClick={() => googleLogin()}
                className="relative w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold 
                         hover:from-blue-700 hover:to-purple-700 transition-all duration-300 
                         transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
              >
                <div className="flex items-center justify-center space-x-3">
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </div>
                <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </button>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                <div className="flex-grow border-t border-gray-600"></div>
              </div>
              {/* Email Sign In Button */}
              <button
                onClick={() => setShowEmailForm(true)}
                className="relative w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold 
                         hover:from-purple-700 hover:to-pink-700 transition-all duration-300 
                         transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Mail className="w-6 h-6" />
                  <span>Continue with Email</span>
                </div>
                <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </button>
              {error && (
                <div className="text-red-400 text-xs text-center mt-2">{error}</div>
              )}
              <div className="text-xs text-gray-400 text-center">
                {/* No registration required for guest access */}
              </div>
              {/* Debug Button - Remove this after testing */}
              <button
                onClick={() => {
                  console.log('🔧 Debug: Current user state:', user);
                  console.log('🔧 Debug: isLoading state:', isLoading);
                  console.log('🔧 Debug: localStorage content:', localStorage.getItem('profileai_user'));
                  // Guest mode removed
                  console.log('🔧 Debug: signInWithEmail available:', !!signInWithEmail);
                  console.log('🔧 Debug: All auth methods:', { signInWithEmail: !!signInWithEmail });
                }}
                className="w-full py-1 text-xs text-gray-500 hover:text-gray-300 transition-colors border border-gray-600 rounded-lg"
              >
                🔧 Debug Info (Check Console)
              </button>
            </div>
          ) :
            !otpSent ? (
            <form onSubmit={handleEmailSubmit} className="space-y-2">
              {formData.isSignUp && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             backdrop-blur-sm transition-all duration-300 text-sm"
                    required={formData.isSignUp}
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           backdrop-blur-sm transition-all duration-300 text-sm"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           backdrop-blur-sm transition-all duration-300 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold 
                         hover:from-purple-700 hover:to-pink-700 transition-all duration-300 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{formData.isSignUp ? 'Sending OTP...' : 'Signing In...'}</span>
                  </div>
                ) : (
                  <span>{formData.isSignUp ? 'Send OTP' : 'Sign In'}</span>
                )}
              </button>
              <div className="flex items-center justify-center space-x-2 text-sm">
                <span className="text-gray-400">
                  {formData.isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isSignUp: !formData.isSignUp })}
                  className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
                >
                  {formData.isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="w-full py-1 text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Back to other options
              </button>
            </form>
            ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter OTP sent to your email"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           backdrop-blur-sm transition-all duration-300 text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold 
                         hover:from-blue-700 hover:to-purple-700 transition-all duration-300 
                         transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50 text-sm"
              >
                Verify OTP & Complete Signup
              </button>
              {otpError && <div className="text-red-400 text-xs text-center mt-1">{otpError}</div>}
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(''); setPendingSignup(null); }}
                className="w-full py-1 text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Back to signup
              </button>
            </form>
            )
          }

          {/* Security Features */}
          <div className="text-xs text-gray-400 space-y-1 mt-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>256-bit SSL encryption</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>No data stored permanently</span>
            </div>
            {!showEmailForm && (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                {/* Guest mode removed */}
              </div>
            )}
          </div>
        </div>
      </GlassmorphismCard>
    </div>
  );
};

// Example: Place this in your main page or header component
export const Header: React.FC = () => {
  const { signOut, user } = useAuth();

  return (
    <header className="flex justify-end p-4">
      {user?.isAuthenticated && (
        <button
          onClick={signOut}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Sign Out
        </button>
      )}
    </header>
  );
};