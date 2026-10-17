# Global action notifications

Implemented 18 October 2026. This supersedes the action-result UI described in the earlier dashboard notification audit.

`resources/js/app.tsx` mounts `GlobalNotifications` once beside the Inertia app. The toast host persists across page changes and also covers pages that do not use AppLayout.

- Backend `flash.success`, `flash.error`, `flash.warning`, and `flash.status` are consumed on completed mutation visits. Existing receiving, request approval/rejection/release, supplier saves, staff, roles, profile, settings, and other controllers automatically use the same host.
- Explicit frontend or Axios results use `notify({ type: 'success' | 'error' | 'warning' | 'info', message, title? })` from `@/utils/notifications`.
- Server validation errors get a global summary while individual form errors remain beside their fields. Network exceptions and unexpected non-Inertia responses get a readable error. Session-expiry responses ask the user to refresh and sign in.
- Success and information messages dismiss after five seconds, with pause on hover or keyboard focus. Errors and warnings stay until dismissed. Every message has a dismiss button.
- Messages stack at the top right on desktop and within the viewport on mobile. Routine messages use a polite status region; errors use an assertive alert region. While a modal is open, the host moves inside its dialog boundary so it remains accessible and its dismiss buttons can receive focus. Notifications are hidden in print.
- Each action can announce an identical message again. A backend flash plus that visit's local callback produces one result per severity. A warning/error suppresses an accompanying generic success callback.
- Form validation, confirmation dialogs, RFID duplicate/unassigned scan notices, progress indicators, and password workflow screens remain contextual. Report result-only dialogs, page result banners, and the old system-mode toast have been replaced by the common host.

Report preview and PDF export errors now notify explicitly. Successful export asks the user to check browser downloads. Hardware enable/disable and revoke now show a success toast and reload device props instead of clearing feedback through a full-page reload. OTP request/resend/password-change Axios handlers also use the common host.

Do not report physical printing, email inbox delivery, or hardware-applied configuration as complete merely because a browser action or server queue request succeeded.

## Verification

- `node node_modules/typescript/bin/tsc --noEmit`
- `node tests/Frontend/notifications.test.mjs`
- `node --test --test-concurrency=1 tests/Frontend/*.test.mjs`
- `npm run build`

The lifecycle regression test exercises flash/callback deduplication, repeated identical actions, warning precedence, validation summaries, background partial polls, independent Axios results, dismissal, error formatting, network failures, expired sessions, and subscription cleanup. It uses an event adapter for the router; it does not claim a full browser/backend integration run.

The standalone preview under `tmp/notification-preview/` can exercise success/error/warning/info messages, page-state changes, and modal interaction without connecting to production data. The available preview browser could not reach the local dev server during this implementation, so visual browser verification is outstanding. PHP integration tests remain blocked by the missing `vendor/autoload.php` reported during the preceding audit.

The persistent request-alert bell, its recipients, queue synchronization, and dashboard metric refresh are separate from action-result toasts. The audit's request-alert pagination/refresh and dashboard-freshness findings remain separate work.
