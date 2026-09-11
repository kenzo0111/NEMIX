import React from 'react';
import { useForm } from '@inertiajs/react';
import { SystemSettings } from '../types';
import { Info, Send } from 'lucide-react';

interface NotificationSettingsProps {
    settings: SystemSettings;
    onChange: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
    errors?: Record<string, string>;
    defaultAdminEmail?: string;
    onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function NotificationSettings({
    settings,
    onChange,
    errors = {},
    defaultAdminEmail = 'admin@ucn.edu.ph',
    onToast,
}: NotificationSettingsProps) {
    // Independent form for testing SMTP diagnostics without saving general settings
    const testEmailForm = useForm<{ recipient: string }>({
        recipient: '',
    });

    const handleSendTest = (e: React.FormEvent) => {
        e.preventDefault();
        testEmailForm.post(route('system.settings.test-email'), {
            preserveScroll: true,
            onSuccess: (page: any) => {
                if (page?.props?.flash?.error) {
                    onToast('error', page.props.flash.error);
                } else {
                    onToast(
                        'success',
                        page?.props?.flash?.success ||
                            `Diagnostic test email dispatched to ${testEmailForm.data.recipient || defaultAdminEmail}.`
                    );
                    testEmailForm.reset();
                }
            },
            onError: (formErrors: any) => {
                const message =
                    Object.values(formErrors).flat().join('\n') ||
                    'Failed to dispatch test email. Please check your mail configuration.';
                onToast('error', message);
            },
        });
    };

    return (
        <div className="space-y-8">
            {/* EMAIL ALERTS CONFIGURATION */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Stock Alert Email Notifications
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Automated notifications dispatched to custodial staff when consumable inventory reaches threshold.
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                    <input
                        type="checkbox"
                        id="low_stock_mail"
                        checked={settings['mail.low_stock_email_alerts']}
                        onChange={(e) =>
                            onChange('mail.low_stock_email_alerts', e.target.checked)
                        }
                        className="w-4 h-4 mt-0.5 rounded text-red-900 focus:ring-red-800 border-slate-300 cursor-pointer"
                    />
                    <div className="flex-1">
                        <label
                            htmlFor="low_stock_mail"
                            className="text-xs font-semibold text-slate-900 cursor-pointer"
                        >
                            Dispatch Automated Low-Stock Warning Emails
                        </label>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            Sends an automated email notification to designated personnel when an item balance dips to or below its reorder point.
                        </p>
                    </div>
                </div>

                <div className="space-y-1.5 max-w-xl">
                    <label className="text-xs font-semibold text-slate-700 block">
                        Alert Recipient Email
                    </label>
                    <input
                        type="email"
                        value={settings['mail.alert_recipient_email']}
                        onChange={(e) =>
                            onChange('mail.alert_recipient_email', e.target.value)
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                        placeholder="spmo-alerts@ucn.edu.ph"
                    />
                    {errors['settings.mail.alert_recipient_email'] && (
                        <p className="text-xs text-red-600 mt-1">
                            {errors['settings.mail.alert_recipient_email']}
                        </p>
                    )}
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        Leave blank to route alerts to the currently logged-in administrator's email.
                    </p>
                </div>
            </div>

            <hr className="border-slate-200/80" />

            {/* TEST EMAIL DIAGNOSTICS */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Test Email Delivery
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Verify outbound SMTP transport connectivity without modifying policy configuration.
                    </p>
                </div>

                <form onSubmit={handleSendTest} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                    <div className="flex-1">
                        <input
                            type="email"
                            value={testEmailForm.data.recipient}
                            onChange={(e) => testEmailForm.setData('recipient', e.target.value)}
                            placeholder={`Recipient (Default: ${defaultAdminEmail})`}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-red-900/15 focus:border-red-800 shadow-2xs"
                        />
                        {testEmailForm.errors.recipient && (
                            <p className="text-xs text-red-600 mt-1">{testEmailForm.errors.recipient}</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={testEmailForm.processing}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-900 hover:bg-red-800 active:bg-red-950 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs shrink-0"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>{testEmailForm.processing ? 'Testing Connection...' : 'Send Test'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
