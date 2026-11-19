import React from 'react';
import { X } from 'lucide-react';
import Modal from '@/Components/Modal';

export default function RecordDetailsModal({ show, title, description, onClose, children, actions, maxWidth = '2xl' }: {
    show: boolean; title: string; description?: React.ReactNode; onClose: () => void; children: React.ReactNode; actions?: React.ReactNode; maxWidth?: '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}) {
    return <Modal show={show} onClose={onClose} maxWidth={maxWidth} ariaLabel={title}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6 dark:border-slate-800">
            <div className="min-w-0"><h2 className="break-words text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}</div>
            <button type="button" aria-label={`Close ${title}`} onClick={onClose} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:hover:bg-slate-800"><X size={19} aria-hidden="true" /></button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-5 sm:p-6">{children}</div>
        <div className="table-toolbar flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
            <button type="button" onClick={onClose} className="table-control rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Close</button>{actions}
        </div>
    </Modal>;
}
