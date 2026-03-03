import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  isListening: boolean;
  onToggle: () => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  isListening,
  onToggle,
}) => {
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        const newLevels = Array.from({ length: 20 }, () => Math.random() * 100);
        setAudioLevels(newLevels);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevels([]);
    }
  }, [isListening]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isListening) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 80;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / audioLevels.length;
      audioLevels.forEach((level, index) => {
        const barHeight = (level / 100) * canvas.height;
        const x = index * barWidth;
        const y = (canvas.height - barHeight) / 2;
        ctx.fillStyle = `hsl(${200 + level * 0.5}, 70%, 60%)`;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      });
      if (isListening) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }, [audioLevels, isListening]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={onToggle}
        className={`relative w-16 h-16 rounded-full transition-all duration-300 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50'
            : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/50'
        }`}
      >
        {isListening ? (
          <MicOff className="w-8 h-8 text-white m-auto" />
        ) : (
          <Mic className="w-8 h-8 text-white m-auto" />
        )}
        {isListening && (
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
        )}
      </button>
      {isListening && (
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="rounded-lg bg-slate-800/50 backdrop-blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg pointer-events-none" />
        </div>
      )}
      <div className="text-center">
        <div className="text-sm text-gray-300">
          {isListening ? 'Listening...' : 'Click to animate'}
        </div>
      </div>
    </div>
  );
};