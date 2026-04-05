import Sidebar from '@/Components/Sidebar';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Select from 'react-select';
import { getSidebarModules } from '@/utils/sidebarConfig';
import RSMIFormPaper from '../../../Official Forms/RSMI Report';

// --- REUSABLE UI COMPONENTS ---
const ReportModal = ({ show, onClose, title, children, footer, isSubmitting }: any) => {
    if (!show) return null;

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
            <div 
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                onClick={!isSubmitting ? onClose : undefined}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl lg:max-w-5xl transform transition-all scale-100 flex flex-col max-h-[90vh]">
                <div className="h-2 w-full flex-shrink-0 bg-gradient-to-r from-red-900 via-red-800 to-red-950 rounded-t-2xl"></div>
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
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
                
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>
                
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0 rounded-b-2xl">
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
export default function ManageReports({ auth }: { auth: any }) {
    const { props } = usePage();
    const user = auth?.user || (props.auth as any)?.user;
    const [collapsed, setCollapsed] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'view'>('create');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Enhanced Form State for COA Periods (Status removed)
    const [formData, setFormData] = useState({
        title: '',
        type: '',
        reference: '',
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
        { value: 'RIS', label: 'RIS - Requisition and Issue Slip' },
        { value: 'STOCK_CARD', label: 'Stock Card' },
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

    // Dummy Data (Status removed)
    const [reports, setReports] = useState([
        { id: 1, title: 'March 2026 Office Supplies', type: 'RSMI', reference: 'RSMI-2026-003', date: 'March 2026' },
        { id: 2, title: 'IT Dept Hardware Request', type: 'RIS', reference: 'RIS-NO-105', date: '2026-03-10' },
        { id: 3, title: 'Bond Paper A4 Ledger', type: 'STOCK_CARD', reference: 'SC-PAPER-01', date: '2026-03-15' },
    ]);

    // Format display date based on period selection
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

    const handleCreateReport = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            const displayDate = generateDisplayDate(formData);

            if (modalMode === 'create') {
                const newReport = {
                    id: reports.length + 1,
                    title: formData.title,
                    type: formData.type || 'General Report',
                    reference: formData.reference,
                    date: displayDate,
                };
                setReports([newReport, ...reports]);
            } else {
                setReports(reports.map(r => r.id === selectedId ? { ...r, ...formData, date: displayDate } : r));
            }
            setIsSubmitting(false);
            setShowModal(false);
            resetForm();
        }, 800);
    };

    const handleView = (report: any) => {
        setModalMode('view');
        setSelectedId(report.id);
        setFormData({ 
            ...formData, 
            title: report.title,
            type: report.type,
            reference: report.reference,
        });
        setShowModal(true);
    };

    const handleArchive = (id: number) => {
        if (confirm('Move this document to the digital archive?')) {
            setReports(reports.filter(r => r.id !== id));
        }
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
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Head title="COA Compliance Reports" />
            
            <ReportModal
                show={showModal}
                onClose={() => setShowModal(false)}
                title={modalMode === 'create' ? "Generate COA Form" : "Review Compliance Document"}
                isSubmitting={isSubmitting}
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">Cancel</button>
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
                            ) : (modalMode === 'create' ? 'Generate Document' : 'Update Record')}
                        </button>
                    </>
                }
            >
                <div className="flex flex-col gap-6">
                    {modalMode === 'view' && formData.type === 'RSMI' && (
                        <div className="bg-gray-100 p-6 rounded-xl border border-gray-200">
                            <RSMIFormPaper data={{
                                entityName: 'National Entity for Management and Information X',
                                serialNo: formData.reference,
                                fundCluster: 'General Fund',
                                date: generateDisplayDate(formData),
                                issuedItems: [],
                                recapitulationItems: [],
                                supplyCustodianName: 'Jane Doe',
                                accountingStaffName: 'John Smith',
                                accountingDate: generateDisplayDate(formData),
                            }} />
                        </div>
                    )}
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
            </ReportModal>

            <Sidebar modules={modules} user={user} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
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
                                                    <RSMIFormPaper data={{
                                                        entityName: 'COA',
                                                        serialNo: report.reference,
                                                        fundCluster: 'GF',
                                                        date: report.date || '',
                                                        issuedItems: [], recapitulationItems: [],
                                                        supplyCustodianName: '', accountingStaffName: '', accountingDate: ''
                                                    }} />
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
                                                    <button onClick={() => handleArchive(report.id)} className="px-3 py-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">
                                                        Archive
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