import { Button, actionLinkProps } from '@/Components/ui/button';
import { DialogBody, DialogFooter, DialogHeader } from '@/Components/ui/dialog-frame';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, Download, Eye, FileText, LoaderCircle, X } from 'lucide-react';
import Modal from '@/Components/Modal';
import { getLocalDateString } from '@/utils/dateUtils';
import { StockCard, StockCardData } from '../../../../../Official Forms/Stock Card Report';
import { Stock, secondaryButton } from '../inventory';

type DialogStep = 'configure' | 'preview';

export default function StockCardDialog({ stock, onClose }: { stock: Stock | null; onClose: () => void }) {
    const [period, setPeriod] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [step, setStep] = useState<DialogStep>('configure');
    const [previewData, setPreviewData] = useState<StockCardData | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState('');
    const previewRequest = useRef(0);

    useEffect(() => {
        previewRequest.current += 1;
        setPeriod('all');
        setStartDate('');
        setEndDate('');
        setStep('configure');
        setPreviewData(null);
        setIsLoadingPreview(false);
        setPreviewError('');
    }, [stock?.id]);

    const invalidRange = period === 'custom' && Boolean(startDate && endDate && endDate < startDate);
    const monthStart = getLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const start = period === 'month' ? monthStart : period === 'custom' ? startDate : '';
    const end = period === 'month' ? getLocalDateString() : period === 'custom' ? endDate : '';
    const downloadUrl = stock ? route('coordinator.inventory.stock-card', {
        stock: stock.id,
        ...(start ? { start_date: start } : {}),
        ...(end ? { end_date: end } : {}),
    }) : undefined;

    const closeDialog = () => {
        previewRequest.current += 1;
        onClose();
    };

    const showPreview = async () => {
        if (!downloadUrl || invalidRange || isLoadingPreview) return;

        const requestId = ++previewRequest.current;
        setIsLoadingPreview(true);
        setPreviewError('');

        try {
            const response = await axios.get<StockCardData>(downloadUrl, {
                headers: { Accept: 'application/json' },
            });
            if (previewRequest.current !== requestId) return;
            setPreviewData(response.data);
            setStep('preview');
        } catch {
            if (previewRequest.current !== requestId) return;
            setPreviewError('Unable to load the Stock Card preview. Please try again.');
        } finally {
            if (previewRequest.current === requestId) setIsLoadingPreview(false);
        }
    };

    const downloadButton = (
        <a
            {...actionLinkProps('primary')}
            href={invalidRange ? undefined : downloadUrl}
            aria-disabled={invalidRange}
            tabIndex={invalidRange ? -1 : 0}
            className={`ui-button min-h-11 ${invalidRange ? 'pointer-events-none cursor-not-allowed opacity-50' : ''}`}
        >
            <Download size={16} />Download PDF
        </a>
    );

    return <Modal
        show={Boolean(stock)}
        onClose={closeDialog}
        maxWidth={step === 'preview' ? '5xl' : 'lg'}
        ariaLabel={step === 'preview' ? 'Preview Stock Card' : 'Generate a Stock Card'}
    >
        <DialogHeader>
            <div>
                <p className="mb-1 text-sm font-semibold text-red-900 dark:text-red-300">Automated Reporting</p>
                <h2 className="text-slate-900 dark:text-slate-100">{step === 'preview' ? 'Stock Card Preview' : 'Generate Stock Card'}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {step === 'preview' ? 'Review the official Appendix 58 form before downloading it.' : 'Official Appendix 58 · PDF document'}
                </p>
            </div>
            <Button variant="ghost" size="icon" type="button" onClick={closeDialog} aria-label="Close Stock Card dialog">
                <X size={19} />
            </Button>
        </DialogHeader>

        {step === 'configure' ? <>
            <DialogBody className="space-y-5">
                <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                    <FileText size={22} className="shrink-0 text-red-900 dark:text-red-300" />
                    <div>
                        <p className="font-semibold">{stock?.name}</p>
                        <p className="mt-1 tabular-nums text-sm leading-relaxed text-slate-500 dark:text-slate-400">{stock?.sku}</p>
                    </div>
                </div>

                <fieldset>
                    <legend className="mb-2.5 flex items-center gap-2 text-sm font-semibold"><CalendarDays size={16} />Reporting period</legend>
                    <div className="grid grid-cols-3 gap-2">
                        {[{ value: 'all', label: 'All history' }, { value: 'month', label: 'This month' }, { value: 'custom', label: 'Custom dates' }].map(option => <label key={option.value} className={`cursor-pointer rounded-lg border px-2 py-3 text-center text-sm font-semibold transition focus-within:ring-2 focus-within:ring-red-800 ${period === option.value ? "border-red-900 bg-red-50 text-red-900 dark:border-red-400 dark:bg-red-950/40 dark:text-red-200" : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                            <input type="radio" name="stock-card-period" value={option.value} checked={period === option.value} onChange={() => setPeriod(option.value)} className="sr-only" />
                            <span>{option.label}</span>
                        </label>)}
                    </div>
                </fieldset>

                {period === 'custom' && <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="stock-card-start" className="text-sm font-medium">From <span className="text-sm font-normal text-slate-500 dark:text-slate-300">(optional)</span></label>
                        <input id="stock-card-start" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} className="ui-field mt-2 min-h-11 w-full min-w-0 rounded-lg border-slate-300 text-sm focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100" />
                    </div>
                    <div>
                        <label htmlFor="stock-card-end" className="text-sm font-medium">Through <span className="text-sm font-normal text-slate-500 dark:text-slate-300">(optional)</span></label>
                        <input id="stock-card-end" type="date" value={endDate} min={startDate} onChange={event => setEndDate(event.target.value)} aria-invalid={invalidRange} aria-describedby={invalidRange ? 'stock-card-date-error' : undefined} className="ui-field mt-2 min-h-11 w-full min-w-0 rounded-lg border-slate-300 text-sm focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100" />
                    </div>
                </div>}

                {invalidRange && <p id="stock-card-date-error" role="alert" className="text-sm leading-relaxed text-red-700 dark:text-red-300">Choose an end date on or after the start date.</p>}
                {previewError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm leading-relaxed text-red-800 dark:bg-red-950/40 dark:text-red-200">{previewError}</p>}
                <p className="rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">Receipts, issues, and running balances are filled in automatically. Date-filtered reports include the opening balance for your selected period.</p>
            </DialogBody>

            <DialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="secondary" type="button" onClick={closeDialog} className={secondaryButton}>Cancel</Button>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="secondary"
                        type="button"
                        onClick={showPreview}
                        disabled={invalidRange || isLoadingPreview || !downloadUrl}
                        loading={isLoadingPreview}
                        className={`${secondaryButton} min-h-11`}
                    >
                        {!isLoadingPreview && <Eye size={16} />}
                        {isLoadingPreview ? 'Loading Preview...' : 'View Form'}
                    </Button>
                    {downloadButton}
                </div>
            </DialogFooter>
        </> : <>
            <DialogBody className="max-h-[68vh] overflow-auto bg-slate-100 p-3 sm:p-6 dark:bg-slate-950">
                <div data-paper-preview className="mx-auto min-w-[720px] max-w-[794px] bg-white p-4 text-black shadow-md sm:p-6">
                    {previewData && <StockCard data={previewData} />}
                </div>
            </DialogBody>
            <DialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="secondary" type="button" onClick={() => setStep('configure')} className={secondaryButton}><ArrowLeft size={16} />Back to Options</Button>
                {downloadButton}
            </DialogFooter>
        </>}
    </Modal>;
}
