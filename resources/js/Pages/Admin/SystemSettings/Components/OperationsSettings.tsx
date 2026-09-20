import React from 'react';
import { SystemSettings, TelemetryData } from '../types';
import { Clock, Download, Server } from 'lucide-react';

interface OperationsSettingsProps {
    settings: SystemSettings;
    onChange: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
    telemetry: TelemetryData | null;
    errors?: Record<string, string>;
}

export default function OperationsSettings({
    settings,
    onChange,
    telemetry,
    errors = {},
}: OperationsSettingsProps) {
    return (
        <div className="space-y-8">
            {/* SUBSECTION 1: SESSION SECURITY */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-serif">
                        Session Security
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Inactivity limits governing stockroom terminal locking and user session expiry.
                    </p>
                </div>

                <div className="max-w-md space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Terminal Inactivity Auto-Logout</span>
                        <span className="text-red-600 font-normal">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min="5"
                            max="480"
                            value={settings['security.session_timeout_minutes']}
                            onChange={(e) =>
                                onChange(
                                    'security.session_timeout_minutes',
                                    parseInt(e.target.value, 10) || 30
                                )
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-900/10 dark:focus:ring-red-500/20 focus:border-red-800 dark:focus:border-red-600 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600"
                        />
                        <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Minutes
                        </span>
                    </div>
                    {errors['settings.security.session_timeout_minutes'] && (
                        <p className="text-xs text-red-600 mt-1">
                            {errors['settings.security.session_timeout_minutes']}
                        </p>
                    )}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        Valid range: 5 to 480 minutes before automatic lock out.
                    </p>
                </div>
            </div>

            <hr className="border-slate-200/80 dark:border-slate-800" />

            {/* SUBSECTION 2: POLICY BACKUP */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-serif">
                        Policy Backup & Archival Export
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Download the current system policy configuration and official signatories snapshot.
                    </p>
                </div>

                <div className="max-w-md">
                    <a
                        href={route('system.settings.backup')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                        <Download className="w-4 h-4 text-red-900 dark:text-red-400" />
                        <span>Download Policy Snapshot (JSON)</span>
                    </a>
                </div>
            </div>

            <hr className="border-slate-200/80 dark:border-slate-800" />

            {/* SUBSECTION 3: RUNTIME INFORMATION */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-serif">
                        Runtime Environment Information
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Server node parameters, framework version, and persistence telemetry.
                    </p>
                </div>

                <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs max-w-2xl">
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Server className="w-3.5 h-3.5 text-red-900 dark:text-red-400" />
                            System Environment
                        </span>
                        {telemetry?.cached_at && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                Cached: {telemetry.cached_at}
                            </span>
                        )}
                    </div>

                    <table className="w-full text-xs text-left">
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            <tr>
                                <th className="px-5 py-3 font-medium text-slate-500 dark:text-slate-400 w-1/3 bg-slate-50/40 dark:bg-slate-850/40">
                                    PHP Runtime
                                </th>
                                <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100 font-mono">
                                    {telemetry?.php_version ?? 'Unavailable'}
                                </td>
                            </tr>
                            <tr>
                                <th className="px-5 py-3 font-medium text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-850/40">
                                    Framework
                                </th>
                                <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                    {telemetry?.laravel_version ? `Laravel ${telemetry.laravel_version}` : 'Unavailable'}
                                </td>
                            </tr>
                            <tr>
                                <th className="px-5 py-3 font-medium text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-850/40">
                                    Database Driver
                                </th>
                                <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100 font-mono">
                                    {telemetry?.database_driver ? telemetry.database_driver.toUpperCase() : 'Unavailable'}
                                </td>
                            </tr>
                            <tr>
                                <th className="px-5 py-3 font-medium text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-850/40">
                                    Operating Mode
                                </th>
                                <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                    {telemetry?.system_mode ?? 'Unavailable'}
                                </td>
                            </tr>
                            <tr>
                                <th className="px-5 py-3 font-medium text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-850/40">
                                    Server Node
                                </th>
                                <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300 font-mono">
                                    {telemetry?.server_node ?? 'Unavailable'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
