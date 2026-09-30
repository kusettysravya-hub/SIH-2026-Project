import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Cpu, Activity } from 'lucide-react';

/**
 * Scientific Quantum Visual & Instructional Video Player
 * - Renders a real-time 4-qubit Bloch sphere + Variational Quantum Circuit telemetry stream
 * - Pipes the canvas stream into an HTML5 <video muted playsInline> element with automatic fallback
 * - Respects prefers-reduced-motion and supports user-controlled Play/Pause and interactive qubit selection
 */
export const QuantumVisualPlayer = ({ mode = 'hero', featureNames = ['HbA1c_level', 'blood_glucose_level', 'bmi', 'age'] }) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedQubit, setSelectedQubit] = useState(0);
  const [phaseTime, setPhaseTime] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const labels = featureNames && featureNames.length >= 4
    ? featureNames.slice(0, 4)
    : ['HbA1c_level', 'blood_glucose_level', 'bmi', 'age'];

  const baseAngles = [2.42, 2.15, 1.68, 1.34]; // radians in [0, pi]

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setReducedMotion(true);
      setIsPlaying(false);
    }
    const handler = (e) => {
      setReducedMotion(e.matches);
      if (e.matches) setIsPlaying(false);
    };
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = phaseTime;

    // Attach live stream to HTML5 <video> element if supported by browser
    if (videoRef.current && typeof canvas.captureStream === 'function' && !videoRef.current.srcObject) {
      try {
        const stream = canvas.captureStream(30);
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      } catch (e) {
        // Fallback to direct canvas rendering seamlessly
      }
    }

    const renderFrame = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background deep scientific gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#071120');
      grad.addColorStop(0.5, '#0c1e36');
      grad.addColorStop(1, '#082026');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle coordinate grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
      ctx.lineWidth = 1;
      for (let x = 24; x < w; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 24; y < h; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Bloch Sphere on Left Side
      const cx = mode === 'hero' ? w * 0.30 : w * 0.25;
      const cy = h * 0.52;
      const radius = Math.min(w * 0.21, h * 0.34);

      // Outer glow
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.25);
      glow.addColorStop(0, 'rgba(20, 184, 166, 0.16)');
      glow.addColorStop(0.6, 'rgba(56, 189, 248, 0.08)');
      glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Sphere boundary
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Equatorial ellipse
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius, radius * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Meridian ellipse
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.28)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius * 0.32, radius, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Z-axis |0> and |1> poles
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.beginPath();
      ctx.moveTo(cx, cy - radius - 8);
      ctx.lineTo(cx, cy + radius + 8);
      ctx.stroke();

      ctx.fillStyle = '#bae6fd';
      ctx.font = '600 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('|0⟩', cx, cy - radius - 12);
      ctx.fillText('|1⟩', cx, cy + radius + 18);

      // Active Qubit Statevector arrow
      const activeTheta = baseAngles[selectedQubit] + Math.sin(t * 1.4 + selectedQubit) * 0.18;
      const activePhi = t * 1.1 + selectedQubit * 0.8;
      const vx = cx + radius * Math.sin(activeTheta) * Math.cos(activePhi) * 0.85;
      const vy = cy - radius * Math.cos(activeTheta) * 0.88;

      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(vx, vy);
      ctx.stroke();

      // Tip of statevector
      ctx.fillStyle = '#5eead4';
      ctx.beginPath();
      ctx.arc(vx, vy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw 4-Qubit Variational Circuit & Probability Waves on Right Side
      const startX = mode === 'hero' ? w * 0.54 : w * 0.48;
      const endX = w - 22;
      const wireSpacing = (h * 0.66) / 3;
      const topY = h * 0.20;

      for (let q = 0; q < 4; q++) {
        const y = topY + q * wireSpacing;
        const isSelected = q === selectedQubit;

        // Wire line
        ctx.strokeStyle = isSelected ? 'rgba(45, 212, 191, 0.8)' : 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = isSelected ? 2 : 1.2;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();

        // Qubit label
        ctx.fillStyle = isSelected ? '#5eead4' : '#94a3b8';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`q${q}`, startX - 8, y + 3);

        // Ry(theta) Gate Box
        const gate1X = startX + 16;
        ctx.fillStyle = isSelected ? '#0d9488' : '#0369a1';
        ctx.strokeStyle = isSelected ? '#5eead4' : '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(gate1X, y - 10, 34, 20, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Ry(θ)', gate1X + 17, y + 3);

        // Variational Rotations Box
        const gate2X = startX + 66;
        ctx.fillStyle = '#4c1d95';
        ctx.strokeStyle = '#a78bfa';
        ctx.beginPath();
        ctx.roundRect(gate2X, y - 10, 36, 20, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ede9fe';
        ctx.fillText('U(ω)', gate2X + 18, y + 3);

        // Animated Quantum Pulse traveling along wire
        const pulseProgress = ((t * 0.55 + q * 0.2) % 1);
        const pulseX = startX + pulseProgress * (endX - startX);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(pulseX, y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Pauli-Z Readout Meter at end of wire
        const zVal = Math.cos(baseAngles[q] + Math.sin(t + q) * 0.15);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(endX - 38, y - 10, 36, 20, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#7dd3fc';
        ctx.font = '600 8.5px monospace';
        ctx.fillText(`${zVal >= 0 ? '+' : ''}${zVal.toFixed(2)}`, endX - 20, y + 3);
      }

      // Draw CNOT entanglement vertical connectors
      const cnotX = startX + 114;
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.65)';
      ctx.lineWidth = 1.5;
      for (let q = 0; q < 3; q++) {
        const y1 = topY + q * wireSpacing;
        const y2 = topY + (q + 1) * wireSpacing;
        ctx.beginPath();
        ctx.moveTo(cnotX + q * 8, y1);
        ctx.lineTo(cnotX + q * 8, y2);
        ctx.stroke();

        ctx.fillStyle = '#2dd4bf';
        ctx.beginPath();
        ctx.arc(cnotX + q * 8, y1, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#2dd4bf';
        ctx.beginPath();
        ctx.arc(cnotX + q * 8, y2, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    renderFrame();

    if (isPlaying && !reducedMotion) {
      const loop = () => {
        t += 0.025;
        setPhaseTime(t);
        renderFrame();
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, selectedQubit, reducedMotion, mode]);

  const currentAngleDeg = Math.round((baseAngles[selectedQubit] * 180) / Math.PI);
  const currentZ = Math.cos(baseAngles[selectedQubit]).toFixed(3);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-sky-500/30 bg-slate-950 shadow-xl text-white">
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold">
            <Sparkles className="w-3 h-3" /> PennyLane 4-Qubit VQC
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Bloch State &amp; Circular CNOT Entanglement Stream
          </span>
        </div>

        {/* User Play/Pause & Reset Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition-colors"
            title={isPlaying ? 'Pause quantum visual stream' : 'Play quantum visual stream'}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            type="button"
            onClick={() => setPhaseTime(0)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title="Reset phase"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Dual Video + Interactive Canvas Viewport */}
      <div className="relative">
        {/* Hidden/Mirrored HTML5 Video Element for native video stream compatibility */}
        <video
          ref={videoRef}
          muted
          playsInline
          loop
          className="sr-only"
          aria-label="Quantum statevector and Bloch sphere simulation video"
        />

        <canvas
          ref={canvasRef}
          width={mode === 'hero' ? 460 : 620}
          height={mode === 'hero' ? 235 : 260}
          className="w-full h-auto block"
        />
      </div>

      {/* Interactive Qubit Selector Footer */}
      <div className="px-3.5 py-2.5 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1">
          <span className="text-slate-400 mr-1 font-medium">Inspect Qubit:</span>
          {[0, 1, 2, 3].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setSelectedQubit(q)}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                selectedQubit === q
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              q{q}: {labels[q]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-sky-300">
          <span>Ry(θ) = {currentAngleDeg}°</span>
          <span className="text-teal-300">⟨Z_{selectedQubit}⟩ = {currentZ}</span>
        </div>
      </div>
    </div>
  );
};

export default QuantumVisualPlayer;
