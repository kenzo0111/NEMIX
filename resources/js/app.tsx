import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import GlobalNotifications from '@/Components/GlobalNotifications';
import { FlashMessages } from '@/types';
import { SYSTEM_TITLE } from '@/utils/systemIdentity';

const appName = import.meta.env.VITE_APP_NAME || 'SupplySync';

createInertiaApp({
    title: (title) => `${title ? `${title} | ` : ''}${SYSTEM_TITLE} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<><App {...props} /><GlobalNotifications initialFlash={props.initialPage.props.flash as FlashMessages | undefined} /></>);
    },
    progress: {
        color: '#4B5563',
    },
});
