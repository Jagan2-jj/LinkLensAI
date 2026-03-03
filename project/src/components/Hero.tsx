import React, { useEffect, useRef } from 'react';
import { Sparkles, Zap, Target } from 'lucide-react';
import { createMagneticEffect } from '../utils/animations';
import { Link } from 'react-router-dom';
import { SparklesText } from './ui/sparkles-text';

export const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroRef.current) {
      const cleanup = createMagneticEffect(heroRef.current, 0.05);
      return cleanup;
    }
  }, []);

  return (
    <div ref={heroRef} className="text-center space-y-8 py-12">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
          <SparklesText text="ProfileAI" className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse" />
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
          Revolutionary AI-powered LinkedIn profile analysis with cutting-edge insights
        </p>
      </div>

      <div className="flex justify-center space-x-8 md:space-x-12">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-4 bg-blue-500/20 rounded-full border border-blue-500/30">
            <Sparkles className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-sm text-gray-400">AI Analysis</div>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="p-4 bg-purple-500/20 rounded-full border border-purple-500/30">
            <Zap className="w-8 h-8 text-purple-400" />
          </div>
          <div className="text-sm text-gray-400">Instant Results</div>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="p-4 bg-pink-500/20 rounded-full border border-pink-500/30">
            <Target className="w-8 h-8 text-pink-400" />
          </div>
          <div className="text-sm text-gray-400">Precise Insights</div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <Link to="/get-started">
          <button className="px-6 py-3 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-all">
            Get Started
          </button>
        </Link>
        <Link to="/learn-more">
          <button className="px-6 py-3 text-blue-600 bg-white rounded-lg shadow-md border border-blue-600 hover:bg-blue-50 transition-all">
            Learn More
          </button>
        </Link>
      </div>
    </div>
  );
};