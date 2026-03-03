import React from 'react';
import { useParticles } from '../hooks/useParticles';

export const ParticleCanvas: React.FC = () => {
  const { canvasRef } = useParticles();

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};