import React, { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { Activity, ShieldCheck, ChevronDown, Check, Server, RefreshCw, Cpu, Radio } from 'lucide-react';

export type SystemModeType = 
  | 'LIVE PRODUCTION'
  | 'STAGING SANDBOX'
  | 'MAINTENANCE MODE'
  | 'TRAINING SIMULATION';

interface SystemModeConfig {
  id: SystemModeType;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotBg: string;
  description: string;
}

const MODES: Record<SystemModeType, SystemModeConfig> = {
  'LIVE PRODUCTION': {
    id: 'LIVE PRODUCTION',
    label: 'LIVE PRODUCTION',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-700/50',
    dotBg: 'bg-emerald-400',
    description: 'Active production system. Real-time transaction & inventory sync.'
  },
  'STAGING SANDBOX': {
    id: 'STAGING SANDBOX',
    label: 'STAGING SANDBOX',
    badgeBg: 'bg-sky-950/80',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-700/50',
    dotBg: 'bg-sky-400',
    description: 'Isolated test environment for pre-release validation.'
  },
  'MAINTENANCE MODE': {
    id: 'MAINTENANCE MODE',
    label: 'MAINTENANCE MODE',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-700/50',
    dotBg: 'bg-amber-400',
    description: 'System under scheduled audit/maintenance. Writes restricted.'
  },
  'TRAINING SIMULATION': {
    id: 'TRAINING SIMULATION',
    label: 'TRAINING SIMULATION',
    badgeBg: 'bg-purple-950/80',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-700/50',
    dotBg: 'bg-purple-400',
    description: 'Training mode for onboarding staff with synthetic assets.'
  }
};

export default function SystemModeBadge() {
  const pageProps = usePage().props as any;
  const serverDefaultMode: SystemModeType = (pageProps.system?.mode as SystemModeType) || 'LIVE PRODUCTION';

  const [currentMode, setCurrentMode] = useState<SystemModeType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nemix_system_mode') as SystemModeType;
      if (saved && MODES[saved]) return saved;
    }
    return serverDefaultMode;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' PST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMode = (mode: SystemModeType) => {
    setCurrentMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nemix_system_mode', mode);
    }
    setIsOpen(false);
    setToastMessage(`System mode switched to ${mode}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const config = MODES[currentMode] || MODES['LIVE PRODUCTION'];

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Dynamic System Mode Badge Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border transition-all duration-200 cursor-pointer shadow-xs ${config.badgeBg} ${config.badgeBorder} hover:brightness-125 focus:outline-none focus:ring-1 focus:ring-amber-400/50`}
        title="Click to view health & switch system mode"
      >
        {/* Pulsing Beacon Indicator Dot */}
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dotBg} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotBg}`}></span>
        </span>

        <span className={`font-mono text-[10px] font-bold tracking-wider ${config.badgeText}`}>
          SYSTEM MODE: {config.label}
        </span>

        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${config.badgeText} ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Switcher & Diagnostics Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg bg-gray-900 border border-red-900/80 shadow-2xl text-gray-100 z-50 overflow-hidden font-sans text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="bg-red-950/90 border-b border-red-900 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-amber-300 tracking-wide font-mono text-[11px] uppercase">
                System Runtime Diagnostics
              </span>
            </div>
            <span className="font-mono text-[10px] text-red-300/80">{currentTime}</span>
          </div>

          {/* Live Node Status */}
          <div className="p-3 bg-gray-950/60 border-b border-gray-800 grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Node: <strong className="text-gray-200">PH-MNL-PRM01</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Ping: <strong className="text-emerald-400">12ms</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Status: <strong className="text-emerald-400">OPERATIONAL</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Security: <strong className="text-gray-200">256-BIT TLS</strong></span>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="p-3 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-mono mb-1">
              Select Active Operating Mode
            </div>

            {(Object.keys(MODES) as SystemModeType[]).map((modeKey) => {
              const item = MODES[modeKey];
              const isSelected = currentMode === modeKey;
              return (
                <button
                  key={modeKey}
                  type="button"
                  onClick={() => handleSelectMode(modeKey)}
                  className={`w-full text-left p-2.5 rounded-md border transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? `${item.badgeBg} ${item.badgeBorder} text-white shadow-xs`
                      : 'bg-gray-800/40 border-gray-800 hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.dotBg}`} />
                      <span className="font-mono font-bold text-[11px] tracking-wide">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-tight">
                      {item.description}
                    </p>
                  </div>

                  {isSelected && (
                    <span className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Reset */}
          <div className="bg-gray-950/80 px-3 py-2 border-t border-gray-800 flex items-center justify-between text-[10px] font-mono">
            <span className="text-gray-500">Default: {serverDefaultMode}</span>
            {currentMode !== serverDefaultMode && (
              <button
                type="button"
                onClick={() => handleSelectMode(serverDefaultMode)}
                className="text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset Default
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-gray-900 border border-amber-500/50 text-amber-300 text-xs px-4 py-2.5 rounded-lg shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <Activity className="w-4 h-4 text-amber-400" />
          <span className="font-mono">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
