import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LinkedInCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) {
      setError('No code found in URL. Please try signing in again.');
      setLoading(false);
      return;
    }
    fetch('http://localhost:3001/api/auth/linkedin/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error || !data.access_token) {
          setError(data.error || 'Failed to get access token. Please try again.');
          setLoading(false);
        } else {
          // Save LinkedIn access token to user in localStorage
          let user = JSON.parse(localStorage.getItem('linklens_user') || '{}');
          // Fetch LinkedIn profile to get the name and picture
          fetch('http://localhost:3001/api/linkedin/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: data.access_token }),
          })
            .then(res => res.json())
            .then(profile => {
          user = {
            ...user,
            isAuthenticated: true,
            linkedinAccessToken: data.access_token,
            name: profile.fullName || profile.localizedFirstName || '',
            picture: profile.picture || user.picture || '', // Always prefer latest LinkedIn photo
            email: profile.email || user.email || '',
          };
          localStorage.setItem('linklens_user', JSON.stringify(user));
          window.dispatchEvent(new Event('linklens-auth-changed'));
          // Check for pending profile URL
          const pendingProfileUrl = localStorage.getItem('pendingProfileUrl');
          if (pendingProfileUrl) {
            localStorage.removeItem('pendingProfileUrl');
            navigate(`/app?pendingProfileUrl=${encodeURIComponent(pendingProfileUrl)}`);
          } else {
            navigate('/app?showResults=1');
          }
            })
            .catch(() => {
              setError('Failed to fetch LinkedIn profile. Please try signing in again.');
              setLoading(false);
            });
        }
      })
      .catch(err => {
        setError('Network error: ' + err.message);
        setLoading(false);
      });
  }, [navigate]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-xl text-blue-400 gap-4">
      <span className="inline-block w-10 h-10 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin mb-2" />
      Signing in with LinkedIn...
    </div>
  );
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-xl text-red-400 gap-6">
      <div className="max-w-lg text-center">
        <span className="font-bold">LinkedIn Sign-In Error</span>
        <div className="text-base text-red-300 mt-2 mb-4">{error}</div>
        <button
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 mt-2"
          onClick={() => {
            // Restart OAuth flow
            const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '86t08xffcmxl9z';
            const redirectUri = 'http://localhost:5173/auth/linkedin/callback';
            const scope = 'openid profile email';
            const state = Math.random().toString(36).substring(2);
            const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&prompt=login`;
            window.location.href = authUrl;
          }}
        >
          Retry LinkedIn Sign-In
        </button>
        <button
          className="block w-full mt-4 px-6 py-2 bg-gray-700 rounded-xl text-white font-semibold hover:bg-gray-800 transition-all duration-300"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
  return null;
};

export default LinkedInCallback;
