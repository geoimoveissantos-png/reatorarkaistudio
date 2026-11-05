import React, { useState, useEffect, useRef } from 'react';
import {
  HudHeader
} from './components/HudHeader';
import { ArcReactorHolo, AvatarState } from './components/ArcReactorHolo';
import { ActivityLog, LogEntry } from './components/ActivityLog';
import { VoiceControlBar } from './components/VoiceControlBar';
import {
  HudOverlays,
  VideoData,
  QuizData,
  ReviewData,
  ContentData,
} from './components/HudOverlays';
import { EngineDrawer } from './components/drawers/EngineDrawer';
import { SkillsDrawer } from './components/drawers/SkillsDrawer';
import { MemoryDrawer, MemoryFact } from './components/drawers/MemoryDrawer';
import { ControlsDrawer } from './components/drawers/ControlsDrawer';
import { RemoteDashboardModal } from './components/drawers/RemoteDashboardModal';
import { sounds } from './utils/soundEffects';
import {
  Activity,
  Zap,
  ShieldCheck,
  Radio,
  Sliders,
  Sparkles,
  Play,
  CloudSun,
  HelpCircle,
  FileCheck,
  Plane,
} from 'lucide-react';

export const App: React.FC = () => {
  // State
  const [avatarState, setAvatarState] = useState<AvatarState>('IDLE');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSleeping, setIsSleeping] = useState<boolean>(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(true);
  const [engineMode, setEngineMode] = useState<'gemini' | 'local'>('gemini');
  const [activeDrawer, setActiveDrawer] = useState<'setup' | 'controls' | 'skills' | 'memory' | 'engine' | 'remote' | null>(null);

  // HUD Overlays
  const [videoOverlay, setVideoOverlay] = useState<VideoData | null>(null);
  const [quizOverlay, setQuizOverlay] = useState<QuizData | null>(null);
  const [reviewOverlay, setReviewOverlay] = useState<ReviewData | null>(null);
  const [contentOverlay, setContentOverlay] = useState<ContentData | null>(null);

  // Speech Recognition & Activity Logs
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init_1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'system',
      text: 'Sistema MARK LVI inicializado. Avatar holográfico e Reator Ark online.',
    },
    {
      id: 'init_2',
      timestamp: new Date().toLocaleTimeString(),
      type: 'system',
      text: 'Decisão de engine: 0.16 ms. Voz neural Fish Audio ativa em português. Pronto para comandos.',
    },
  ]);

  // Memory
  const [memoryFacts, setMemoryFacts] = useState<MemoryFact[]>([]);

  // Telemetry simulation
  const [reactorPower, setReactorPower] = useState(3.18);
  const [reactorTemp, setReactorTemp] = useState(312.4);

  // Load memory from server on start
  useEffect(() => {
    fetch('/api/memory')
      .then((r) => r.json())
      .then((data) => {
        if (data.facts) setMemoryFacts(data.facts);
      })
      .catch(() => {});

    // Boot chime sound
    sounds.playBoot();
  }, []);

  // Update telemetry continuously
  useEffect(() => {
    const timer = setInterval(() => {
      setReactorPower(+(3.15 + Math.random() * 0.08).toFixed(2));
      setReactorTemp(+(312 + Math.random() * 0.9).toFixed(1));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Sync avatar state
  useEffect(() => {
    if (isSleeping) {
      setAvatarState('SLEEPING');
    } else if (isThinking) {
      setAvatarState('THINKING');
    } else if (isListening) {
      setAvatarState('LISTENING');
    } else if (avatarState === 'SPEAKING') {
      // Kept while speaking
    } else {
      setAvatarState('IDLE');
    }
  }, [isSleeping, isThinking, isListening]);

  // WebSocket for real-time events
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'tool' || data.type === 'system') {
            setLogs((prev) => [
              ...prev,
              {
                id: `ws_${Date.now()}_${Math.random()}`,
                timestamp: data.timestamp || new Date().toLocaleTimeString(),
                type: data.type === 'tool' ? 'tool' : 'system',
                text: data.text,
              },
            ]);
          }
        } catch {}
      };
    } catch {}

    return () => {
      ws?.close();
    };
  }, []);

  // Active audio player ref for Fish Audio
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Fallback to Web Speech Synthesis if audio stream cannot be fetched
  const fallbackWebSpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAvatarState('IDLE');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(
          (v) =>
            v.lang.startsWith('pt') ||
            v.name.includes('Luciana') ||
            v.name.includes('Felipe') ||
            v.name.includes('Francisca') ||
            v.lang === 'pt-BR' ||
            v.lang === 'pt-PT'
        ) || voices.find((v) => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
      utterance.lang = 'pt-BR';

      setAvatarState('SPEAKING');

      utterance.onend = () => {
        setAvatarState('IDLE');
        setAudioLevel(0);
      };

      utterance.onerror = () => {
        setAvatarState('IDLE');
        setAudioLevel(0);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setAvatarState('IDLE');
    }
  };

  // Speak text with Fish Audio (default voice 82d13948027e4be69892dd3d0104e681)
  const speakText = async (text: string) => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      setAvatarState('SPEAKING');

      // Call Fish Audio TTS proxy
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        // Drive avatar lip sync while Fish Audio plays
        const interval = setInterval(() => {
          if (!currentAudioRef.current || currentAudioRef.current.paused || currentAudioRef.current.ended) {
            clearInterval(interval);
            setAudioLevel(0);
            return;
          }
          setAudioLevel(0.35 + Math.random() * 0.5);
        }, 75);

        audio.onended = () => {
          clearInterval(interval);
          setAvatarState('IDLE');
          setAudioLevel(0);
          URL.revokeObjectURL(audioUrl);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
        };

        audio.onerror = () => {
          clearInterval(interval);
          fallbackWebSpeech(text);
        };

        await audio.play();
      } else {
        fallbackWebSpeech(text);
      }
    } catch {
      fallbackWebSpeech(text);
    }
  };

  // Transmit command to backend
  const handleSendCommand = async (cmdText: string) => {
    const timestamp = new Date().toLocaleTimeString();

    // Log user speech/command
    setLogs((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        timestamp,
        type: 'speech_in',
        text: cmdText,
      },
    ]);

    setIsThinking(true);

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cmdText }),
      });

      const data = await res.json();
      setIsThinking(false);

      if (data.spoken) {
        // Log Jarvis reply
        setLogs((prev) => [
          ...prev,
          {
            id: `jarvis_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'speech_out',
            text: data.spoken,
          },
        ]);

        speakText(data.spoken);
      }

      // Check for HUD overlays in payload
      if (data.hudOverlay) {
        if (data.hudOverlay.type === 'video') {
          setVideoOverlay(data.hudOverlay.data);
        } else if (data.hudOverlay.type === 'quiz') {
          setQuizOverlay(data.hudOverlay.data);
        } else if (data.hudOverlay.type === 'review') {
          setReviewOverlay(data.hudOverlay.data);
        } else if (data.hudOverlay.type === 'content') {
          setContentOverlay(data.hudOverlay.data);
        }
      }
    } catch (err: any) {
      setIsThinking(false);
      setLogs((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          text: `Command error: ${err.message || 'Transmission failed'}`,
        },
      ]);
    }
  };

  // Add memory fact
  const handleAddFact = async (fact: Omit<MemoryFact, 'id' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fact),
      });
      const data = await res.json();
      if (data.fact) {
        setMemoryFacts((prev) => [...prev, data.fact]);
      }
    } catch {}
  };

  // Delete memory fact
  const handleDeleteFact = async (id: string) => {
    try {
      await fetch(`/api/memory/${id}`, { method: 'DELETE' });
      setMemoryFacts((prev) => prev.filter((f) => f.id !== id));
    } catch {}
  };

  // Run skill directly
  const handleRunSkill = async (skillId: string, param: string) => {
    await handleSendCommand(`${skillId} ${param}`);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#00060a] text-[#8ffcff] overflow-hidden select-none">
      {/* Top Header */}
      <HudHeader
        engineMode={engineMode}
        onToggleDrawer={(drawer) => setActiveDrawer(drawer)}
        activeDrawer={activeDrawer}
        isSleeping={isSleeping}
        onToggleSleep={() => setIsSleeping(!isSleeping)}
      />

      {/* Main HUD Body */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2 relative">
        {/* Left Telemetry Sidebar */}
        <div className="w-64 hidden md:flex flex-col gap-2 shrink-0">
          {/* Reactor Energy Core Box */}
          <div className="p-3 bg-[#010d14]/90 border border-[#0d3347] rounded-lg">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#00d4ff] mb-2 pb-1 border-b border-[#0d3347]">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#ffaa00]" />
                ARC REACTOR MATRIX
              </span>
              <span className="text-[10px] text-[#00ff88]">100% OK</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-[#3a8a9a] text-[11px]">OUTPUT:</span>
                <span className="text-[#00ff88] font-bold">{reactorPower} GJ/s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#3a8a9a] text-[11px]">THERMAL:</span>
                <span className="text-[#00d4ff] font-bold">{reactorTemp} K</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#3a8a9a] text-[11px]">DISPATCH LAG:</span>
                <span className="text-[#8ffcff] font-bold">0.16 ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#3a8a9a] text-[11px]">SECURITY GATE:</span>
                <span className="text-[#00ff88] font-bold">ACTIVE</span>
              </div>
            </div>

            {/* Reactor energy bar */}
            <div className="mt-2.5 h-1.5 w-full bg-[#001f2e] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] w-[94%]" />
            </div>
          </div>

          {/* Quick HUD Triggers */}
          <div className="p-3 bg-[#010d14]/90 border border-[#0d3347] rounded-lg flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#3a8a9a] uppercase block mb-2">
                ATALHOS TÁTICOS
              </span>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleSendCommand('clima em São Paulo')}
                  className="w-full text-left p-2 rounded bg-[#000a10] hover:bg-[#001f2e] border border-[#0d3347] hover:border-[#00d4ff]/40 text-xs font-mono text-[#8ffcff] flex items-center gap-2 transition-colors"
                >
                  <CloudSun className="w-3.5 h-3.5 text-[#00d4ff]" />
                  <span>Verificar Clima</span>
                </button>

                <button
                  onClick={() => handleSendCommand('tocar trailer de Duna no HUD')}
                  className="w-full text-left p-2 rounded bg-[#000a10] hover:bg-[#001f2e] border border-[#0d3347] hover:border-[#00d4ff]/40 text-xs font-mono text-[#8ffcff] flex items-center gap-2 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-[#ff6b00]" />
                  <span>Assistir Vídeo HUD</span>
                </button>

                <button
                  onClick={() => handleSendCommand('fazer um quiz sobre Tony Stark e o Reator Ark')}
                  className="w-full text-left p-2 rounded bg-[#000a10] hover:bg-[#001f2e] border border-[#0d3347] hover:border-[#00d4ff]/40 text-xs font-mono text-[#8ffcff] flex items-center gap-2 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#ffaa00]" />
                  <span>Questionário Interativo</span>
                </button>

                <button
                  onClick={() => handleSendCommand('executar revisão diagnóstica do sistema')}
                  className="w-full text-left p-2 rounded bg-[#000a10] hover:bg-[#001f2e] border border-[#0d3347] hover:border-[#00d4ff]/40 text-xs font-mono text-[#8ffcff] flex items-center gap-2 transition-colors"
                >
                  <FileCheck className="w-3.5 h-3.5 text-[#00ff88]" />
                  <span>Diagnóstico do Sistema</span>
                </button>

                <button
                  onClick={() => handleSendCommand('rastrear voo LATAM 8084')}
                  className="w-full text-left p-2 rounded bg-[#000a10] hover:bg-[#001f2e] border border-[#0d3347] hover:border-[#00d4ff]/40 text-xs font-mono text-[#8ffcff] flex items-center gap-2 transition-colors"
                >
                  <Plane className="w-3.5 h-3.5 text-[#a855f7]" />
                  <span>Rastrear Voo</span>
                </button>
              </div>
            </div>

            {/* Audio Sensor Telemetry */}
            <div className="mt-3 pt-2.5 border-t border-[#0d3347] text-[10px] font-mono text-[#3a8a9a] space-y-1">
              <div className="flex justify-between">
                <span>INPUT SENSOR:</span>
                <span className="text-[#00ff88]">{isListening ? 'STREAMING' : 'READY'}</span>
              </div>
              <div className="flex justify-between">
                <span>ACOUSTIC GAIN:</span>
                <span className="text-[#8ffcff]">48.0 kHz 16-BIT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Stage: Arc Reactor & 3D Holographic Head */}
        <div className="flex-1 flex flex-col relative rounded-lg border border-[#0d3347] overflow-hidden bg-[#00060a]">
          <ArcReactorHolo
            state={avatarState}
            audioLevel={audioLevel}
          />

          {/* Overlays mounted inside HUD surface (Video, Quiz, Review, Content) */}
          <HudOverlays
            video={videoOverlay}
            onCloseVideo={() => setVideoOverlay(null)}
            quiz={quizOverlay}
            onCloseQuiz={(score) => {
              setQuizOverlay(null);
              if (score) {
                setLogs((prev) => [
                  ...prev,
                  {
                    id: `quiz_score_${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString(),
                    type: 'system',
                    text: `Quiz completed: ${score.correct}/${score.total} questions answered correctly.`,
                  },
                ]);
              }
            }}
            review={reviewOverlay}
            onCloseReview={() => setReviewOverlay(null)}
            content={contentOverlay}
            onCloseContent={() => setContentOverlay(null)}
          />
        </div>

        {/* Right Sidebar: HUD Activity Log */}
        <div className="w-80 lg:w-96 flex flex-col shrink-0">
          <ActivityLog
            logs={logs}
            onClear={() => setLogs([])}
          />
        </div>

        {/* Slide-out Drawers */}
        {activeDrawer === 'engine' && (
          <EngineDrawer
            currentEngine={engineMode === 'gemini' ? 'gemini_live' : 'ollama_local'}
            onSelectEngine={(e) => setEngineMode(e.startsWith('gemini') ? 'gemini' : 'local')}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {activeDrawer === 'skills' && (
          <SkillsDrawer
            onRunSkill={handleRunSkill}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {activeDrawer === 'memory' && (
          <MemoryDrawer
            facts={memoryFacts}
            onAddFact={handleAddFact}
            onDeleteFact={handleDeleteFact}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {activeDrawer === 'controls' && (
          <ControlsDrawer
            wakeWordEnabled={wakeWordEnabled}
            onToggleWakeWord={() => setWakeWordEnabled(!wakeWordEnabled)}
            isSleeping={isSleeping}
            onToggleSleep={() => setIsSleeping(!isSleeping)}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {activeDrawer === 'setup' && (
          <ControlsDrawer
            wakeWordEnabled={wakeWordEnabled}
            onToggleWakeWord={() => setWakeWordEnabled(!wakeWordEnabled)}
            isSleeping={isSleeping}
            onToggleSleep={() => setIsSleeping(!isSleeping)}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {activeDrawer === 'remote' && (
          <RemoteDashboardModal
            onClose={() => setActiveDrawer(null)}
            onSendCommand={handleSendCommand}
          />
        )}
      </div>

      {/* Bottom Voice Control Bar */}
      <VoiceControlBar
        onSendCommand={handleSendCommand}
        isListening={isListening}
        setIsListening={setIsListening}
        isThinking={isThinking}
        wakeWordEnabled={wakeWordEnabled}
        onToggleWakeWord={() => setWakeWordEnabled(!wakeWordEnabled)}
        onAudioLevelChange={(lvl) => setAudioLevel(lvl)}
      />
    </div>
  );
};

export default App;
