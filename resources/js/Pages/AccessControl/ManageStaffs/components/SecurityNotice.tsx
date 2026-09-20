import React from 'react';
import { Info } from 'lucide-react';

export default function SecurityNotice() {
    return (
        <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-lg shrink-0 mt-0.5 border border-amber-200/70 dark:border-amber-700">
                <Info className="w-4 h-4" />
            </div>
            <div className="leading-relaxed">
                <strong className="font-semibold block text-amber-950 dark:text-amber-300 mb-0.5">
                    Security System Advisory:
                </strong>
                Account privilege changes and status toggles take effect automatically upon user re-authentication. Users currently active in the system will receive updated permissions on their next session.
            </div>
        </div>
    );
}

