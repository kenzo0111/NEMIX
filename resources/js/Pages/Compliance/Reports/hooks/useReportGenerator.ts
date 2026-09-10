import { useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { getLocalDateString } from '@/utils/dateUtils';
import { ReportDatasetResponse, ReportFormData, ReportPeriodType, ReportType } from '../types';

export function useReportGenerator(
    reports: any[] = [],
    migratedRecords: any[] = [],
    onSuccess?: () => void,
) {
    const today = getLocalDateString();
    const [currentStep, setCurrentStep] = useState<'configure' | 'preview'>('configure');
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewDataset, setPreviewDataset] = useState<ReportDatasetResponse | null>(null);

    const initialFormData: ReportFormData = {
        title: '',
        type: 'RSMI',
        reference: '',
        itemName: '',
        supplierId: '',
        supplierName: '',
        endUser: '',
        generatedDate: today,
        periodType: 'monthly',
        date: today,
        startDate: '',
        endDate: '',
        selectedMonth: new Date().getMonth() + 1,
        selectedYear: new Date().getFullYear(),
    };

    const [formData, setFormData] = useState<ReportFormData>(initialFormData);

    const reset = () => {
        setFormData({
            ...initialFormData,
            generatedDate: getLocalDateString(),
            date: getLocalDateString(),
            selectedMonth: new Date().getMonth() + 1,
            selectedYear: new Date().getFullYear(),
        });
        setCurrentStep('configure');
        setPreviewDataset(null);
    };

    const updateField = (field: keyof ReportFormData, value: any) => {
        setFormData((prev) => {
            const next = { ...prev, [field]: value };
            if (field === 'type') {
                if (value === 'RSMI') next.title = 'RSMI - Supplies and Materials Issued';
                else if (value === 'RPCI') next.title = 'RPCI - Physical Count of Inventories';
                else if (value === 'STOCK_CARD') next.title = next.itemName ? `Stock Card - ${next.itemName}` : 'Stock Card';
                else if (value === 'MR') next.title = next.endUser ? `Memorandum Receipt - ${next.endUser}` : 'Memorandum Receipt for Property';
            }
            if (field === 'itemName' && next.type === 'STOCK_CARD') {
                next.title = value ? `Stock Card - ${value}` : 'Stock Card';
            }
            if (field === 'endUser' && next.type === 'MR') {
                next.title = value ? `Memorandum Receipt - ${value}` : 'Memorandum Receipt for Property';
            }
            return next;
        });
    };

    const fetchPreviewDataset = async (): Promise<boolean> => {
        if (!formData.type) return false;
        setIsLoadingPreview(true);

        try {
            const response = await axios.post(route('compliance.reports.preview_dataset'), {
                type: formData.type,
                title: formData.title,
                reference: formData.reference,
                itemName: formData.itemName,
                supplierId: formData.supplierId || null,
                endUser: formData.endUser,
                periodType: formData.periodType,
                date: formData.date,
                startDate: formData.startDate,
                endDate: formData.endDate,
                selectedMonth: formData.selectedMonth,
                selectedYear: formData.selectedYear,
                generatedDate: formData.generatedDate,
            });

            if (response.data) {
                setPreviewDataset(response.data);
                if (response.data.reference && !formData.reference) {
                    setFormData((prev) => ({ ...prev, reference: response.data.reference }));
                }
                setCurrentStep('preview');
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to fetch authoritative preview dataset:', err);
            // Fallback step change even if offline/failed
            setCurrentStep('preview');
            return false;
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const submitReport = (
        onFinishCallback?: (res: { success: boolean; message: string }) => void,
    ) => {
        setIsSubmitting(true);

        const genDate = formData.generatedDate || getLocalDateString();
        const payload = {
            ...formData,
            title: formData.title || `${formData.type} Report`,
            type: formData.type,
            reference: formData.reference || previewDataset?.reference || '',
            periodType: formData.periodType || 'all',
            generatedDate: genDate,
            coverageLabel: previewDataset?.coverageLabel || formData.date,
            payload: {
                ...formData,
                generatedDate: genDate,
                coverageLabel: previewDataset?.coverageLabel,
            },
        };

        router.post(route('compliance.reports.store'), payload, {
            preserveScroll: true,
            onStart: () => setIsSubmitting(true),
            onFinish: () => setIsSubmitting(false),
            onSuccess: () => {
                reset();
                onSuccess?.();
                onFinishCallback?.({
                    success: true,
                    message: 'Compliance report successfully recorded in the official registry.',
                });
            },
            onError: () => {
                onFinishCallback?.({
                    success: false,
                    message: 'Unable to record compliance report. Please check input criteria.',
                });
            },
        });
    };

    return {
        formData,
        setFormData,
        updateField,
        currentStep,
        setCurrentStep,
        previewDataset,
        isLoadingPreview,
        isSubmitting,
        fetchPreviewDataset,
        submitReport,
        reset,
    };
}
