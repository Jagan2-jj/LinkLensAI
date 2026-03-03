import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  active: boolean;
  connections: number[];
}

export const NeuralNetworkLoader: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 300;

    // Create neural network nodes
    const layers = [4, 6, 6, 3];
    const nodes: Node[] = [];
    let nodeIndex = 0;

    layers.forEach((layerSize, layerIndex) => {
      const layerNodes: Node[] = [];
      for (let i = 0; i < layerSize; i++) {
        const node: Node = {
          x: (layerIndex * 120) + 60,
          y: (canvas.height / (layerSize + 1)) * (i + 1),
          active: false,
          connections: [],
        };

        // Connect to next layer
        if (layerIndex < layers.length - 1) {
          const nextLayerStart = nodeIndex + layerSize;
          const nextLayerSize = layers[layerIndex + 1];
          for (let j = 0; j < nextLayerSize; j++) {
            node.connections.push(nextLayerStart + j);
          }
        }

        layerNodes.push(node);
        nodeIndex++;
      }
      nodes.push(...layerNodes);
    });

    let currentTime = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      currentTime += 0.05;

      // Draw connections
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
      ctx.lineWidth = 1;
      nodes.forEach((node) => {
        node.connections.forEach(connectionIndex => {
          const targetNode = nodes[connectionIndex];
          if (targetNode) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.stroke();
          }
        });
      });

      // Draw and animate nodes
      nodes.forEach((node, index) => {
        const activation = Math.sin(currentTime + index * 0.5) * 0.5 + 0.5;
        node.active = activation > 0.7;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.active ? 8 : 5, 0, Math.PI * 2);
        ctx.fillStyle = node.active 
          ? `rgba(14, 165, 233, ${activation})`
          : 'rgba(148, 163, 184, 0.5)';
        ctx.fill();

        // Glow effect for active nodes
        if (node.active) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 12, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(14, 165, 233, ${activation * 0.2})`;
          ctx.fill();
        }
      });

      // Draw activation wave
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 5) {
        const y = Math.sin((x + currentTime * 50) * 0.02) * 20 + canvas.height / 2;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="rounded-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg pointer-events-none" />
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-white">AI Neural Processing</h3>
        <p className="text-blue-300 text-sm">Analyzing LinkedIn profile data...</p>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
};