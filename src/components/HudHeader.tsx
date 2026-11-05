import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Settings,
  Sliders,
  Brain,
  Puzzle,
  Smartphone,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Power
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface HudHeaderProps {
  engineMode: 'gemini' | 'local';
  onToggleDrawer: (drawer: 'setup' | 'controls' | 'skills' | 'memory' | 'engine' | 'remote' | null) => void;
  activeDrawer: string | null;
  isSleeping: boolean;
  onToggleSleep: () => void;
}

export const HudHeader: React.FC<HudHeaderProps> = ({
  engineMode,
  onToggleDrawer,
  activeDrawer,
  isSleeping,
  onToggleSleep,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0] + '.' + Math.floor(now.getMilliseconds() / 100));
    };
    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, []);

  const handleMuteToggle = () => {
    const next = !isMuted;
    setIsMuted(next);
    sounds.setMuted(next);
    if (!next) sounds.playClick();
  };

  const handleFullscreenToggle = () => {
    sounds.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleDrawerClick = (name: 'setup' | 'controls' | 'skills' | 'memory' | 'engine' | 'remote') => {
    sounds.playClick();
    onToggleDrawer(activeDrawer === name ? null : name);
  };

  return (
    <header className="h-12 bg-[#00060a] border-b border-[#0d3347] px-4 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Brand & Status Pill */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff] animate-pulse" />
          <span className="font-mono font-black text-sm tracking-[0.25em] text-[#00d4ff]">
            REATOR<span className="text-[#ff6b00]">ARK</span>
          </span>
          <span className="text-[10px] tracking-wider text-[#3a8a9a] font-mono border-l border-[#0d3347] pl-2">
            MARK LVI
          </span>
        </div>

        {/* Engine status pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#011520] border border-[#0d3347] text-[10px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
          <span className="text-[#3a8a9a]">ENGINE:</span>
          <span className="text-[#00ff88] font-bold">
            {engineMode === 'gemini' ? 'GEMINI 3.1 FLASH LIVE' : 'LOCAL PIPELINE'}
          </span>
          <span className="text-[#3a8a9a] text-[9px]">(0.16 ms)</span>
        </div>
      </div>

      {/* Center Clock */}
      <div className="hidden lg:flex items-center gap-2 font-mono text-xs text-[#3a8a9a]">
        <span>SYS TIME:</span>
        <span className="text-[#00d4ff] font-bold tracking-widest">{timeStr}</span>
      </div>

      {/* Nav Buttons & Action Drawers */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleDrawerClick('engine')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] tracking-wider font-mono rounded border transition-colors ${
            activeDrawer === 'engine'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]'
              : 'bg-[#010d14] text-[#3a8a9a] border-[#0d3347] hover:text-[#8ffcff] hover:border-[#00d4ff]/50'
          }`}
          title="Engine & Providers"
        >
          <Cpu className="w-3.5 h-3.5 text-[#00d4ff]" />
          <span className="hidden sm:inline">ENGINE</span>
        </button>

        <button
          onClick={() => handleDrawerClick('skills')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] tracking-wider font-mono rounded border transition-colors ${
            activeDrawer === 'skills'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]'
              : 'bg-[#010d14] text-[#3a8a9a] border-[#0d3347] hover:text-[#8ffcff] hover:border-[#00d4ff]/50'
          }`}
          title="Skills & Plugins Catalog"
        >
          <Puzzle className="w-3.5 h-3.5 text-[#ffaa00]" />
          <span className="hidden sm:inline">SKILLS</span>
        </button>

        <button
          onClick={() => handleDrawerClick('memory')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] tracking-wider font-mono rounded border transition-colors ${
            activeDrawer === 'memory'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]'
              : 'bg-[#010d14] text-[#3a8a9a] border-[#0d3347] hover:text-[#8ffcff] hover:border-[#00d4ff]/50'
          }`}
          title="Memory Vault"
        >
          <Brain className="w-3.5 h-3.5 text-[#a855f7]" />
          <span className="hidden sm:inline">MEMORY</span>
        </button>

        <button
          onClick={() => handleDrawerClick('controls')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] tracking-wider font-mono rounded border transition-colors ${
            activeDrawer === 'controls'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]'
              : 'bg-[#010d14] text-[#3a8a9a] border-[#0d3347] hover:text-[#8ffcff] hover:border-[#00d4ff]/50'
          }`}
          title="HUD Controls Drawer"
        >
          <Sliders className="w-3.5 h-3.5 text-[#00ff88]" />
          <span className="hidden sm:inline">CONTROLS</span>
        </button>

        <button
          onClick={() => handleDrawerClick('remote')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] tracking-wider font-mono rounded border transition-colors ${
            activeDrawer === 'remote'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]'
              : 'bg-[#010d14] text-[#3a8a9a] border-[#0d3347] hover:text-[#8ffcff] hover:border-[#00d4ff]/50'
          }`}
          title="Phone Remote Dashboard"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#00d4ff]" />
          <span className="hidden md:inline">REMOTE</span>
        </button>

        <button
          onClick={() => handleDrawerClick('setup')}
          className={`p-1.5 text-[11px] font-mono rounded border transition-colors ${
            activeDrawer === 'setup'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]'
              : 'bg-[#010d14] text-[#3a8a9a] border-[#0d3347] hover:text-[#8ffcff]'
          }`}
          title="Setup & Preferences"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[#0d3347] mx-1" />

        {/* Audio Mute */}
        <button
          onClick={handleMuteToggle}
          className="p-1.5 rounded text-[#3a8a9a] hover:text-[#00d4ff] border border-[#0d3347] bg-[#010d14] transition-colors"
          title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#ff3355]" /> : <Volume2 className="w-3.5 h-3.5 text-[#00ff88]" />}
        </button>

        {/* Sleep / Wake Toggle */}
        <button
          onClick={() => {
            sounds.playClick();
            onToggleSleep();
          }}
          className={`p-1.5 rounded border transition-colors ${
            isSleeping
              ? 'bg-[#2b000a] border-[#ff3355]/40 text-[#ff3355]'
              : 'bg-[#002b1f] border-[#00ff88]/40 text-[#00ff88]'
          }`}
          title={isSleeping ? 'Wake JARVIS' : 'Put JARVIS to Sleep'}
        >
          <Power className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={handleFullscreenToggle}
          className="p-1.5 rounded text-[#3a8a9a] hover:text-[#8ffcff] border border-[#0d3347] bg-[#010d14] transition-colors hidden sm:block"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
