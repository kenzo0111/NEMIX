import React, { useEffect } from 'react';
import { router } from '@inertiajs/react';
import NotificationToasts from './NotificationToasts';
import { FlashMessages } from '@/types';
import { beginNotificationVisit, finishNotificationVisit, notify, notifyFlash } from '@/utils/notifications';

export default function GlobalNotifications({ initialFlash }: { initialFlash?: FlashMessages }) {
    useEffect(() => {
        notifyFlash(initialFlash);
        let mutation = false;
        let lastFlash = initialFlash;
        const offStart = router.on('start', ({ detail }) => {
            if (detail.visit.async && detail.visit.method.toLowerCase() === 'get') return;
            mutation = detail.visit.method.toLowerCase() !== 'get';
        });
        const offSuccess = router.on('success', ({ detail }) => {
            const flash = detail.page.props.flash as FlashMessages | undefined;
            // Partial background reloads retain the same flash object; they are not a new result.
            if (mutation && flash !== lastFlash) {
                beginNotificationVisit();
                notifyFlash(flash);
                finishNotificationVisit();
            }
            lastFlash = flash;
        });
        const offError = router.on('error', ({ detail }) => {
            beginNotificationVisit();
            const messages = Object.values(detail.errors).flat().filter((value): value is string => typeof value === 'string');
            notify({ type: 'error', message: messages.join(' ') || 'Unable to complete this action. Check the highlighted fields and try again.' });
            finishNotificationVisit();
        });
        const offException = router.on('exception', () => {
            beginNotificationVisit();
            notify({ type: 'error', message: 'The request could not be completed. Check your connection and try again. If you submitted stock changes, verify the record before retrying.' });
            finishNotificationVisit();
        });
        const offInvalid = router.on('invalid', ({ detail }) => {
            beginNotificationVisit();
            const status = detail.response.status;
            notify({ type: 'error', message: status === 401 || status === 419
                ? 'Your session has expired. Refresh the page and sign in again before retrying.'
                : 'The server returned an unexpected response. Try again later. If you submitted stock changes, verify the record before retrying.' });
            finishNotificationVisit();
            // Show the common error UI instead of injecting an unexpected HTML response into a dialog.
            return false;
        });
        const offFinish = router.on('finish', ({ detail }) => {
            if (detail.visit.async && detail.visit.method.toLowerCase() === 'get') return;
            mutation = false;
            finishNotificationVisit();
        });
        return () => { offStart(); offSuccess(); offError(); offException(); offInvalid(); offFinish(); };
    }, []);
    return <NotificationToasts />;
}
