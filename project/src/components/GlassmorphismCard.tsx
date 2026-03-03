import React, { useEffect, useRef } from 'react';
import { createTiltEffect } from '../utils/animations';

interface GlassmorphismCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  tiltEffect?: boolean;
  glowEffect?: boolean;
}

export const GlassmorphismCard: React.FC<GlassmorphismCardProps> = ({
  children,
  className = '',
  variant = 'primary',
  tiltEffect = true,
  glowEffect = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tiltEffect && cardRef.current) {
      const cleanup = createTiltEffect(cardRef.current);
      return cleanup;
    }
  }, [tiltEffect]);

  const variantClasses = {
    primary: 'bg-white/10 border-white/20',
    secondary: 'bg-blue-500/10 border-blue-500/20',
    accent: 'bg-purple-500/10 border-purple-500/20',
  };

  const glowClasses = glowEffect ? 'shadow-2xl shadow-blue-500/25' : '';

  return (
    <div
      ref={cardRef}
      className={`
        ${variantClasses[variant]}
        backdrop-blur-xl border rounded-2xl
        transition-all duration-300 ease-out
        ${glowClasses}
        ${className}
      `}
      style={{
        background: `linear-gradient(135deg, 
          rgba(255, 255, 255, 0.1) 0%, 
          rgba(255, 255, 255, 0.05) 100%)`,
        boxShadow: `
          0 8px 32px 0 rgba(31, 38, 135, 0.37),
          inset 0 1px 0 rgba(255, 255, 255, 0.2),
          inset 0 -1px 0 rgba(255, 255, 255, 0.1)
        `,
      }}
    >
      {children}
    </div>
  );
};