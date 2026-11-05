import React, { useEffect, useRef, useState } from 'react';
import { Eye, Zap, Layers, RefreshCw } from 'lucide-react';

export type AvatarState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'SLEEPING';

interface ArcReactorHoloProps {
  state: AvatarState;
  audioLevel?: number; // 0 to 1
  isMuted?: boolean;
}

export const ArcReactorHolo: React.FC<ArcReactorHoloProps> = ({
  state,
  audioLevel = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<'HYBRID' | 'REACTOR' | 'AVATAR'>('HYBRID');

  // Animation frame loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;
    let blink = 0; // 0 = open, 1 = closed
    let blinkTimer = 0;
    let mouthOpen = 0;
    let gazeX = 0;
    let gazeY = 0;
    let gazeTargetX = 0;
    let gazeTargetY = 0;

    const render = () => {
      t += 0.025;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // State-specific attributes
      const isSleeping = state === 'SLEEPING';
      const isSpeaking = state === 'SPEAKING';
      const isListening = state === 'LISTENING';
      const isThinking = state === 'THINKING';

      // Saccadic eye movements
      if (Math.random() < 0.02) {
        gazeTargetX = (Math.random() - 0.5) * 0.4;
        gazeTargetY = (Math.random() - 0.5) * 0.3;
      }
      gazeX += (gazeTargetX - gazeX) * 0.1;
      gazeY += (gazeTargetY - gazeY) * 0.1;

      // Blinking logic
      blinkTimer++;
      if (isSleeping) {
        blink = 1.0;
      } else if (blinkTimer > 180 + Math.sin(t) * 40) {
        blink = Math.sin((blinkTimer - 180) * 0.3);
        if (blinkTimer > 190) {
          blink = 0;
          blinkTimer = 0;
        }
      } else {
        blink = 0;
      }

      // Mouth movement for speech
      if (isSpeaking) {
        const speechFreq = Math.sin(t * 18) * 0.5 + 0.5;
        const volumeFactor = Math.max(audioLevel * 1.5, 0.35);
        mouthOpen += ((speechFreq * volumeFactor) - mouthOpen) * 0.25;
      } else {
        mouthOpen += (0 - mouthOpen) * 0.2;
      }

      // Thinking state creates subtle head tilt & eye shift
      const headTilt = isThinking ? Math.sin(t * 1.5) * 0.08 + 0.1 : 0;
      const pulseEnergy = isListening
        ? 1.2 + Math.sin(t * 8) * 0.2
        : isSpeaking
        ? 1.3 + mouthOpen * 0.5
        : isThinking
        ? 1.0 + Math.sin(t * 4) * 0.15
        : isSleeping
        ? 0.5
        : 1.0 + Math.sin(t * 2) * 0.06;

      // Primary color based on state
      const coreHue = isSleeping ? 'rgba(70, 110, 130,' : isThinking ? 'rgba(255, 170, 0,' : isListening ? 'rgba(0, 255, 136,' : 'rgba(0, 212, 255,';

      // ───────────────────────────────────────────────────────────
      // 1. ARC REACTOR BACKGROUND / CORE (Mark LVI REATOR ARK)
      // ───────────────────────────────────────────────────────────
      if (viewMode === 'REACTOR' || viewMode === 'HYBRID') {
        const reactorRadius = Math.min(w, h) * 0.38;

        // Outer telemetry circular ticks
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.15);

        ctx.strokeStyle = `${coreHue} 0.18)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, reactorRadius + 28, 0, Math.PI * 2);
        ctx.stroke();

        // 60 tick marks around perimeter
        for (let i = 0; i < 60; i++) {
          const angle = (i * Math.PI) / 30;
          const isMajor = i % 5 === 0;
          const len = isMajor ? 10 : 4;
          const r1 = reactorRadius + 28;
          const r2 = r1 - len;
          ctx.beginPath();
          ctx.strokeStyle = isMajor ? `${coreHue} 0.5)` : `${coreHue} 0.2)`;
          ctx.lineWidth = isMajor ? 1.5 : 1;
          ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
          ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
          ctx.stroke();
        }
        ctx.restore();

        // Counter-rotating segmented rings
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-t * 0.25);

        // 3 major arc segments
        ctx.strokeStyle = `${coreHue} 0.45)`;
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) {
          const start = (i * Math.PI * 2) / 3 + 0.2;
          const end = start + (Math.PI * 2) / 3 - 0.4;
          ctx.beginPath();
          ctx.arc(0, 0, reactorRadius + 12, start, end);
          ctx.stroke();
        }
        ctx.restore();

        // 10 Magnetic Energy Coils (The signature Arc Reactor ring)
        ctx.save();
        ctx.translate(cx, cy);
        const coilCount = 10;
        const coilR = reactorRadius * 0.78;

        for (let i = 0; i < coilCount; i++) {
          const ang = (i * Math.PI * 2) / coilCount + t * 0.05;
          const px = Math.cos(ang) * coilR;
          const py = Math.sin(ang) * coilR;

          // Coil bracket
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(ang + Math.PI / 2);

          // Coil glow
          const coilGlow = ctx.createRadialGradient(0, 0, 1, 0, 0, 20);
          coilGlow.addColorStop(0, `${coreHue} ${0.35 * pulseEnergy})`);
          coilGlow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = coilGlow;
          ctx.fillRect(-15, -10, 30, 20);

          // Copper wire coil wrap simulation
          ctx.strokeStyle = `${coreHue} ${0.7 * pulseEnergy})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(-10, -6, 20, 12);
          ctx.fillStyle = isThinking ? 'rgba(255, 140, 0, 0.4)' : 'rgba(0, 212, 255, 0.35)';
          ctx.fillRect(-8, -4, 16, 8);

          // Center coil highlight
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-6, 0);
          ctx.lineTo(6, 0);
          ctx.stroke();

          ctx.restore();
        }

        // Inner glowing core ring
        ctx.beginPath();
        ctx.arc(0, 0, reactorRadius * 0.48, 0, Math.PI * 2);
        ctx.strokeStyle = `${coreHue} 0.6)`;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Pulsing plasma center
        const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, reactorRadius * 0.46 * pulseEnergy);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.2, `${coreHue} 0.95)`);
        coreGrad.addColorStop(0.65, `${coreHue} 0.3)`);
        coreGrad.addColorStop(1, 'rgba(0, 6, 10, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, reactorRadius * 0.46 * pulseEnergy, 0, Math.PI * 2);
        ctx.fill();

        // Tri-beam core emitter
        for (let k = 0; k < 3; k++) {
          const beamAng = (k * Math.PI * 2) / 3 + t * 0.4;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(beamAng) * (reactorRadius * 0.4), Math.sin(beamAng) * (reactorRadius * 0.4));
          ctx.stroke();
        }

        ctx.restore();
      }

      // ───────────────────────────────────────────────────────────
      // 2. 3D HOLOGRAPHIC AVATAR WIREFRAME (Mark LVI JARVIS FACE)
      // ───────────────────────────────────────────────────────────
      if (viewMode === 'AVATAR' || viewMode === 'HYBRID') {
        ctx.save();
        ctx.translate(cx, cy);

        // Breathing & status floating
        const breathY = Math.sin(t * 1.5) * 4;
        const breathScale = 1.0 + Math.sin(t * 1.2) * 0.015;
        ctx.translate(0, breathY);
        ctx.scale(breathScale, breathScale);
        ctx.rotate(headTilt);

        const avatarAlpha = viewMode === 'HYBRID' ? 0.88 : 1.0;

        // Wireframe Head Model Vertices
        // Head outline & jawline
        const jawY = 55 + (mouthOpen * 14);
        const chinW = 24 + (mouthOpen * 4);

        const headNodes: [number, number][] = [
          // Forehead / cranium
          [0, -85], [-35, -75], [35, -75], [-60, -50], [60, -50],
          // Temples & ears
          [-72, -15], [72, -15], [-68, 20], [68, 20],
          // Cheeks & Jaw
          [-48, 50], [48, 50], [-chinW, jawY], [chinW, jawY], [0, jawY + 12]
        ];

        // Draw Holographic Mesh Edges
        ctx.strokeStyle = `${coreHue} ${0.45 * avatarAlpha})`;
        ctx.lineWidth = 1.2;

        const connect = (i: number, j: number) => {
          ctx.beginPath();
          ctx.moveTo(headNodes[i][0], headNodes[i][1]);
          ctx.lineTo(headNodes[j][0], headNodes[j][1]);
          ctx.stroke();
        };

        // Cranium contour
        connect(0, 1); connect(0, 2); connect(1, 3); connect(2, 4);
        connect(3, 5); connect(4, 6); connect(5, 7); connect(6, 8);
        connect(7, 9); connect(8, 10); connect(9, 11); connect(10, 12);
        connect(11, 13); connect(12, 13);

        // Cross-facial geodesic lines
        connect(1, 2); connect(3, 4); connect(5, 6);
        connect(0, 7); connect(0, 8);

        // Brow ridges
        const browY = -22 + (isThinking ? -4 : 0);
        ctx.strokeStyle = `${coreHue} ${0.75 * avatarAlpha})`;
        ctx.lineWidth = 1.8;
        // Left brow
        ctx.beginPath();
        ctx.moveTo(-45, browY - 2);
        ctx.lineTo(-28, browY - 6);
        ctx.lineTo(-12, browY);
        ctx.stroke();
        // Right brow
        ctx.beginPath();
        ctx.moveTo(12, browY);
        ctx.lineTo(28, browY - 6);
        ctx.lineTo(45, browY - 2);
        ctx.stroke();

        // Eyes (with eyelids, blink, pupil gaze)
        const eyeW = 16;
        const eyeH = 7 * (1 - blink);

        [-26, 26].forEach((eyeCenterX) => {
          ctx.save();
          ctx.translate(eyeCenterX, -12);

          // Eye socket polygon
          ctx.strokeStyle = `${coreHue} ${0.6 * avatarAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(0, 0, eyeW, Math.max(eyeH, 0.8), 0, 0, Math.PI * 2);
          ctx.stroke();

          if (!isSleeping && eyeH > 1.5) {
            // Iris / Gaze
            const pupilX = gazeX * 6;
            const pupilY = gazeY * 3;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pupilX, pupilY, 2.8, 0, Math.PI * 2);
            ctx.fill();

            // Iris ring
            ctx.strokeStyle = `${coreHue} 0.9)`;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(pupilX, pupilY, 5, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.restore();
        });

        // Bridge & Nose
        ctx.strokeStyle = `${coreHue} ${0.5 * avatarAlpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, browY);
        ctx.lineTo(-4, 12);
        ctx.lineTo(0, 16);
        ctx.lineTo(4, 12);
        ctx.lineTo(0, browY);
        ctx.stroke();

        // Mouth & Lip-Sync Articulation
        const mouthY = 32;
        const mouthWidth = 24 + (mouthOpen * 8);
        const mouthHeight = Math.max(2, mouthOpen * 18);

        ctx.save();
        ctx.translate(0, mouthY);

        if (isSpeaking) {
          // Inner mouth glow
          const mouthGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, mouthWidth * 0.7);
          mouthGrad.addColorStop(0, `${coreHue} 0.6)`);
          mouthGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = mouthGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, mouthWidth * 0.6, mouthHeight * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Lip contour lines (Spread, round, open)
        ctx.strokeStyle = `${coreHue} ${0.85 * avatarAlpha})`;
        ctx.lineWidth = 1.8;

        // Upper lip
        ctx.beginPath();
        ctx.moveTo(-mouthWidth / 2, 0);
        ctx.quadraticCurveTo(0, -mouthHeight * 0.5 - 2, mouthWidth / 2, 0);
        ctx.stroke();

        // Lower lip
        ctx.beginPath();
        ctx.moveTo(-mouthWidth / 2, 0);
        ctx.quadraticCurveTo(0, mouthHeight * 0.7 + 2, mouthWidth / 2, 0);
        ctx.stroke();

        // Articulation dots
        if (isSpeaking) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-mouthWidth / 2, 0, 1.5, 0, Math.PI * 2);
          ctx.arc(mouthWidth / 2, 0, 1.5, 0, Math.PI * 2);
          ctx.arc(0, mouthHeight * 0.4, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Holographic Nodes / Points
        headNodes.forEach(([nx, ny]) => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(nx, ny, 1.6, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      }

      // ───────────────────────────────────────────────────────────
      // 3. AUDIO WAVEFORM SPECTRUM (Bottom Arc)
      // ───────────────────────────────────────────────────────────
      ctx.save();
      ctx.translate(cx, h - 24);
      const barCount = 32;
      const barW = 3.5;
      const spacing = 7;
      const startX = -((barCount * spacing) / 2);

      for (let b = 0; b < barCount; b++) {
        const distFromCenter = 1 - Math.abs(b - barCount / 2) / (barCount / 2);
        let barH = 3;
        if (isSpeaking || isListening) {
          const wave = Math.sin(t * 12 + b * 0.5) * 0.5 + 0.5;
          const level = Math.max(audioLevel, isSpeaking ? 0.4 : 0.25);
          barH = Math.max(3, wave * level * 28 * distFromCenter);
        } else if (isThinking) {
          barH = Math.max(3, (Math.sin(t * 8 + b * 0.8) * 0.5 + 0.5) * 12 * distFromCenter);
        } else {
          barH = 2 + Math.sin(t * 2 + b * 0.3) * 1.5;
        }

        const bx = startX + b * spacing;
        ctx.fillStyle = isSpeaking ? 'rgba(0, 212, 255, 0.85)' : isListening ? 'rgba(0, 255, 136, 0.85)' : 'rgba(0, 212, 255, 0.35)';
        ctx.fillRect(bx, -barH, barW, barH);
      }
      ctx.restore();

      // Holographic scan line sweeping down
      const scanY = (t * 60) % h;
      ctx.strokeStyle = `${coreHue} 0.08)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, audioLevel, viewMode]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#00060a]/90 select-none">
      {/* Background HUD Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, rgba(0, 212, 255, 0.12) 0%, transparent 70%),
            linear-gradient(rgba(0, 212, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 30px 30px, 30px 30px'
        }}
      />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={480}
        height={480}
        className="max-w-full max-h-full aspect-square z-10"
      />

      {/* Top Hologram Status Label */}
      <div className="absolute top-4 left-6 z-20 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full animate-ping bg-[#00d4ff]" />
        <span className="text-[11px] tracking-[0.25em] font-bold text-[#00d4ff]/90 uppercase">
          REATOR ARK // MARK LVI
        </span>
      </div>

      <div className="absolute top-4 right-6 z-20 flex items-center gap-2 text-[10px] tracking-wider text-[#3a8a9a]">
        <span>STATUS:</span>
        <span className={`font-bold uppercase ${
          state === 'SPEAKING' ? 'text-[#00d4ff]' :
          state === 'LISTENING' ? 'text-[#00ff88]' :
          state === 'THINKING' ? 'text-[#ffaa00]' :
          state === 'SLEEPING' ? 'text-[#5e6a7e]' : 'text-[#8ffcff]'
        }`}>
          [{state}]
        </span>
      </div>

      {/* Mode Switcher Buttons */}
      <div className="absolute bottom-3 right-6 z-20 flex items-center gap-1 bg-[#010d14]/80 p-1 rounded border border-[#0d3347]">
        <button
          onClick={() => setViewMode('HYBRID')}
          className={`px-2 py-1 text-[10px] tracking-wider rounded transition-colors ${
            viewMode === 'HYBRID' ? 'bg-[#00d4ff]/20 text-[#00d4ff] font-bold' : 'text-[#3a8a9a] hover:text-[#8ffcff]'
          }`}
          title="Hybrid Overlay"
        >
          <Layers className="w-3.5 h-3.5 inline mr-1" />
          ALL
        </button>
        <button
          onClick={() => setViewMode('REACTOR')}
          className={`px-2 py-1 text-[10px] tracking-wider rounded transition-colors ${
            viewMode === 'REACTOR' ? 'bg-[#00d4ff]/20 text-[#00d4ff] font-bold' : 'text-[#3a8a9a] hover:text-[#8ffcff]'
          }`}
          title="Arc Reactor Core"
        >
          <Zap className="w-3.5 h-3.5 inline mr-1" />
          CORE
        </button>
        <button
          onClick={() => setViewMode('AVATAR')}
          className={`px-2 py-1 text-[10px] tracking-wider rounded transition-colors ${
            viewMode === 'AVATAR' ? 'bg-[#00d4ff]/20 text-[#00d4ff] font-bold' : 'text-[#3a8a9a] hover:text-[#8ffcff]'
          }`}
          title="Holographic Face"
        >
          <Eye className="w-3.5 h-3.5 inline mr-1" />
          HOLO
        </button>
      </div>
    </div>
  );
};
