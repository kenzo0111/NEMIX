import { useForm } from '@inertiajs/react';
import useAuthorization from '@/Hooks/useAuthorization';
import { SupplyRequest } from '../types';

export default function SupportingDocumentPanel({ request, review = false }: {
    request: Pick<SupplyRequest, 'id' | 'status' | 'requires_supporting_document' | 'supporting_document_name' | 'supporting_document_type' | 'document_verified_at' | 'document_verification_remarks' | 'document_verifier'>;
    review?: boolean;
}) {
    const { can } = useAuthorization();
    const form = useForm({ decision: 'verified', remarks: '' });
    if (!request.requires_supporting_document) return null;

    return <section className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700" aria-label="Supporting Document">
        <h3 className="font-semibold">Supporting Document</h3>
        <p className="text-sm">{request.supporting_document_type} · {request.supporting_document_name}</p>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-red-900 dark:text-red-300">
            <a href={route('inventory.requests.document', { supplyRequest: request.id, inline: 1 })} target="_blank" rel="noopener noreferrer">Preview document</a>
            <a href={route('inventory.requests.document', request.id)}>Download document</a>
        </div>
        {request.document_verified_at && <p className="text-sm text-slate-500">{request.status === 'For Correction' ? 'Returned for correction' : 'Document reviewed'} by {request.document_verifier?.name || 'SPMO personnel'} · {new Date(request.document_verified_at).toLocaleString()}</p>}
        {request.document_verification_remarks && <p className="text-sm whitespace-pre-wrap">{request.document_verification_remarks}</p>}
        {review && request.status === 'Pending Verification' && can('inventory.requests.verify-document') && <div className="space-y-3">
            <p className="text-sm text-slate-500">Review the document’s authenticity, completeness, and approval before verifying.</p>
            <label className="block text-sm">Verification decision
                <select value={form.data.decision} onChange={e => form.setData('decision', e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-900">
                    <option value="verified">Verified — proceed to inventory review</option>
                    <option value="correction">Return for correction</option>
                </select>
            </label>
            <label className="block text-sm">Remarks {form.data.decision === 'correction' && '(required)'}
                <textarea maxLength={2000} value={form.data.remarks} onChange={e => form.setData('remarks', e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-900" />
            </label>
            {Object.values(form.errors).map((error, i) => <p key={i} role="alert" className="text-sm text-red-600">{error}</p>)}
            <button type="button" disabled={form.processing || (form.data.decision === 'correction' && !form.data.remarks.trim())} onClick={() => form.post(route('inventory.requests.verify-document', request.id), { preserveScroll: true })} className="rounded-md bg-red-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save Document Review</button>
        </div>}
    </section>;
}
