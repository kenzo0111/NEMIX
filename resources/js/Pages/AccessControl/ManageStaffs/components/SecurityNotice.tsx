import React from 'react';
import { Info } from 'lucide-react';

export default function SecurityNotice() {
    return (
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-lg p-3.5 flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
            <div className="p-1.5 bg-amber-100/70 text-amber-800 rounded shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
            </div>
            <div className="leading-relaxed">
                <strong className="font-semibold block text-amber-950 mb-0.5">
                    Security System Advisory:
                </strong>
                Account privilege changes and status toggles take effect automatically upon user re-authentication. Users currently active in the system will receive updated permissions on their next session.
            </div>
        </div>
    );
}
