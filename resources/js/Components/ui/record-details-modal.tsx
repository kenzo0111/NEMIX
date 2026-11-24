import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import Modal from '@/Components/Modal';
import { Button } from './button';
import { DialogHeader, DialogBody, DialogFooter } from './dialog-frame';
export default function RecordDetailsModal({ show, title, description, onClose, children, actions, maxWidth = '2xl' }: {
    show: boolean; title: string; description?: ReactNode; onClose: () => void; children: ReactNode; actions?: ReactNode;
    maxWidth?: 'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'4xl'|'5xl'|'6xl'|'7xl';
}) {
    return <Modal show={show} onClose={onClose} maxWidth={maxWidth} ariaLabel={title}>
        <DialogHeader><div className="min-w-0"><h2 className="break-words text-xl font-semibold">{title}</h2>{description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>}</div><Button variant="ghost" size="icon" aria-label={`Close ${title}`} onClick={onClose}><X size={19} aria-hidden="true" /></Button></DialogHeader>
        <DialogBody className="max-h-[65vh]">{children}</DialogBody>
        <DialogFooter><Button onClick={onClose}>Close</Button>{actions}</DialogFooter>
    </Modal>;
}
