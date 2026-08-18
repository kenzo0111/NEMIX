import React, { useState, useEffect, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import {
  Activity,
  ShieldCheck,
  ChevronDown,
  Check,
  Server,
  Cpu,
  Radio,
  Lock,
  AlertTriangle,
  Database,
  UserCheck,
  Clock,
  X,
  Loader2,
} from 'lucide-react';

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
  warningAlert: string;
}

const MODES: Record<SystemModeType, SystemModeConfig> = {
  'LIVE PRODUCTION': {
    id: 'LIVE PRODUCTION',
    label: 'LIVE PRODUCTION',
    badgeBg: 'bg-emerald-950/90',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-700/60',
    dotBg: 'bg-emerald-400',
    description: 'Active production system. Real-time transaction & inventory sync.',
    warningAlert:
      'ATTENTION: LIVE PRODUCTION mode enables live real-time transactions and production database modifications. Real inventory and financial records will be updated immediately upon saving.',
  },
  'STAGING SANDBOX': {
    id: 'STAGING SANDBOX',
    label: 'STAGING SANDBOX',
    badgeBg: 'bg-sky-950/90',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-700/60',
    dotBg: 'bg-sky-400',
    description: 'Isolated test environment for pre-release validation.',
    warningAlert:
      'NOTICE: STAGING SANDBOX environment routes transactions to test sandbox data without affecting live production records.',
  },
  'MAINTENANCE MODE': {
    id: 'MAINTENANCE MODE',
    label: 'MAINTENANCE MODE',
    badgeBg: 'bg-amber-950/90',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-700/60',
    dotBg: 'bg-amber-400',
    description: 'System under scheduled audit/maintenance. Writes restricted.',
    warningAlert:
      'NOTICE: MAINTENANCE MODE restricts write operations (stock receiving, issuance, requisitions, item updates) for non-administrative users. System maintenance procedures can be safely performed.',
  },
  'TRAINING SIMULATION': {
    id: 'TRAINING SIMULATION',
    label: 'TRAINING SIMULATION',
    badgeBg: 'bg-purple-950/90',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-700/60',
    dotBg: 'bg-purple-400',
    description: 'Training mode for onboarding staff with synthetic assets.',
    warningAlert:
      'NOTICE: TRAINING SIMULATION environment uses synthetic demo data for staff onboarding without affecting live inventory.',
  },
};

export default function SystemModeBadge() {
  const pageProps = usePage().props as any;

  // Extract shared backend system state & auth permissions
  const activeMode: SystemModeType = (pageProps.system?.mode as SystemModeType) || 'LIVE PRODUCTION';
  const systemEnv: string = pageProps.system?.env || 'Production Database (Primary)';
  const systemStatus: string = pageProps.system?.status || 'OPERATIONAL';
  const serverNode: string = pageProps.system?.server_node || 'PH-MNL-PRM01';
  const pingMs: number = pageProps.system?.ping_ms || 12;
  const securityStatus: string = pageProps.system?.security_status || '256-BIT TLS (ENFORCED)';
  const changedBy: string = pageProps.system?.changed_by || 'System Administrator';
  const changedAt: string = pageProps.system?.changed_at || 'Initial Setup';

  // Server-enforced role authorization
  const isSystemAdmin: boolean = Boolean(
    pageProps.auth?.is_system_admin ||
      pageProps.auth?.user?.role === 'System Admin' ||
      pageProps.auth?.user?.role === 'System Administrator' ||
      (Array.isArray(pageProps.auth?.user?.roles) &&
        (pageProps.auth.user.roles.includes('System Admin') || pageProps.auth.user.roles.includes('System Administrator')))
  );

  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [confirmingMode, setConfirmingMode] = useState<SystemModeType | null>(null);
  const [reasonInput, setReasonInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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

  const handleSelectModeClick = (modeKey: SystemModeType) => {
    if (!isSystemAdmin) return;
    if (modeKey === activeMode) {
      setIsOpen(false);
      return;
    }
    setConfirmingMode(modeKey);
    setReasonInput('');
  };

  const handleConfirmModeSwitch = () => {
    if (!confirmingMode || !isSystemAdmin || isSubmitting) return;

    setIsSubmitting(true);
    router.post(
      route('system.mode.update'),
      {
        mode: confirmingMode,
        reason: reasonInput || 'Administrator Manual Mode Switch',
      },
      {
        preserveScroll: true,
        preserveState: false, // Reload inertia props to reflect new mode immediately
        onSuccess: () => {
          setIsSubmitting(false);
          setConfirmingMode(null);
          setIsOpen(false);
          setToastMessage(`System mode successfully switched to ${confirmingMode}`);
          setTimeout(() => setToastMessage(null), 4000);
        },
        onError: (errors) => {
          setIsSubmitting(false);
          const errorMsg = errors.mode || errors.reason || 'Failed to switch system operating mode.';
          setToastMessage(`Error: ${errorMsg}`);
          setTimeout(() => setToastMessage(null), 5000);
        },
      }
    );
  };

  const config = MODES[activeMode] || MODES['LIVE PRODUCTION'];
  const targetConfig = confirmingMode ? MODES[confirmingMode] : null;

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Dynamic System Mode Badge Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group inline-flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-200 cursor-pointer shadow-xs ${config.badgeBg} ${config.badgeBorder} hover:brightness-125 focus:outline-none focus:ring-1 focus:ring-amber-400/50`}
        title="Click to view health & system diagnostics"
      >
        {/* Pulsing Beacon Indicator Dot */}
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dotBg} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotBg}`}></span>
        </span>

        <span className={`font-mono text-[11px] font-bold tracking-wider ${config.badgeText}`}>
          SYSTEM MODE: {config.label}
        </span>

        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${config.badgeText} ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Switcher & Dynamic Runtime Diagnostics Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-[420px] max-w-[calc(100vw-2rem)] rounded-xl bg-gray-950 border border-red-900/80 shadow-2xl text-gray-100 z-50 overflow-hidden font-sans animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Diagnostics Panel Header */}
          <div className="bg-red-950/90 border-b border-red-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server className="w-4.5 h-4.5 text-amber-400 shrink-0" />
              <span className="font-bold text-amber-300 tracking-wide font-mono text-xs uppercase">
                System Runtime Diagnostics
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-red-300/90 bg-red-900/40 px-2.5 py-0.5 rounded border border-red-800/60">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{currentTime}</span>
            </div>
          </div>

          {/* Spacious Operational Diagnostics Grid */}
          <div className="p-4 bg-gray-950 border-b border-gray-800/80 space-y-3">
            {/* Metric Tiles (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Node</span>
                </div>
                <strong className="text-gray-100 font-semibold">{serverNode}</strong>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <Activity className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Latency</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[11px]">
                  {pingMs}ms
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Status</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold text-[10px] uppercase">
                  {systemStatus}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Security</span>
                </div>
                <strong className="text-gray-200 text-[11px]">{securityStatus}</strong>
              </div>
            </div>

            {/* Database / Environment Detail Bar */}
            <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-gray-400">
                <Database className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Target Environment</span>
              </div>
              <strong className="text-indigo-200 font-semibold">{systemEnv}</strong>
            </div>

            {/* Last Audit Action Bar */}
            <div className="px-3 py-2 rounded-lg bg-gray-900/40 border border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <div className="flex items-center gap-1.5 min-w-0">
                <UserCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">Changed By: <strong className="text-gray-200 font-semibold">{changedBy}</strong></span>
              </div>
              <span className="shrink-0 text-gray-400 ml-2">{changedAt}</span>
            </div>
          </div>

          {/* Mode Selector Section */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-300 font-mono">
                Select Active Operating Mode
              </div>
              {!isSystemAdmin && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80 font-semibold">
                  <Lock className="w-3 h-3 text-amber-400" /> System Admin Only
                </span>
              )}
            </div>

            {!isSystemAdmin && (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-900/80 text-xs text-amber-200/90 leading-normal flex items-start gap-2.5">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold font-mono uppercase text-[11px] block text-amber-300 mb-0.5">Viewing Only Permission</span>
                  <span>Changing operating mode requires authenticated System Administrator privileges. Contact SPMO Admin to request a system mode change.</span>
                </div>
              </div>
            )}

            {/* Operating Mode Option Buttons */}
            <div className="space-y-2">
              {(Object.keys(MODES) as SystemModeType[]).map((modeKey) => {
                const item = MODES[modeKey];
                const isSelected = activeMode === modeKey;
                return (
                  <button
                    key={modeKey}
                    type="button"
                    disabled={!isSystemAdmin || isSelected}
                    onClick={() => handleSelectModeClick(modeKey)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? `${item.badgeBg} ${item.badgeBorder} text-white shadow-md ring-1 ring-amber-400/50`
                        : isSystemAdmin
                        ? 'bg-gray-900/60 border-gray-800 hover:bg-gray-800 hover:border-gray-700 text-gray-200 cursor-pointer'
                        : 'bg-gray-900/20 border-gray-900 text-gray-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.dotBg} shrink-0`} />
                        <span className="font-mono font-bold text-xs tracking-wide">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-normal pl-5">
                        {item.description}
                      </p>
                    </div>

                    {isSelected ? (
                      <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0" title="Active Operating Mode">
                        <Check className="w-4 h-4" />
                      </span>
                    ) : !isSystemAdmin ? (
                      <Lock className="w-4 h-4 text-gray-600 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Diagnostic Bar */}
          <div className="bg-gray-900/90 px-4 py-2.5 border-t border-gray-800 flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span>CONFIG ID: <strong className="text-gray-300">SYS-CONFIG-01</strong></span>
            <span className="text-emerald-400 font-bold uppercase tracking-wider">{activeMode}</span>
          </div>
        </div>
      )}

      {/* Mode Change Confirmation Flow Modal */}
      {confirmingMode && targetConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-gray-950 border border-red-900/80 rounded-xl shadow-2xl text-gray-100 overflow-hidden font-sans text-xs">
            {/* Modal Header */}
            <div className="bg-red-950 border-b border-red-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5.5 h-5.5 text-amber-400 shrink-0" />
                <h3 className="font-bold text-amber-300 font-serif text-base uppercase tracking-wide">
                  Change Operating Mode?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmingMode(null)}
                className="text-gray-400 hover:text-gray-200 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 space-y-2">
                <div className="text-xs text-gray-400">
                  You are switching the system operating mode from:
                </div>
                <div className="flex items-center gap-2.5 font-mono font-bold text-xs">
                  <span className="px-3 py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-300">
                    {activeMode}
                  </span>
                  <span className="text-amber-400 text-sm">➔</span>
                  <span className={`px-3 py-1.5 rounded border ${targetConfig.badgeBg} ${targetConfig.badgeBorder} ${targetConfig.badgeText}`}>
                    {targetConfig.label}
                  </span>
                </div>
              </div>

              {/* Mode-specific Alert Warning Box */}
              <div className={`p-4 rounded-lg border leading-relaxed text-xs ${
                confirmingMode === 'LIVE PRODUCTION'
                  ? 'bg-red-950/90 border-red-700 text-red-200'
                  : confirmingMode === 'MAINTENANCE MODE'
                  ? 'bg-amber-950/90 border-amber-700 text-amber-200'
                  : confirmingMode === 'STAGING SANDBOX'
                  ? 'bg-sky-950/90 border-sky-700 text-sky-200'
                  : 'bg-purple-950/90 border-purple-700 text-purple-200'
              }`}>
                <div className="font-bold font-mono text-xs mb-1.5 flex items-center gap-2 uppercase">
                  <ShieldCheck className="w-4.5 h-4.5 shrink-0" /> Mode Impact Assessment
                </div>
                <p className="text-xs leading-normal">{targetConfig.warningAlert}</p>
              </div>

              {/* Reason for change field for Audit Log */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-300">
                  Reason for Mode Change (Recorded in Audit Log)
                </label>
                <input
                  type="text"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="e.g. Scheduled System Audit / Staff Training Session..."
                  className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-100 placeholder-gray-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none font-sans"
                />
              </div>

              <p className="text-[11px] text-gray-400 font-mono">
                This action will be authenticated under administrator <strong className="text-gray-200">{pageProps.auth?.user?.name}</strong> and logged in the official audit trail ledger.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="bg-gray-900 px-6 py-4 border-t border-gray-800 flex items-center justify-end gap-3 font-mono">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setConfirmingMode(null)}
                className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 font-semibold transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmModeSwitch}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold transition-colors flex items-center gap-2 shadow-xs text-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Switching...
                  </>
                ) : (
                  <>Confirm & Switch Operating Mode</>
                )}
              </button>
            </div>
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
