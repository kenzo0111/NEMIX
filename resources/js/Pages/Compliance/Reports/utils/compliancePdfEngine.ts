/**
 * Standardized server-backed PDF generation for official COA compliance forms.
 */

import axios from 'axios';

export interface ReportPdfMetadata {
    id?: number | string | null;
    report_id?: number | string | null;
    type?: string | null;
    reference?: string | null;
    title?: string | null;
    periodType?: string | null;
    selectedMonth?: number | null;
    selectedYear?: number | null;
    date?: string | null;
    dateValue?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    payload?: any;
}

export const buildCompliancePdfRequestBody = (
    reportInfo: ReportPdfMetadata,
): Record<string, unknown> => {
    const reportId = reportInfo.id ?? reportInfo.report_id ?? null;

    // Saved reports already contain the authoritative snapshot and filters. Sending
    // display-only coverage labels back as dates can fail validation, so identify
    // saved reports only by their ID.
    if (reportId) {
        return { report_id: reportId };
    }

    return {
        report_id: null,
        type: reportInfo.type,
        reference: reportInfo.reference,
        title: reportInfo.title,
        periodType: reportInfo.periodType,
        selectedMonth: reportInfo.selectedMonth,
        selectedYear: reportInfo.selectedYear,
        date: reportInfo.dateValue || reportInfo.date,
        startDate: reportInfo.startDate,
        endDate: reportInfo.endDate,
        payload: reportInfo.payload,
    };
};

export const downloadCompliancePdfFromBackend = async (
    reportInfo: ReportPdfMetadata,
): Promise<void> => {
    const safeName = [reportInfo.type, reportInfo.reference, reportInfo.title]
        .filter(Boolean)
        .join('_')
        .replace(/[^a-z0-9_-]+/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    const fileName = `${safeName || 'compliance_report'}.pdf`;

    const requestBody = buildCompliancePdfRequestBody(reportInfo);

    let blob: Blob;
    try {
        // Inertia login regenerates the session token without replacing the page's
        // CSRF meta tag. Axios reads the current XSRF-TOKEN cookie for each request.
        const response = await axios.post<Blob>('/compliance/reports/export-pdf', requestBody, {
            responseType: 'blob',
            // Laravel uses the first accepted type to format validation/session errors.
            headers: { Accept: 'application/json, application/pdf' },
        });
        blob = response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
            try {
                error.response.data = JSON.parse(await error.response.data.text());
            } catch {
                // Keep the HTTP error when the server did not return JSON.
            }
        }
        throw error;
    }

    if (blob.type.split(';')[0].trim().toLowerCase() !== 'application/pdf') {
        throw new Error('The server did not return a report PDF. Please try again.');
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export const generateCompliancePdf = async (
    _paperElement: HTMLElement,
    reportInfo: ReportPdfMetadata,
): Promise<void> => {
    await downloadCompliancePdfFromBackend(reportInfo);
};
