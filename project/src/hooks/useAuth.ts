import { useState, useEffect } from 'react';
import { User } from '../types';
import { CredentialResponse, TokenResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface GoogleDecodedToken {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('linklens_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        localStorage.removeItem('linklens_user');
      }
    }
  }, []);

  // Listen for auth changes and update user state from localStorage
  useEffect(() => {
    const handler = () => {
      const savedUser = localStorage.getItem('linklens_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    window.addEventListener('linklens-auth-changed', handler);
    return () => window.removeEventListener('linklens-auth-changed', handler);
  }, []);

  // Google sign in (calls backend)
  const signInWithGoogle = async (tokenResponse: Omit<TokenResponse, 'error' | 'error_description' | 'error_uri'>) => {
    setIsLoading(true);
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch user info from Google');
      const googleUser: GoogleDecodedToken = await res.json();
      // Send to backend for upsert
      const backendRes = await fetch('http://localhost:3001/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          googleId: googleUser.sub,
        }),
      });
      const data = await backendRes.json();
      if (!backendRes.ok || !data.user) throw new Error(data.error || 'Google login failed');
      const userToSave: User = {
        id: googleUser.sub,
        name: data.user.name,
        email: data.user.email,
        picture: data.user.picture,
        isAuthenticated: true,
      };
      setUser(userToSave);
      localStorage.setItem('linklens_user', JSON.stringify(userToSave));
      window.dispatchEvent(new Event('linklens-auth-changed'));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Email sign up/login (calls backend)
  const signInWithEmail = async (
    email: string,
    password: string,
    name: string = '',
    isSignUp: boolean = false
  ) => {
    setIsLoading(true);
    try {
      let endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const body = isSignUp ? { email, password, name } : { email, password };
      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.user) throw new Error(data.error || 'Auth failed');
      const userToSave: User = {
        id: data.user._id || data.user.email,
        name: data.user.name,
        email: data.user.email,
        picture: data.user.picture || '',
        isAuthenticated: true,
      };
      setUser(userToSave);
      localStorage.setItem('linklens_user', JSON.stringify(userToSave));
      window.dispatchEvent(new Event('linklens-auth-changed'));
    } catch (error: any) {
      throw new Error(error?.message || error?.toString() || 'Auth failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithLinkedIn = (accessToken: string, profile?: Partial<User>) => {
    const linkedInUser: User = {
      id: profile?.id || Date.now().toString(),
      name: profile?.name || 'LinkedIn User',
      email: profile?.email || '',
      picture: profile?.picture || '',
      isAuthenticated: true,
      isGuest: false,
      linkedinAccessToken: accessToken,
    };
    setUser(linkedInUser);
    localStorage.setItem('linklens_user', JSON.stringify(linkedInUser));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('linklens_user');
    window.dispatchEvent(new Event('linklens-auth-changed'));
  };

  return {
    user,
    isLoading,
    signInWithEmail,
    signInWithLinkedIn,
    signInWithGoogle,
    signOut,
  };
};