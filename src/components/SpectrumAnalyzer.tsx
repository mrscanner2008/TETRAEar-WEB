import React, { useEffect, useRef } from 'react';

interface SpectrumAnalyzerProps {
  isActive: boolean;
  frequency: number;
}

export const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({ isActive, frequency }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = canvas.width;
    const height = canvas.height;
    const data = new Array(width).fill(0).map(() => Math.random() * 50);

    const render = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      if (isActive) {
        // Update data
        for (let i = 0; i < width; i++) {
          const target = Math.random() * 40 + (Math.sin(i * 0.05 + Date.now() * 0.005) * 20);
          data[i] = data[i] * 0.8 + target * 0.2;
          
          // Add a "peak" at the center (frequency)
          const distFromCenter = Math.abs(i - width / 2);
          if (distFromCenter < 20) {
            data[i] += (20 - distFromCenter) * 4;
          }
        }

        // Draw spectrum
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        for (let i = 0; i < width; i++) {
          const y = height - (data[i] / 100) * height;
          ctx.lineTo(i, y);
        }
        ctx.stroke();

        // Fill under spectrum
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw peak marker
        ctx.strokeStyle = '#ff4444';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#ff4444';
        ctx.font = '10px monospace';
        ctx.fillText(`${frequency.toFixed(3)} MHz`, width / 2 + 5, 15);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [isActive, frequency]);

  return (
    <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden border border-white/10">
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="w-full h-full"
      />
      <div className="absolute top-2 left-2 flex gap-2">
        <div className="px-2 py-0.5 bg-black/50 rounded text-[10px] font-mono text-green-500 border border-green-500/30">
          LIVE SPECTRUM
        </div>
        <div className="px-2 py-0.5 bg-black/50 rounded text-[10px] font-mono text-white/50 border border-white/10">
          BW: 25.0 kHz
        </div>
      </div>
    </div>
  );
};
