import React from 'react';
import ReportsIndex from './Reports/Index';
import { ManageReportsPageProps } from './Reports/types';
import { getLocalDateString } from '@/utils/dateUtils';
export { formatFundClusterDisplay } from './Reports/constants';

// Backward-compatible helper export
export const generateReportReference = (
    targetDate?: string,
    allReports: any[] = [],
    allMigrations: any[] = [],
): string => {
    const datePrefix = getLocalDateString(targetDate) || getLocalDateString();

    const existingRefs: string[] = [
        ...allReports.map((r: any) => r?.reference || ''),
        ...allMigrations.map(
            (m: any) =>
                m?.reference ||
                m?.serial_no ||
                m?.ris_no ||
                m?.reference_no ||
                m?.memorial_no ||
                '',
        ),
    ].filter(Boolean);

    let maxSeq = 0;
    const prefixRegex = new RegExp(`^${datePrefix}-(\\d+)$`);

    existingRefs.forEach((ref) => {
        const trimmed = String(ref).trim();
        const match = trimmed.match(prefixRegex);
        if (match) {
            const seq = parseInt(match[1], 10);
            if (!isNaN(seq) && seq > maxSeq) {
                maxSeq = seq;
            }
        }
    });

    const nextSeq = maxSeq + 1;
    const sequel = String(nextSeq).padStart(4, '0');
    return `${datePrefix}-${sequel}`;
};

export default function ManageReports(props: ManageReportsPageProps) {
    return <ReportsIndex {...props} />;
}