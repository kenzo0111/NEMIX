import { Button } from '@/Components/ui/button';
import Field from '@/Components/ui/field';
import React from 'react';
import { useForm } from '@inertiajs/react';
import { SystemSettings } from '../types';
import { Send } from 'lucide-react';
import { useAuthorization } from '@/Hooks/useAuthorization';

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
    const { can } = useAuthorization();
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
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans">
                        Stock Alert Email Notifications
                    </h3>
                    <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Automated notifications dispatched to custodial staff when consumable inventory reaches threshold.
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5">
                    <input
                        type="checkbox"
                        id="low_stock_mail"
                        checked={settings['mail.low_stock_email_alerts']}
                        onChange={(e) =>
                            onChange('mail.low_stock_email_alerts', e.target.checked)
                        }
                        className="w-4 h-4 mt-0.5 rounded text-red-900 focus:ring-red-800 border-slate-300 dark:border-slate-600 dark:bg-slate-900 cursor-pointer dark:text-red-300"
                    />
                    <div className="flex-1">
                        <label
                            htmlFor="low_stock_mail"
                            className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer"
                        >
                            Dispatch Automated Low-Stock Warning Emails
                        </label>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Sends an automated email notification to designated personnel when an item balance dips to or below its reorder point.
                        </p>
                    </div>
                </div>

                <Field
                    id="mail-alert-recipient-email"
                    label="Alert Recipient Email"
                    error={errors['settings.mail.alert_recipient_email']}
                    hint="Leave blank to use the current administrator's email, or an active system administrator when stock is updated by other staff."
                    className="max-w-xl"
                >
                    <input
                        type="email"
                        value={settings['mail.alert_recipient_email']}
                        onChange={(e) =>
                            onChange('mail.alert_recipient_email', e.target.value)
                        }
                        className="ui-field w-full"
                        placeholder="spmo-alerts@ucn.edu.ph"
                    />
                </Field>
            </div>

            <hr className="border-slate-200/80 dark:border-slate-800" />

            {/* TEST EMAIL DIAGNOSTICS */}
            {can('system.settings.test-email') && <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans">
                        Test Email Delivery
                    </h3>
                    <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Verify outbound SMTP transport connectivity without modifying policy configuration.
                    </p>
                </div>

                <form onSubmit={handleSendTest} className="flex flex-col sm:flex-row sm:items-end gap-3 max-w-xl">
                    <Field
                        id="test-email-recipient"
                        label="Test Recipient Email"
                        error={testEmailForm.errors.recipient}
                        className="flex-1"
                    >
                        <input
                            type="email"
                            value={testEmailForm.data.recipient}
                            onChange={(e) => testEmailForm.setData('recipient', e.target.value)}
                            placeholder={`Recipient (Default: ${defaultAdminEmail})`}
                            className="ui-field w-full"
                        />
                    </Field>
                    <Button variant="primary"
                        type="submit"
                        loading={testEmailForm.processing}
                        className="shrink-0"
                    >
                        {!testEmailForm.processing && <Send className="w-3.5 h-3.5" aria-hidden="true" />}
                        <span>{testEmailForm.processing ? 'Testing Connection...' : 'Send Test'}</span>
                    </Button>
                </form>
            </div>}
        </div>
    );
}
