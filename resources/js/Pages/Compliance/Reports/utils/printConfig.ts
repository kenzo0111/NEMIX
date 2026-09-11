/**
 * Standard Print Configuration & Execution Engine for Official COA Compliance Forms
 */

export interface CompliancePrintConfig {
    orientation: 'portrait' | 'landscape';
    paperSize: 'A4';
    margin: string;
}

export const REPORT_PRINT_CONFIGS: Record<string, CompliancePrintConfig> = {
    STOCK_CARD: {
        orientation: 'portrait',
        paperSize: 'A4',
        margin: '8mm',
    },
    RSMI: {
        orientation: 'portrait',
        paperSize: 'A4',
        margin: '8mm',
    },
    RPCI: {
        orientation: 'landscape',
        paperSize: 'A4',
        margin: '8mm',
    },
    MR: {
        orientation: 'portrait',
        paperSize: 'A4',
        margin: '8mm',
    },
    MOR: {
        orientation: 'portrait',
        paperSize: 'A4',
        margin: '8mm',
    },
};

export const getCompliancePrintConfig = (type?: string | null): CompliancePrintConfig => {
    if (type && REPORT_PRINT_CONFIGS[type]) {
        return REPORT_PRINT_CONFIGS[type];
    }
    return {
        orientation: 'portrait',
        paperSize: 'A4',
        margin: '8mm',
    };
};

export const applyCompliancePrintStyle = (config: CompliancePrintConfig): void => {
    const styleId = 'compliance-dynamic-print-style';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        style.setAttribute('media', 'print');
        document.head.appendChild(style);
    }
    style.textContent = `@page { size: ${config.paperSize} ${config.orientation}; margin: ${config.margin}; }`;
};

export const triggerCompliancePrint = (
    type?: string | null,
    onAfterPrint?: () => void,
): void => {
    const config = getCompliancePrintConfig(type);
    applyCompliancePrintStyle(config);
    document.body.classList.add('printing-compliance');

    const handleCleanup = () => {
        document.body.classList.remove('printing-compliance');
        window.removeEventListener('afterprint', handleCleanup);
        if (onAfterPrint) {
            onAfterPrint();
        }
    };

    window.addEventListener('afterprint', handleCleanup);

    // Immediate trigger
    window.print();

    // Fallback cleanup in case afterprint does not fire in some browser environments
    setTimeout(handleCleanup, 1500);
};
