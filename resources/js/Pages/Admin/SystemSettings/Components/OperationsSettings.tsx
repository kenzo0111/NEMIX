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
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Session Security
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Inactivity limits governing stockroom terminal locking and user session expiry.
                    </p>
                </div>

                <div className="max-w-md space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
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
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-semibold text-slate-900 bg-white shadow-2xs hover:border-slate-300"
                        />
                        <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-medium">
                            Minutes
                        </span>
                    </div>
                    {errors['settings.security.session_timeout_minutes'] && (
                        <p className="text-xs text-red-600 mt-1">
                            {errors['settings.security.session_timeout_minutes']}
                        </p>
                    )}
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        Valid range: 5 to 480 minutes before automatic lock out.
                    </p>
                </div>
            </div>

            <hr className="border-slate-200/80" />

            {/* SUBSECTION 2: POLICY BACKUP */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Policy Backup & Archival Export
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Download the current system policy configuration and official signatories snapshot.
                    </p>
                </div>

                <div className="max-w-md">
                    <a
                        href={route('system.settings.backup')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                        <Download className="w-4 h-4 text-red-900" />
                        <span>Download Policy Snapshot (JSON)</span>
                    </a>
                </div>
            </div>

            <hr className="border-slate-200/80" />

            {/* SUBSECTION 3: RUNTIME INFORMATION */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Runtime Environment Information
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Server node parameters, framework version, and persistence telemetry.
                    </p>
                </div>

                <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs max-w-2xl">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                            <Server className="w-3.5 h-3.5 text-red-900" />
                            System Environment
                        </span>
                        {telemetry?.cached_at && (
                            <span className="text-[11px] text-slate-500 font-mono">
                                Cached: {telemetry.cached_at}
                            </span>
                        )}
                    </div>

                    <table className="w-full text-xs text-left">
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <th className="px-5 py-3 font-medium text-slate-500 w-1/3 bg-slate-50/40">
                                    PHP Runtime
                                </th>
                                <td className="px-5 py-3 font-semibold text-slate-900 font-mono">
                                    {telemetry?.php_version ?? 'Unavailable'}
                                </td>
                            </tr>
                            <tr>
                                <th className="px-5 py-3 font-medium text-slate-500 bg-slate-50/40">
                                    Framework
                                </th>
                                <td className="px-5 py-3 font-semibold text-slate-900">
                                    {telemetry?.laravel_version ? `Laravel ${telemetry.laravel_version}` : 'Unavailable'}
                                </td>
                            </tr>
                            <tr>
                                <th className="px-5 py-3 font-medium text-slate-500 bg-slate-50/40">
                                    Database Driver
                                </th>
                                <td className="px-5 py-3 font-semibold text-slate-900 font-mono">
                                    {telemetry?.database_driver ? telemetry.database_driver.toUpperCase() : 'Unavailable'}
                                </td>
                            </tr>
                            <tr>
                                <th className="px-5 py-3 font-medium text-slate-500 bg-slate-50/40">
                                    Operating Mode
                                </th>
                                <td className="px-5 py-3 font-semibold text-slate-900">
                                    {telemetry?.system_mode ?? 'Unavailable'}
                                </td>
                            </tr>
                            <tr>
                                <th className="px-5 py-3 font-medium text-slate-500 bg-slate-50/40">
                                    Server Node
                                </th>
                                <td className="px-5 py-3 font-semibold text-slate-700 font-mono">
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
