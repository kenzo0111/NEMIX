import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import NotificationToasts from '@/Components/NotificationToasts';
import Modal from '@/Components/Modal';
import { notify, notifyFlash, beginNotificationVisit, finishNotificationVisit } from '@/utils/notifications';
import '../../resources/css/app.css';

function Preview() {
    const [open, setOpen] = useState(false);
    const [page, setPage] = useState('Inventory');
    const button = 'm-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900';
    const saved = () => {
        beginNotificationVisit();
        notifyFlash({ success: 'Inventory item saved successfully.' });
        notify({ type: 'success', message: 'Item saved.' });
        finishNotificationVisit();
    };
    return <div className="min-h-screen bg-slate-100 p-8 text-slate-900">
        <h1 className="text-2xl font-bold">NEMIX notification verification</h1>
        <p className="my-4">Current page: {page}</p>
        <button className={button} onClick={saved}>Save item</button>
        <button className={button} onClick={() => notify({ type: 'error', message: 'Insufficient stock. Reduce the quantity and try again.' })}>Show error</button>
        <button className={button} onClick={() => notify({ type: 'warning', message: 'This RFID tag is already included in the batch.' })}>Show warning</button>
        <button className={button} onClick={() => notify({ type: 'info', message: 'Scanner configuration queued. Waiting for the device.' })}>Show information</button>
        <button className={button} onClick={() => setPage(page === 'Inventory' ? 'Reports' : 'Inventory')}>Change page</button>
        <button className={button} onClick={() => setOpen(true)}>Open receiving dialog</button>
        <Modal show={open} onClose={() => setOpen(false)} ariaLabel="Receiving test dialog">
            <div className="p-6"><h2 className="text-xl font-bold">Receiving test dialog</h2>
                <button className={button} onClick={() => notify({ type: 'error', message: 'Select an active supplier before receiving items.' })}>Validate receiving</button>
                <button className={button} onClick={() => setOpen(false)}>Close dialog</button>
            </div>
        </Modal>
        <NotificationToasts />
    </div>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
