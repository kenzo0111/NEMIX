import { notify } from '@/utils/notifications';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import { DialogBody, DialogFooter, DialogHeader } from '@/Components/ui/dialog-frame';
import Field from '@/Components/ui/field';
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
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
          notify({ type: 'success', message: `System mode successfully switched to ${confirmingMode}` });
        },
        onError: (errors) => {
          setIsSubmitting(false);
          const errorMsg = errors.mode || errors.reason || 'Failed to switch system operating mode.';
          notify({ type: 'error', message: errorMsg });
        },
      }
    );
  };

  const config = MODES[activeMode] || MODES['LIVE PRODUCTION'];
  const targetConfig = confirmingMode ? MODES[confirmingMode] : null;
  const isQuietProduction = !isSystemAdmin && activeMode === 'LIVE PRODUCTION';

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Dynamic System Mode Badge Trigger */}
      <button
        data-tour="system-admin-operating-mode"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`System mode: ${config.label}`}
        className={`group inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-1.5 transition-all duration-200 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:focus-visible:ring-amber-400/60 ${
          isQuietProduction
            ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700/80'
            : `${config.badgeBg} ${config.badgeBorder} hover:brightness-125`
        }`}
        title="Click to view health & system diagnostics"
      >
        {/* Status Indicator Dot (pulsing only for admins or non-production modes) */}
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          {!isQuietProduction && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dotBg} opacity-75 motion-reduce:hidden`}></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isQuietProduction ? 'bg-emerald-500' : config.dotBg}`}></span>
        </span>

        <span className={`tabular-nums text-sm font-medium tracking-normal ${isQuietProduction ? 'text-slate-700 dark:text-slate-200' : `font-semibold ${config.badgeText}`}`}>
          {isQuietProduction ? (
            <>Live</>
          ) : (
            <><span className="hidden sm:inline">SYSTEM MODE: </span>{config.label}</>
          )}
        </span>

        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isQuietProduction ? 'text-slate-500 dark:text-slate-400' : config.badgeText} ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {/* Popover Switcher & Dynamic Runtime Diagnostics Panel */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2.5 w-[420px] max-w-[calc(100vw-2rem)] rounded-xl bg-slate-950 border border-red-900/80 shadow-2xl text-slate-100 z-50 overflow-hidden font-sans animate-in fade-in slide-in-from-top-2 duration-150 lg:left-auto lg:right-0">
          {/* Diagnostics Panel Header */}
          <div className="bg-red-950/90 border-b border-red-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server className="w-4.5 h-4.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-amber-300 tracking-normal tabular-nums text-sm normal-case">
                System Runtime Diagnostics
              </span>
            </div>
            <div className="flex items-center gap-2 tabular-nums text-sm text-red-300/90 bg-red-900/40 px-2.5 py-0.5 rounded border border-red-800/60">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{currentTime}</span>
            </div>
          </div>

          {/* Spacious Operational Diagnostics Grid */}
          <div className="p-4 bg-slate-950 border-b border-slate-800/80 space-y-3">
            {/* Metric Tiles (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-2.5 tabular-nums text-sm">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Node</span>
                </div>
                <strong className="text-slate-100 font-semibold">{serverNode}</strong>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Activity className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Latency</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold text-sm">
                  {pingMs}ms
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Status</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold text-sm normal-case">
                  {systemStatus}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Security</span>
                </div>
                <strong className="text-slate-200 text-sm">{securityStatus}</strong>
              </div>
            </div>

            {/* Database / Environment Detail Bar */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-sm tabular-nums">
              <div className="flex items-center gap-2 text-slate-300">
                <Database className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Target Environment</span>
              </div>
              <strong className="text-indigo-200 font-semibold">{systemEnv}</strong>
            </div>

            {/* Last Audit Action Bar */}
            <div className="px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-sm text-slate-300 tabular-nums">
              <div className="flex items-center gap-1.5 min-w-0">
                <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Changed By: <strong className="text-slate-200 font-semibold">{changedBy}</strong></span>
              </div>
              <span className="shrink-0 text-slate-400 ml-2">{changedAt}</span>
            </div>
          </div>

          {/* Mode Selector Section */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold normal-case tracking-normal text-slate-300 tabular-nums">
                Select Active Operating Mode
              </div>
              {!isSystemAdmin && (
                <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80 font-semibold">
                  <Lock className="w-3 h-3 text-amber-400" /> System Admin Only
                </span>
              )}
            </div>

            {!isSystemAdmin && (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-900/80 text-sm text-amber-200/90 leading-normal flex items-start gap-2.5">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold tabular-nums normal-case text-sm block text-amber-300 mb-0.5">Viewing Only Permission</span>
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
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${isSelected
    ? `${item.badgeBg} ${item.badgeBorder} text-white shadow-md ring-1 ring-amber-400/50` : isSystemAdmin
    ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-200 cursor-pointer" : "bg-slate-900/20 border-slate-900 text-slate-500 cursor-not-allowed opacity-50"}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.dotBg} shrink-0`} />
                        <span className="tabular-nums font-semibold text-sm tracking-normal">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-normal pl-5">
                        {item.description}
                      </p>
                    </div>

                    {isSelected ? (
                      <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0" title="Active Operating Mode">
                        <Check className="w-4 h-4" />
                      </span>
                    ) : !isSystemAdmin ? (
                      <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Diagnostic Bar */}
          <div className="bg-slate-900/90 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-sm tabular-nums text-slate-400">
            <span>CONFIG ID: <strong className="text-slate-300">SYS-CONFIG-01</strong></span>
            <span className="text-emerald-400 font-semibold normal-case tracking-normal">{activeMode}</span>
          </div>
        </div>
      )}

      {/* Mode Change Confirmation Flow Modal */}
      <Modal
        show={Boolean(confirmingMode && targetConfig)}
        onClose={() => !isSubmitting && setConfirmingMode(null)}
        closeable={!isSubmitting}
        maxWidth="lg"
        ariaLabel="Confirm operating mode change"
      >
        {targetConfig && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Change Operating Mode?
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfirmingMode(null)}
                disabled={isSubmitting}
                aria-label="Close operating mode confirmation"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </Button>
            </DialogHeader>

            <DialogBody className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  You are switching the system operating mode from:
                </div>
                <div className="flex flex-wrap items-center gap-2.5 tabular-nums font-semibold text-sm">
                  <span className="px-3 py-1.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    {activeMode}
                  </span>
                  <span className="text-red-900 dark:text-red-300 text-sm" aria-hidden="true">→</span>
                  <span className={`px-3 py-1.5 rounded border ${targetConfig.badgeBg} ${targetConfig.badgeBorder} ${targetConfig.badgeText}`}>
                    {targetConfig.label}
                  </span>
                </div>
              </div>

              <div className={`p-4 rounded-lg border leading-relaxed text-sm ${confirmingMode === 'LIVE PRODUCTION'
                ? "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/50 dark:border-rose-700 dark:text-rose-200"
                : confirmingMode === 'MAINTENANCE MODE'
                ? "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-200"
                : confirmingMode === 'STAGING SANDBOX'
                ? "bg-sky-50 border-sky-300 text-sky-900 dark:bg-sky-950/50 dark:border-sky-700 dark:text-sky-200"
                : "bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"}`}>
                <div className="font-semibold text-sm mb-1.5 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" /> Mode Impact Assessment
                </div>
                <p className="text-sm leading-normal">{targetConfig.warningAlert}</p>
              </div>

              <Field
                id="system-mode-change-reason"
                label="Reason for Mode Change (Recorded in Audit Log)"
              >
                <input
                  type="text"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="e.g. Scheduled System Audit / Staff Training Session..."
                  className="ui-field w-full"
                />
              </Field>

              <p className="leading-relaxed text-sm text-slate-600 dark:text-slate-400">
                This action will be authenticated under administrator <strong className="text-slate-900 dark:text-slate-100">{pageProps.auth?.user?.name}</strong> and logged in the official audit trail ledger.
              </p>
            </DialogBody>

            <DialogFooter>
              <Button
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => setConfirmingMode(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={isSubmitting}
                onClick={handleConfirmModeSwitch}
              >
                {isSubmitting ? 'Switching...' : 'Confirm & Switch Operating Mode'}
              </Button>
            </DialogFooter>
          </>
        )}
      </Modal>

    </div>
  );
}
