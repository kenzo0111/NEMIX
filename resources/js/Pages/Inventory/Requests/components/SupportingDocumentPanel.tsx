import { formatTimestamp } from '@/utils/displayFormat';
import { Button } from '@/Components/ui/button';
import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import useAuthorization from '@/Hooks/useAuthorization';
import { SupplyRequest } from '../types';

export default function SupportingDocumentPanel({ request, review = false }: {
    request: Pick<SupplyRequest, 'id' | 'status' | 'requires_supporting_document' | 'supporting_document_name' | 'supporting_document_type' | 'document_verified_at' | 'document_verification_remarks' | 'document_verifier'>;
    review?: boolean;
}) {
    const { can } = useAuthorization();
    const [inspectConfirmed, setInspectConfirmed] = useState(false);
    const form = useForm({ decision: 'verified', remarks: '' });
    if (!request.requires_supporting_document) return null;

    return <section className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700 bg-white dark:bg-slate-900/60" aria-label="Supporting Document">
        <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Supporting Document Verification</h3>
            <span className="text-sm font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-300">
                Official Document
            </span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{request.supporting_document_type} · {request.supporting_document_name}</p>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-red-900 dark:text-red-300">
            <a href={route('inventory.requests.document', { supplyRequest: request.id, inline: 1 })} target="_blank" rel="noopener noreferrer" className="hover:underline">Preview document</a>
            <a href={route('inventory.requests.document', request.id)} className="hover:underline">Download document</a>
        </div>
        {request.document_verified_at && <p className="text-sm text-slate-500 dark:text-slate-300">{request.status === 'For Correction' ? 'Returned for correction' : 'Document reviewed'} by {request.document_verifier?.name || 'SPMO personnel'} · {formatTimestamp(request.document_verified_at)}</p>}
        {request.document_verification_remarks && <p className="text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-400">{request.document_verification_remarks}</p>}
        {review && request.status === 'Pending Verification' && can('inventory.requests.verify-document') && <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-300">Review the document's authenticity, signatures, and completeness before approving.</p>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Verification decision
                <select id={`verification-decision-${request.id}`} aria-invalid={Boolean(form.errors.decision)} aria-describedby={form.errors.decision ? `verification-decision-${request.id}-error` : undefined} value={form.data.decision} onChange={e => form.setData('decision', e.target.value)} className="ui-field mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-900 dark:border-slate-700 text-sm">
                    <option value="verified">Verified — proceed to inventory review</option>
                    <option value="correction">Return for correction</option>
                </select>
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Remarks {form.data.decision === 'correction' && '(required)'}
                <textarea id={`verification-remarks-${request.id}`} aria-invalid={Boolean(form.errors.remarks)} aria-describedby={form.errors.remarks ? `verification-remarks-${request.id}-error` : undefined} maxLength={2000} value={form.data.remarks} onChange={e => form.setData('remarks', e.target.value)} placeholder="Add review notes, physical inspection remarks, or correction instructions..." className="ui-field mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-900 dark:border-slate-700 text-sm" />
            </label>

            {form.data.decision === 'verified' && (
                <div className="flex items-start gap-3 p-3 bg-red-50/60 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/40">
                    <input
                        type="checkbox"
                        id={`inspect_confirmed_${request.id}`}
                        checked={inspectConfirmed}
                        onChange={(e) => setInspectConfirmed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-900 focus:ring-red-900 dark:border-slate-700 dark:bg-slate-900 cursor-pointer dark:text-red-300"
                    />
                    <label htmlFor={`inspect_confirmed_${request.id}`} className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer leading-relaxed">
                        I personally inspected the physical supporting documents and confirmed that these details and authority signatures match this requisition.
                    </label>
                </div>
            )}

            {Object.entries(form.errors).map(([field, error]) => <p key={field} id={`verification-${field}-${request.id}-error`} role="alert" className="text-sm text-red-600 dark:text-red-300">{error}</p>)}
            <Button variant={form.data.decision === 'verified' ? 'primary' : 'danger'}
                type="button"
                disabled={form.processing || (form.data.decision === 'correction' && !form.data.remarks.trim()) || (form.data.decision === 'verified' && !inspectConfirmed)}
                onClick={() => form.post(route('inventory.requests.verify-document', request.id), { preserveScroll: true })}
                className="w-full sm:w-auto"
            >
                {form.data.decision === 'verified' ? 'Save and Mark Ready' : 'Return for Correction'}
            </Button>
        </div>}
    </section>;
}
