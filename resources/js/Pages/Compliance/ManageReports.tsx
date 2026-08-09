import Sidebar from '@/Components/Sidebar';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { Head, router, usePage } from '@inertiajs/react';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import { getSidebarModules } from '@/utils/sidebarConfig';

const RSMIFormPaper = lazy(() =>
    import('../../../Official Forms/RSMI Report').then((module) => ({
        default: module.RSMIFormPaper,
    })),
);

const RPCIFormPaper = lazy(() =>
    import('../../../Official Forms/RPCI Report').then((module) => ({
        default: module.ReportPhysicalCount,
    })),
);

const StockCardFormPaper = lazy(() =>
    import('../../../Official Forms/Stock Card Report').then((module) => ({
        default: module.StockCard,
    })),
);

const reportTemplateFallback = (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white/80 p-12 text-sm font-medium text-gray-500 print:hidden">
        Loading report template...
    </div>
);

// --- REUSABLE UI COMPONENTS ---
const ReportModal = ({ show, onClose, title, children, footer, isSubmitting, isLandscape, collapsed }: any) => {
    if (!show) return null;

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

        return (
            <div className={`fixed inset-y-0 right-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${collapsed ? 'left-20' : 'left-[18rem]'} print:static print:inset-auto print:p-0 print:block print:w-full print:translate-x-0`}>
                <div 
                    className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity print:hidden" 
                    onClick={!isSubmitting ? onClose : undefined}
                ></div>
                <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${isLandscape ? 'max-w-7xl lg:max-w-[95vw]' : 'max-w-4xl lg:max-w-5xl'} transform transition-all scale-100 flex flex-col max-h-[90vh] print:shadow-none print:max-w-none print:max-h-none print:block print:m-0 print:p-0`}>
                    <div className="h-2 w-full flex-shrink-0 bg-gradient-to-r from-red-900 via-red-800 to-red-950 rounded-t-2xl print:hidden"></div>
                    <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-red-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
                            <p className="text-xs text-gray-500 font-medium">COA Compliance Reporting Module</p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors disabled:opacity-50"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 print:p-0 print:overflow-visible">
                    {children}
                </div>
                
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0 rounded-b-2xl print:hidden">
                    {footer}
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ label, icon, error, ...props }: any) => (
    <div className="group w-full">
        {label && <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">{label}</label>}
        <div className="relative">
            {icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-600 transition-colors">
                    {icon}
                </div>
            )}
            <input 
                {...props}
                className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200
                ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'}`}
            />
        </div>
        {error && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{error}</p>}
    </div>
);

// --- MAIN COMPONENT ---
export default function ManageReports({ auth, items = [], reports: serverReports = [], issuances = [], suppliers = [] }: { auth: any, items?: any[], reports?: any[], issuances?: any[], suppliers?: any[] }) {
    const { props } = usePage();
    const user = auth?.user || (props.auth as any)?.user;
    const [collapsed, setCollapsed] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'view'>('create');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const reportContentRef = useRef<HTMLDivElement | null>(null);

    // Dialog state for user actions
    const [actionDialog, setActionDialog] = useState<{
        show: boolean;
        type: 'success' | 'confirm' | 'error';
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({ show: false, type: 'success', title: '', message: '' });

    const closeActionDialog = () => setActionDialog(prev => ({ ...prev, show: false }));

    // Filter logic for Issuances Data
    const getFilteredIssuances = () => {
        return issuances.filter((issue: any) => {
            const issueDate = new Date(issue.date_issued || issue.created_at);
            if (isNaN(issueDate.getTime())) return false; // Handle invalid dates

            if (formData.periodType === 'specific') {
                return (issueDate.toISOString().split('T')[0] === formData.date); 
            } else if (formData.periodType === 'range') {
                const start = new Date(formData.startDate);
                const end = new Date(formData.endDate);
                return issueDate >= start && issueDate <= end;
            } else if (formData.periodType === 'monthly') {
                return (issueDate.getMonth() + 1) === Number(formData.selectedMonth) && issueDate.getFullYear() === Number(formData.selectedYear);
            } else if (formData.periodType === 'yearly') {
                return issueDate.getFullYear() === Number(formData.selectedYear);
            }
            return true;
        });
    };

    // Enhanced Form State for COA Periods (Status removed)
    const [formData, setFormData] = useState({
        title: '',
        type: '',
        reference: '',
        itemName: '',
        supplierId: '',
        supplierName: '',
        periodType: 'specific',
        date: new Date().toISOString().split('T')[0],
        startDate: '',
        endDate: '',
        selectedMonth: new Date().getMonth() + 1,
        selectedYear: new Date().getFullYear(),
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<any>(null);
    const [selectedReference, setSelectedReference] = useState<any>(null);

    const modules = getSidebarModules('Compliance', 'Manage Reports');

    // Options Arrays
    const typeOptions = [
        { value: 'RSMI', label: 'RSMI - Supplies and Materials Issued' },
        { value: 'RPCI', label: 'RPCI - Report on the Physical Count of Inventories' },
        { value: 'STOCK_CARD', label: 'Stock Card' },
        { value: 'MOR', label: 'Memorandum of Receipt' },
    ];

    const periodOptions = [
        { value: 'specific', label: 'Specific Date' },
        { value: 'range', label: 'Date Range' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' },
    ];

    const monthOptions = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
    ];

    const supplierOptions = suppliers
        .filter((supplier: any) => supplier?.name || supplier?.company_name)
        .map((supplier: any) => ({
            value: supplier.id,
            label: supplier.name || supplier.company_name,
        }));

    const filteredSupplierItems = formData.supplierId
        ? items.filter((item: any) => String(item.supplier_id) === String(formData.supplierId))
        : items;

    // Format display date based on period selection
    const [reports, setReports] = useState<any[]>(serverReports.length > 0 ? serverReports : []);

    const selectedStockCardItem = items.find((item: any) => item.name === formData.itemName);

    const getSelectedStockCardIssuances = () => {
        if (!formData.itemName) return [];

        return getFilteredIssuances().filter((issue: any) => {
            if (issue.item_id && selectedStockCardItem?.id) {
                return String(issue.item_id) === String(selectedStockCardItem.id);
            }

            if (issue.item && typeof issue.item === 'string') {
                return issue.item === formData.itemName;
            }

            if (issue.item && typeof issue.item === 'object') {
                return String(issue.item.id) === String(selectedStockCardItem?.id) || issue.item.name === formData.itemName;
            }

            return false;
        });
    };

    const stockCardEntries = (() => {
        const selectedIssuances = getSelectedStockCardIssuances();
        const currentStock = Number(selectedStockCardItem?.stock || 0);

        const preparedEntries = selectedIssuances
            .map((issue: any) => {
                const issueQty = Number(issue.quantity || issue.qty || 0);
                return {
                    date: issue.date_issued || issue.date || issue.created_at || '',
                    reference: issue.reference || issue.display_id || issue.id,
                    issue_qty: issueQty === 0 ? '' : issueQty,
                    issue_office: issue.department || issue.recipient || issue.office || '',
                };
            })
            .sort((a: any, b: any) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateA - dateB || String(a.reference).localeCompare(String(b.reference));
            });

        const totalIssued = preparedEntries.reduce((sum: number, entry: any) => sum + Number(entry.issue_qty || 0), 0);
        const startingBalance = currentStock + totalIssued;

        const entries = [
            {
                date: '',
                reference: 'Balance',
                receipt_qty: '',
                issue_qty: '',
                issue_office: '',
                balance_qty: startingBalance,
                days_to_consume: '',
            }
        ];

        let runningBalance = startingBalance;

        preparedEntries.forEach((entry: any) => {
            runningBalance -= Number(entry.issue_qty || 0);
            entries.push({
                ...entry,
                receipt_qty: '',
                balance_qty: runningBalance,
                days_to_consume: '',
            });
        });

        return entries;
    })();

    const generateDisplayDate = (data: any) => {
        if (data.periodType === 'monthly') {
            const monthName = monthOptions.find(m => m.value === data.selectedMonth)?.label;
            return `${monthName} ${data.selectedYear}`;
        } else if (data.periodType === 'yearly') {
            return `Year ${data.selectedYear}`;
        } else if (data.periodType === 'range') {
            return `${data.startDate} to ${data.endDate}`;
        }
        return data.date;
    };

    const handlePrint = () => {
        const dynamicPrintStyleId = 'dynamic-print-orientation-style';
        const existingStyle = document.getElementById(dynamicPrintStyleId);
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = dynamicPrintStyleId;
        style.setAttribute('media', 'print');
        style.textContent = `@page { size: ${formData.type === 'RPCI' ? 'A4 landscape' : 'A4 portrait'}; margin: 5mm; }`;
        document.head.appendChild(style);

        window.print();

        // Keep the DOM clean after print dialog has been triggered.
        setTimeout(() => {
            const mountedStyle = document.getElementById(dynamicPrintStyleId);
            if (mountedStyle) {
                mountedStyle.remove();
            }
        }, 500);
    };

    useEffect(() => {
        setReports(serverReports.length > 0 ? serverReports : []);
    }, [serverReports]);

    const buildReportPayload = () => {
        const payload = { ...formData } as Record<string, any>;
        if (!formData.supplierId) {
            delete payload.supplierId;
            delete payload.supplierName;
        }

        return {
            title: formData.title,
            type: formData.type || 'General Report',
            reference: formData.reference,
            itemName: formData.itemName || null,
            ...(formData.supplierId ? { supplierId: formData.supplierId, supplierName: formData.supplierName } : {}),
            periodType: formData.periodType,
            date: formData.date || null,
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
            selectedMonth: formData.periodType === 'monthly' ? Number(formData.selectedMonth) : null,
            selectedYear: formData.periodType === 'monthly' || formData.periodType === 'yearly' ? Number(formData.selectedYear) : null,
            coverageLabel: generateDisplayDate(formData),
            payload,
        };
    };

    const handleCreateReport = () => {
        const payload = buildReportPayload();
        const requestOptions = {
            preserveScroll: true,
            onStart: () => setIsSubmitting(true),
            onFinish: () => setIsSubmitting(false),
            onSuccess: () => {
                setShowModal(false);
                resetForm();
                setActionDialog({
                    show: true,
                    type: 'success',
                    title: modalMode === 'create' ? 'Report Generated' : 'Report Updated',
                    message: modalMode === 'create'
                        ? 'The compliance document has been successfully generated and stored in the database.'
                        : 'The compliance document has been successfully updated in the database.'
                });
            },
            onError: () => {
                setActionDialog({
                    show: true,
                    type: 'error',
                    title: 'Save Failed',
                    message: 'Unable to save the form right now. Please check required fields and try again.'
                });
            },
        };

        if (modalMode === 'create') {
            router.post(route('compliance.reports.store'), payload, requestOptions);
            return;
        }
    };

    const handleDownload = async () => {
        const reportElement = reportContentRef.current;
        if (!reportElement) {
            setActionDialog({
                show: true,
                type: 'error',
                title: 'Download Failed',
                message: 'The report preview is not ready for export yet.'
            });
            return;
        }

        const payload = buildReportPayload();
        const safeName = [payload.type, payload.reference, payload.title]
            .filter(Boolean)
            .join('_')
            .replace(/[^a-z0-9_-]+/gi, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        const fileName = `${safeName || 'compliance_report'}.pdf`;
        const [{ jsPDF }, html2canvasModule] = await Promise.all([
            import('jspdf'),
            import('html2canvas'),
        ]);
        const html2canvas = html2canvasModule.default;
        const doc = new jsPDF({ orientation: formData.type === 'RPCI' ? 'l' : 'p', unit: 'pt', format: 'a4' });
        const canvas = await html2canvas(reportElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            windowWidth: reportElement.scrollWidth,
            windowHeight: reportElement.scrollHeight,
        });

        const imageData = canvas.toDataURL('image/png');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 24;
        const availableWidth = pageWidth - margin * 2;
        const availableHeight = pageHeight - margin * 2;
        const scale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);
        const imageWidth = canvas.width * scale;
        const imageHeight = canvas.height * scale;
        const x = (pageWidth - imageWidth) / 2;
        const y = (pageHeight - imageHeight) / 2;

        doc.addImage(imageData, 'PNG', x, y, imageWidth, imageHeight, undefined, 'FAST');

        doc.save(fileName);
    };

    const handleView = (report: any) => {
        const supplier = suppliers.find((supplier: any) => String(supplier.id) === String(report.supplierId))
            || suppliers.find((supplier: any) => (supplier.name || supplier.company_name) === report.supplierName);

        setModalMode('view');
        setSelectedId(report.id);
        setFormData({ 
            ...formData, 
            title: report.title,
            type: report.type,
            reference: report.reference,
            itemName: report.itemName || '',
            supplierId: supplier?.id || report.supplierId || '',
            supplierName: supplier ? supplier.name || supplier.company_name : (report.supplierName || ''),
            periodType: report.periodType || 'specific',
            date: report.dateValue || new Date().toISOString().split('T')[0],
            startDate: report.startDate || '',
            endDate: report.endDate || '',
            selectedMonth: report.selectedMonth || new Date().getMonth() + 1,
            selectedYear: report.selectedYear || new Date().getFullYear(),
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setModalMode('create');
        resetForm();
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            type: '',
            reference: '',
            itemName: '',
            supplierId: '',
            supplierName: '',
            periodType: 'specific',
            date: new Date().toISOString().split('T')[0],
            startDate: '',
            endDate: '',
            selectedMonth: new Date().getMonth() + 1,
            selectedYear: new Date().getFullYear(),
        });
        setSelectedId(null);
    };

    const customSelectStyles = {
        control: (provided: any) => ({
            ...provided,
            borderColor: '#d1d5db',
            borderRadius: '0.75rem',
            padding: '2px',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            '&:hover': { borderColor: '#dc2626' },
            '&:focus-within': { borderColor: '#dc2626', boxShadow: '0 0 0 1px #dc2626' },
        }),
        placeholder: (provided: any) => ({ ...provided, color: '#9ca3af', fontSize: '0.875rem' }),
        singleValue: (provided: any) => ({ ...provided, fontSize: '0.875rem' }),
        option: (provided: any, state: any) => ({
            ...provided,
            fontSize: '0.875rem',
            backgroundColor: state.isSelected ? '#dc2626' : state.isFocused ? '#fef2f2' : 'white',
            color: state.isSelected ? 'white' : '#374151',
        }),
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    };

    // --- FILTER LOGIC ---
    
    // 1. Dynamic Reference Options based on Type Selection
    const availableReferences = selectedType 
        ? reports.filter(r => r.type === selectedType.value) 
        : reports;

    const referenceOptions = Array.from(new Set(availableReferences.map(r => r.reference))).map(ref => ({
        value: ref,
        label: ref
    }));

    // Reset Reference filter if Type changes to avoid impossible combinations
    useEffect(() => {
        setSelectedReference(null);
    }, [selectedType]);

    // 2. Filter Reports
    const filteredReports = reports.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             r.reference.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType ? r.type === selectedType.value : true;
        const matchesRef = selectedReference ? r.reference === selectedReference.value : true; 
        return matchesSearch && matchesType && matchesRef;
    });

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 print:bg-white">
            <Head title="COA Compliance Reports" />
            <style>{`
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 5mm; 
                    }
                    body { 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                    }
                    /* Force the container to render as a single un-broken page */
                    .print-single-page {
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                        page-break-before: avoid !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    /* Shrink the form dynamically to ensure it fits one page */
                    .print-zoom-fit {
                        zoom: 0.75;
                    }
                    /* Disable scrollbars when printing */
                    ::-webkit-scrollbar {
                        display: none;
                    }
                }
            `}</style>
            
            {/* Action Dialog Modal */}
            {actionDialog.show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={closeActionDialog}></div>
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center transform transition-all scale-100 flex flex-col items-center">
                        {actionDialog.type === 'success' && (
                            <div className="mx-auto flex flex-shrink-0 items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
                                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                        {actionDialog.type === 'confirm' && (
                            <div className="mx-auto flex flex-shrink-0 items-center justify-center h-14 w-14 rounded-full bg-yellow-100 mb-4">
                                <svg className="h-7 w-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{actionDialog.title}</h3>
                        <p className="text-sm text-gray-500 mb-6">{actionDialog.message}</p>
                        <div className="flex gap-3 justify-center w-full">
                            {actionDialog.type === 'confirm' ? (
                                <>
                                    <button onClick={closeActionDialog} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                                    <button onClick={actionDialog.onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">Confirm</button>
                                </>
                            ) : (
                                <button onClick={closeActionDialog} className="w-full px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">Close</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <ReportModal
                show={showModal}
                onClose={() => setShowModal(false)}
                title={modalMode === 'create' ? "Generate COA Form" : "Review Compliance Document"}
                isSubmitting={isSubmitting}
                isLandscape={modalMode === 'view' && formData.type === 'RPCI'}
                collapsed={collapsed}
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">Cancel</button>
                        
                        {modalMode === 'view' && (
                            <button
                                onClick={handlePrint}
                                type="button"
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg border border-transparent transition-colors shadow-sm flex items-center gap-2 print:hidden"
                            >
                                <svg className="w-4 h-4 shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                Print Form
                            </button>
                        )}
                        
                        {modalMode === 'create' ? (
                            <button
                                onClick={handleCreateReport}
                                disabled={isSubmitting || !formData.title || !formData.type || !formData.reference}
                                className="px-6 py-2 bg-gradient-to-r from-red-800 to-red-900 text-white font-bold rounded-lg hover:from-red-900 hover:to-red-950 transition-all shadow-lg disabled:opacity-70 flex items-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Processing...
                                    </>
                                ) : 'Generate Document'}
                            </button>
                        ) : (
                            <button
                                onClick={handleDownload}
                                type="button"
                                className="px-6 py-2 bg-gradient-to-r from-red-800 to-red-900 text-white font-bold rounded-lg hover:from-red-900 hover:to-red-950 transition-all shadow-lg flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v10m0 0l4-4m-4 4l-4-4m-5 8v2a2 2 0 002 2h12a2 2 0 002-2v-2"></path></svg>
                                Download
                            </button>
                        )}
                    </>
                }
            >
                <div className="flex flex-col gap-6 print:gap-0 print:overflow-hidden print-single-page print-zoom-fit">
                    {modalMode === 'view' && formData.type === 'RSMI' && (
                        <div ref={reportContentRef} className="bg-gray-100 p-6 rounded-xl border border-gray-200 print:bg-white print:p-0 print:border-none print-single-page">
                            {(() => {
                                const filteredIssuances = getFilteredIssuances();
                                
                                const issuedItems = filteredIssuances.map((issue: any) => {
                                    const qty = issue.quantity || 0;
                                    const cost = issue.item?.unit_cost || 0;
                                    return {
                                        risNo: issue.id.toString().padStart(4, '0'),
                                        responsibilityCenterCode: issue.department || '-',
                                        stockNo: issue.item?.sku || '-',
                                        itemDescription: issue.item?.name || '-',
                                        unit: issue.item?.unit_measure || 'pc',
                                        quantityIssued: qty,
                                        unitCost: cost,
                                        amount: qty * cost
                                    };
                                });

                                const recaps = issuedItems.map(item => ({
                                    stockNo: item.stockNo,
                                    quantity: item.quantityIssued,
                                    unitCost: '',
                                    totalCost: '',
                                    uacsObjectCode: ''
                                }));

                                return (
                                    <Suspense fallback={reportTemplateFallback}>
                                        <RSMIFormPaper data={{
                                            entityName: 'University of Camarines Norte',
                                            serialNo: formData.reference,
                                            fundCluster: 'General Fund',
                                            date: generateDisplayDate(formData),
                                            issuedItems: issuedItems,
                                            recapitulationItems: recaps,
                                            supplyCustodianName: user?.name || 'Supply Officer',
                                            accountingStaffName: 'Accounting Staff',
                                            accountingDate: generateDisplayDate(formData),
                                        }} />
                                    </Suspense>
                                );
                            })()}
                        </div>
                    )}
                    {modalMode === 'view' && formData.type === 'RPCI' && (
                        <div ref={reportContentRef} className="bg-gray-100 p-6 rounded-xl border border-gray-200 overflow-x-auto print:bg-white print:p-0 print:border-none print-single-page print:overflow-hidden">
                            <div className="min-w-[1100px] mx-auto print:min-w-[1100px]">
                                {(() => {
                                    if (filteredSupplierItems.length === 0) {
                                        return (
                                            <div className="py-20 text-center text-gray-600">
                                                <p className="text-lg font-semibold text-gray-800">No items found for the selected supplier.</p>
                                                <p className="text-sm text-gray-500 mt-2">Please choose another supplier or add inventory items first.</p>
                                            </div>
                                        );
                                    }

                                    const rpciItems = filteredSupplierItems.map((item: any) => ({
                                        article: item.name || '-',
                                        description: item.description || item.name || '-',
                                        stock_no: item.sku || '-',
                                        unit: item.unit_of_issue || item.unit_measure || 'pc',
                                        unit_value: item.unit_cost || 0,
                                        balance_per_card: item.stock || 0,
                                        on_hand_count: item.stock || 0,
                                        shortage_qty: '',  // To be filled manually
                                        shortage_value: '',// To be filled manually
                                        remarks: ''        // To be filled manually
                                    }));

                                    return (
                                        <Suspense fallback={reportTemplateFallback}>
                                            <RPCIFormPaper data={{
                                                entity_name: 'University of Camarines Norte',
                                                as_at_date: generateDisplayDate(formData),
                                                fund_cluster: 'General Fund',
                                                inventory_type: formData.title,
                                                accountable_officer: 'Jane Doe',
                                                designation: 'Supply Officer',
                                                items: rpciItems,
                                            }} />
                                        </Suspense>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                    {modalMode === 'view' && formData.type === 'STOCK_CARD' && (
                        <div ref={reportContentRef} className="bg-gray-100 p-6 rounded-xl border border-gray-200 overflow-x-auto print:bg-white print:p-0 print:border-none print-single-page print:overflow-hidden">
                            <div className="min-w-[800px] mx-auto print:min-w-full">
                                    {formData.itemName ? (
                                        <Suspense fallback={reportTemplateFallback}>
                                            <StockCardFormPaper data={{
                                                entity_name: 'University of Camarines Norte',
                                                fund_cluster: 'General Fund',
                                                item: formData.itemName || formData.title,
                                                stock_no: selectedStockCardItem?.sku || formData.reference,
                                                description: selectedStockCardItem?.description || selectedStockCardItem?.name || formData.itemName || formData.title,
                                                re_order_point: '-',
                                                unit_of_measurement: selectedStockCardItem?.unit_of_issue || selectedStockCardItem?.unit_measure || 'Pieces',
                                                entries: stockCardEntries
                                            }} />
                                        </Suspense>
                                    ) : (
                                    <div className="py-20 text-center text-gray-600">
                                        <p className="text-lg font-semibold text-gray-800">Select an item to preview a live stock card.</p>
                                        <p className="text-sm text-gray-500 mt-2">The stock card will generate entries from issued item records once an item is chosen.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="print:hidden space-y-6">
                        {/* Basic Info Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">COA Report Type</label>
                            <Select
                                options={typeOptions}
                                value={typeOptions.find(opt => opt.value === formData.type)}
                                onChange={(opt: any) => setFormData({...formData, type: opt?.value || ''})}
                                placeholder="Select Form Type..."
                                styles={customSelectStyles}
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                menuPosition="fixed"
                            />
                        </div>
                        <FormInput
                            label="Serial / Ref No."
                            value={formData.reference}
                            onChange={(e: any) => setFormData({...formData, reference: e.target.value})}
                            placeholder="e.g. 2026-03-001"
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>}
                        />
                    </div>
                    
                    <FormInput
                        label="Document Title"
                        value={formData.title}
                        onChange={(e: any) => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g. Monthly Supplies Issuance - March"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>}
                    />

                    {formData.type === 'RPCI' && (
                        <div className="group w-full">
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">Supplier</label>
                            <Select
                                options={supplierOptions}
                                value={supplierOptions.find((opt: any) => String(opt.value) === String(formData.supplierId)) || null}
                                onChange={(opt: any) => setFormData({
                                    ...formData,
                                    supplierId: opt ? opt.value : '',
                                    supplierName: opt ? opt.label : '',
                                })}
                                styles={customSelectStyles}
                                isClearable
                                placeholder="Select supplier..."
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                menuPosition="fixed"
                            />
                        </div>
                    )}

                    {formData.type === 'STOCK_CARD' && (
                        <div className="group w-full">
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">Target Item</label>
                            <Select
                                options={items.map((item: any) => ({
                                    value: item.name,
                                    label: `${item.name} ${item.sku ? `(${item.sku})` : ''}`
                                }))}
                                value={formData.itemName ? { value: formData.itemName, label: items.find((i: any) => i.name === formData.itemName)?.name ? `${items.find((i: any) => i.name === formData.itemName)?.name} ${items.find((i: any) => i.name === formData.itemName)?.sku ? `(${items.find((i: any) => i.name === formData.itemName)?.sku})` : ''}` : formData.itemName } : null}
                                onChange={(opt: any) => setFormData({...formData, itemName: opt ? opt.value : ''})}
                                styles={customSelectStyles}
                                isClearable
                                placeholder="Select an item..."
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                menuPosition="fixed"
                            />
                        </div>
                    )}

                    {/* COVERAGE PERIOD SECTION */}
                    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-800"></div>
                        <div className="flex items-center gap-2 mb-4 text-gray-800">
                            <svg className="w-5 h-5 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            <h4 className="text-sm font-bold uppercase tracking-wider">Coverage Period</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1">Period Format</label>
                                <Select
                                    options={periodOptions}
                                    value={periodOptions.find(opt => opt.value === formData.periodType)}
                                    onChange={(opt: any) => setFormData({...formData, periodType: opt?.value || 'specific'})}
                                    styles={customSelectStyles}
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    menuPosition="fixed"
                                />
                            </div>

                            {/* Conditional Inputs */}
                            {formData.periodType === 'specific' && (
                                <FormInput
                                    label="Specific Date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e: any) => setFormData({...formData, date: e.target.value})}
                                />
                            )}

                            {formData.periodType === 'range' && (
                                <div className="flex items-end gap-3 w-full">
                                    <FormInput label="From Date" type="date" value={formData.startDate} onChange={(e: any) => setFormData({...formData, startDate: e.target.value})} />
                                    <FormInput label="To Date" type="date" value={formData.endDate} onChange={(e: any) => setFormData({...formData, endDate: e.target.value})} />
                                </div>
                            )}

                            {formData.periodType === 'monthly' && (
                                <div className="flex items-end gap-3 w-full">
                                    <div className="flex-1">
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1">Month</label>
                                        <Select 
                                            options={monthOptions} 
                                            value={monthOptions.find(m => m.value === formData.selectedMonth)}
                                            onChange={(opt: any) => setFormData({...formData, selectedMonth: opt.value})}
                                            styles={customSelectStyles} 
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                            menuPosition="fixed"
                                        />
                                    </div>
                                    <div className="w-1/3">
                                        <FormInput label="Year" type="number" min="2000" max="2100" value={formData.selectedYear} onChange={(e: any) => setFormData({...formData, selectedYear: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            {formData.periodType === 'yearly' && (
                                <FormInput label="Fiscal Year" type="number" min="2000" max="2100" value={formData.selectedYear} onChange={(e: any) => setFormData({...formData, selectedYear: e.target.value})} />
                            )}
                        </div>
                    </div>
                    </div>
                </div>
            </ReportModal>

            <div className="print:hidden">
                <Sidebar modules={modules} user={user} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
            </div>

            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'} print:hidden`}>
                <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
                    <div>
                        
                                <div className="mb-2">
                                    <Breadcrumbs items={[{name:'Compliance'},{name:'Manage Reports'}]} />
                                </div>
<h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Compliance Reports</h2>
                        <p className="text-sm text-gray-500">Official COA Inventory Documentation</p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <span className="block text-sm font-bold text-gray-800">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">System Active</span>
                    </div>
                </div>

                <div className="p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">COA Forms Archive</h1>
                                <p className="text-sm text-gray-500 mt-1">Generate and track RIS, RSMI, RPCI, and Stock Cards.</p>
                            </div>
                            <button onClick={openCreateModal} className="bg-red-900 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-md flex items-center gap-2">
                                <span>+</span> Generate New Report
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1">Search Documents</label>
                                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by title..." className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 h-[42px] px-4" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1">Filter by Form Type</label>
                                <Select options={typeOptions} value={selectedType} onChange={setSelectedType} placeholder="All COA Types" isClearable styles={customSelectStyles} menuPortalTarget={typeof window !== "undefined" ? document.body : null} menuPosition="fixed" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1">Filter by Reference</label>
                                <Select 
                                    options={referenceOptions} 
                                    value={selectedReference} 
                                    onChange={setSelectedReference} 
                                    placeholder={selectedType ? "Select Reference..." : "Select Type first..."}
                                    isClearable 
                                    styles={customSelectStyles} 
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null} 
                                    menuPosition="fixed" 
                                    isDisabled={referenceOptions.length === 0}
                                />
                            </div>
                        </div>

                        {/* Reports Cards */}
                        {filteredReports.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredReports.map((report) => {
                                    // Match the abbreviation to its full label from the options array
                                    const fullTypeLabel = typeOptions.find(opt => opt.value === report.type)?.label || report.type;
                                    
                                    return (
                                        <div key={report.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col relative h-full">
                                            
                                            {report.type === 'RSMI' && (
                                                <div className="absolute top-0 right-0 w-32 h-40 opacity-10 pointer-events-none overflow-hidden scale-[0.2] origin-top-right transition-opacity group-hover:opacity-20 translate-x-2 -translate-y-2">
                                                    <Suspense fallback={reportTemplateFallback}>
                                                        <RSMIFormPaper data={{
                                                            entityName: 'University of Camarines Norte',
                                                            serialNo: report.reference,
                                                            fundCluster: 'GF',
                                                            date: report.date || '',
                                                            issuedItems: [
                                                                { risNo: '1', responsibilityCenterCode: '-', stockNo: '1', itemDescription: 'Sample', unit: 'pc', quantityIssued: 1, unitCost: 100, amount: 100 }
                                                            ], 
                                                            recapitulationItems: [
                                                                { stockNo: '1', quantity: 1, unitCost: '', totalCost: '', uacsObjectCode: '' }
                                                            ],
                                                            supplyCustodianName: '', accountingStaffName: '', accountingDate: ''
                                                        }} />
                                                    </Suspense>
                                                </div>
                                            )}
                                            
                                            {report.type === 'RPCI' && (
                                                <div className="absolute top-0 right-0 w-44 h-32 opacity-10 pointer-events-none overflow-hidden scale-[0.2] origin-top-right transition-opacity group-hover:opacity-20 translate-x-2 -translate-y-2">
                                                    <Suspense fallback={reportTemplateFallback}>
                                                        <RPCIFormPaper data={{
                                                            entity_name: 'University of Camarines Norte',
                                                            as_at_date: report.date || '',
                                                            fund_cluster: 'GF',
                                                            inventory_type: report.title,
                                                            items: [
                                                                { article: 'Sample', description: '-', stock_no: '1', unit: 'pc', unit_value: 100, balance_per_card: 10, on_hand_count: 10, shortage_qty: '', shortage_value: '', remarks: '' }
                                                            ]
                                                        }} />
                                                    </Suspense>
                                                </div>
                                            )}

                                            {report.type === 'STOCK_CARD' && (
                                                <div className="absolute top-0 right-0 w-32 h-40 opacity-10 pointer-events-none overflow-hidden scale-[0.2] origin-top-right transition-opacity group-hover:opacity-20 translate-x-2 -translate-y-2">
                                                    <Suspense fallback={reportTemplateFallback}>
                                                        <StockCardFormPaper data={{
                                                            entity_name: 'University of Camarines Norte',
                                                            item: report.itemName || report.title,
                                                            stock_no: items.find((item: any) => item.name === report.itemName)?.sku || report.reference,
                                                            entries: []
                                                        }} />
                                                    </Suspense>
                                                </div>
                                            )}

                                            <div className="p-5 flex-1 relative z-10">
                                                <div className="flex justify-between items-start mb-4 gap-3">
                                                    <span className={`px-2.5 py-1 rounded text-[10px] font-black bg-red-950 text-white uppercase shadow-sm leading-tight text-left`}>
                                                        {fullTypeLabel}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-gray-100 text-gray-700 flex-shrink-0 whitespace-nowrap`}>
                                                        Ref: {report.reference}
                                                    </span>
                                                </div>
                                                {report.supplierName && (
                                                    <p className="text-xs text-gray-500 mb-2">Supplier: <span className="font-semibold text-gray-700">{report.supplierName}</span></p>
                                                )}
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-900 transition-colors mb-2 line-clamp-2">{report.title}</h3>
                                            </div>
                                            
                                            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between mt-auto">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Coverage</span>
                                                    <span className="text-sm font-semibold text-gray-700">{report.date}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleView(report)} className="px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-20 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">No reports found</h3>
                                <p className="text-gray-500 text-sm max-w-sm">We couldn't find any compliance documents matching your current filters or search terms.</p>
                                <button onClick={openCreateModal} className="mt-6 text-red-700 font-semibold hover:text-red-800 text-sm flex items-center gap-1">
                                    Generate a new report <span aria-hidden="true">&rarr;</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}