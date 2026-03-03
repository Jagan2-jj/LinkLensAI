import { useEffect, useRef } from 'react';
import { ParticleSystem } from '../utils/particles';

export const useParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);

  useEffect(() => {
    if (canvasRef.current && !particleSystemRef.current) {
      particleSystemRef.current = new ParticleSystem(canvasRef.current);
      particleSystemRef.current.start();
    }

    return () => {
      if (particleSystemRef.current) {
        particleSystemRef.current.destroy();
      }
    };
  }, []);

  const createParticles = (x: number, y: number, count?: number, config?: Record<string, unknown>) => {
    if (particleSystemRef.current) {
      particleSystemRef.current.createParticles(x, y, count, config);
    }
  };

  return {
    canvasRef,
    createParticles,
  };
};