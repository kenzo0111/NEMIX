import React from 'react';
import { SystemSettings, TelemetryData } from '../types';
import { Download, Server } from 'lucide-react';
import { useAuthorization } from '@/Hooks/useAuthorization';
import Field from '@/Components/ui/field';
import { actionLinkProps } from '@/Components/ui/button';

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
    const { can } = useAuthorization();
    return (
        <div className="space-y-8">
            {/* SUBSECTION 1: SESSION SECURITY */}
            <div data-tour="system-admin-session-security" className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans">
                        Session Security
                    </h3>
                    <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Inactivity limits governing stockroom terminal locking and user session expiry.
                    </p>
                </div>

                <Field
                    id="security-session-timeout-minutes"
                    label="Terminal Inactivity Auto-Logout"
                    required
                    error={errors['settings.security.session_timeout_minutes']}
                    hint="Valid range: 5 to 480 minutes before automatic lock out."
                    className="max-w-md"
                >
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
                            className="ui-field w-full pr-20 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Minutes
                        </span>
                    </div>
                </Field>
            </div>

            <hr className="border-slate-200/80 dark:border-slate-800" />

            {/* SUBSECTION 2: POLICY BACKUP */}
            <div data-tour="system-admin-policy-snapshot" className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans">
                        Policy Backup & Archival Export
                    </h3>
                    <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Download the current system policy configuration and official signatories snapshot.
                    </p>
                </div>

                {can('system.settings.backup') && <div className="max-w-md">
                    <a
                        {...actionLinkProps('secondary')}
                        href={route('system.settings.backup')}
                    >
                        <Download className="w-4 h-4 text-red-900 dark:text-red-400" aria-hidden="true" />
                        <span>Download Policy Snapshot (JSON)</span>
                    </a>
                </div>}
            </div>

            <hr className="border-slate-200/80 dark:border-slate-800" />

            {/* SUBSECTION 3: RUNTIME INFORMATION */}
            <div data-tour="system-admin-telemetry" className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans">
                        Runtime Environment Information
                    </h3>
                    <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Server node parameters, framework version, and persistence telemetry.
                    </p>
                </div>

                <div className="w-full min-w-0 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm max-w-2xl">
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Server className="w-3.5 h-3.5 text-red-900 dark:text-red-400" />
                            System Environment
                        </span>
                        {telemetry?.cached_at && (
                            <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                                Cached: {telemetry.cached_at}
                            </span>
                        )}
                    </div>

                    <div className="w-full min-w-0 overflow-x-auto">
                        <table className="ui-data-table w-full text-sm text-left min-w-[28rem]">
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <tr>
                                    <th className="px-5 py-3.5 font-medium text-slate-500 dark:text-slate-400 w-1/3 bg-slate-50/40 dark:bg-slate-850/40 align-middle">
                                        PHP Runtime
                                    </th>
                                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100 tabular-nums align-middle">
                                        {telemetry?.php_version ?? 'Unavailable'}
                                    </td>
                                </tr>
                                <tr>
                                    <th className="px-5 py-3.5 font-medium text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-850/40 align-middle">
                                        Framework
                                    </th>
                                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100 align-middle">
                                        {telemetry?.laravel_version ? `Laravel ${telemetry.laravel_version}` : 'Unavailable'}
                                    </td>
                                </tr>
                                <tr>
                                    <th className="px-5 py-3.5 font-medium text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-850/40 align-middle">
                                        Database Driver
                                    </th>
                                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100 tabular-nums align-middle">
                                        {telemetry?.database_driver ? telemetry.database_driver.toUpperCase() : 'Unavailable'}
                                    </td>
                                </tr>
                                <tr>
                                    <th className="px-5 py-3.5 font-medium text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-850/40 align-middle">
                                        Operating Mode
                                    </th>
                                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100 align-middle">
                                        {telemetry?.system_mode ?? 'Unavailable'}
                                    </td>
                                </tr>
                                <tr>
                                    <th className="px-5 py-3.5 font-medium text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-850/40 align-middle">
                                        Server Node
                                    </th>
                                    <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300 tabular-nums align-middle">
                                        {telemetry?.server_node ?? 'Unavailable'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
