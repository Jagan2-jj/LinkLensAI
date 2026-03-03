import React, { useEffect, useRef } from 'react';

export const BackgroundAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      // Morphing gradient background
      const gradient1 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      const hue1 = (time * 20) % 360;
      const hue2 = (time * 20 + 120) % 360;
      const hue3 = (time * 20 + 240) % 360;

      gradient1.addColorStop(0, `hsla(${hue1}, 70%, 50%, 0.1)`);
      gradient1.addColorStop(0.5, `hsla(${hue2}, 70%, 50%, 0.05)`);
      gradient1.addColorStop(1, `hsla(${hue3}, 70%, 50%, 0.1)`);

      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floating geometric shapes
      for (let i = 0; i < 5; i++) {
        const x = (Math.sin(time + i) * 200) + canvas.width / 2;
        const y = (Math.cos(time + i * 0.7) * 150) + canvas.height / 2;
        const size = 20 + Math.sin(time + i) * 10;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time + i);
        
        ctx.strokeStyle = `hsla(${(time * 50 + i * 60) % 360}, 70%, 60%, 0.3)`;
        ctx.lineWidth = 2;
        ctx.strokeRect(-size/2, -size/2, size, size);
        
        ctx.restore();
      }

      // Data streams
      for (let i = 0; i < 3; i++) {
        const streamX = (i * canvas.width / 3) + Math.sin(time + i) * 50;
        const streamY = canvas.height * 0.2;
        
        ctx.strokeStyle = `hsla(${200 + i * 30}, 70%, 60%, 0.2)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        for (let j = 0; j < 20; j++) {
          const x = streamX + j * 10;
          const y = streamY + Math.sin(time * 2 + j * 0.2) * 20;
          
          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};