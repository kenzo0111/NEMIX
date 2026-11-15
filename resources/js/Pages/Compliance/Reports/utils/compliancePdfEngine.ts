/**
 * Standardized server-backed PDF generation for official COA compliance forms.
 */

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
    const csrfToken =
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ||
        '';

    const safeName = [reportInfo.type, reportInfo.reference, reportInfo.title]
        .filter(Boolean)
        .join('_')
        .replace(/[^a-z0-9_-]+/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    const fileName = `${safeName || 'compliance_report'}.pdf`;

    const requestBody = buildCompliancePdfRequestBody(reportInfo);

    const response = await fetch('/compliance/reports/export-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            Accept: 'application/pdf',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        let message = `PDF export failed with status ${response.status}`;
        try {
            const errorBody = await response.json();
            if (typeof errorBody?.message === 'string' && errorBody.message.trim()) {
                message = errorBody.message;
            }
        } catch {
            // Keep the status-based error when the server did not return JSON.
        }
        throw new Error(message);
    }

    const blob = await response.blob();
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
