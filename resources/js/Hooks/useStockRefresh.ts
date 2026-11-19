import { useEffect } from 'react';
import { router } from '@inertiajs/react';

/** Refresh server stock/quota values without replacing an open form's local edits. */
export default function useStockRefresh(props: string[]) {
    const signature = JSON.stringify(props);
    useEffect(() => {
        let busy = false;
        const offStart = router.on('start', () => { busy = true; });
        const offFinish = router.on('finish', () => { busy = false; });
        const refresh = () => {
            if (busy || document.visibilityState !== 'visible') return;
            router.reload({ only: JSON.parse(signature) });
        };
        const timer = window.setInterval(refresh, 5000);
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', refresh);
            offStart(); offFinish();
        };
    }, [signature]);
}
