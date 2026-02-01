import Sidebar from '@/Components/Sidebar';
import { Head, usePage, Link } from '@inertiajs/react'; // Link is not used yet, but kept
import { useState, useEffect } from 'react';
import Select from 'react-select';
import { getSidebarModules } from '@/utils/sidebarConfig';

// --- REUSABLE UI COMPONENTS (Internal) ---
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 overflow-hidden border border-red-100">
                <div className="h-2 w-full bg-gradient-to-r from-red-900 via-red-800 to-red-950"></div>
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-red-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
                            <p className="text-xs text-gray-500 font-medium">Create a new compliance record</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors disabled:opacity-50"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="p-8">
                    {children}
                </div>
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    {footer}
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ label, icon, error, ...props }: any) => (
    <div className="group w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-600 transition-colors">
                {icon}
            </div>
            <input 
                {...props}
                className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200
                ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'}`}
            />
        </div>
        {error && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{error}</p>}
    </div>
);

export default function ManageReports({ auth }: { auth: any }) {
    const { props } = usePage();
    const user = auth?.user || (props.auth as any)?.user;
    const [collapsed, setCollapsed] = useState(false);
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'view'>('create');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    
    // Form State (Simple local state for now)
    const [formData, setFormData] = useState({
        title: '',
        type: '',
        reference: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Pending Review'
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<any>(null);
    const [selectedStatus, setSelectedStatus] = useState<any>(null);

    const modules = getSidebarModules('Compliance', 'Manage Reports');

    const typeOptions = [
        { value: 'audit', label: 'Audit Report' },
        { value: 'inspection', label: 'Inspection Report' },
        { value: 'incident', label: 'Incident Report' },
    ];

    const statusOptions = [
        { value: 'compliant', label: 'Compliant' },
        { value: 'non-compliant', label: 'Non-Compliant' },
        { value: 'pending', label: 'Pending Review' },
    ];

    // Dummy Reports State so we can add to it
    const [reports, setReports] = useState([
        { id: 1, title: 'Annual Safety Audit', type: 'Audit Report', reference: 'AUD-2025-001', date: '2025-10-15', status: 'Compliant' },
        { id: 2, title: 'Q3 Equipment Inspection', type: 'Inspection Report', reference: 'INS-2025-089', date: '2025-09-30', status: 'Pending Review' },
        { id: 3, title: 'Warehouse Incident #402', type: 'Incident Report', reference: 'INC-2025-012', date: '2025-08-12', status: 'Non-Compliant' },
    ]);

    const handleCreateReport = () => {
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            if (modalMode === 'create') {
                const newReport = {
                    id: reports.length + 1,
                    title: formData.title,
                    type: formData.type || 'General Report',
                    reference: formData.reference,
                    date: formData.date,
                    status: formData.status
                };
                setReports([newReport, ...reports]);
            } else {
                // Update existing
                setReports(reports.map(r => r.id === selectedId ? { ...r, ...formData, type: formData.type || r.type } : r));
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
            title: report.title,
            type: report.type,
            reference: report.reference,
            date: report.date,
            status: report.status
        });
        setShowModal(true);
    };

    const handleArchive = (id: number) => {
        if (confirm('Are you sure you want to archive this report?')) {
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
            date: new Date().toISOString().split('T')[0],
            status: 'Pending Review'
        });
        setSelectedId(null);
    };

    const customSelectStyles = {
        control: (provided: any) => ({
            ...provided,
            borderColor: '#d1d5db',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            '&:hover': { borderColor: '#dc2626' },
            '&:focus-within': { borderColor: '#dc2626', boxShadow: '0 0 0 1px #dc2626' },
        }),
        placeholder: (provided: any) => ({ ...provided, color: '#6b7280', fontSize: '0.875rem' }),
        singleValue: (provided: any) => ({ ...provided, fontSize: '0.875rem' }),
        option: (provided: any, state: any) => ({
            ...provided,
            fontSize: '0.875rem',
            backgroundColor: state.isSelected ? '#dc2626' : state.isFocused ? '#fef2f2' : 'white',
            color: state.isSelected ? 'white' : '#374151',
        }),
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Head title="Compliance Reports" />
            
            <ReportModal
                show={showModal}
                onClose={() => setShowModal(false)}
                title={modalMode === 'create' ? "Generate New Report" : "View / Edit Report"}
                isSubmitting={isSubmitting}
                footer={
                    <>
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateReport}
                            disabled={isSubmitting || !formData.title || !formData.reference}
                            className="px-6 py-2 bg-gradient-to-r from-red-800 to-red-900 text-white font-bold rounded-lg hover:from-red-900 hover:to-red-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-900 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Processing...
                                </>
                            ) : (modalMode === 'create' ? 'Generate Report' : 'Save Changes')}
                        </button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-6">
                    <FormInput
                        label="Report Title"
                        value={formData.title}
                        onChange={(e: any) => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g. Annual Safety Inspection 2026"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        }
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="Reference No."
                            value={formData.reference}
                            onChange={(e: any) => setFormData({...formData, reference: e.target.value})}
                            placeholder="e.g. REP-2026-001"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>
                            }
                        />
                         <FormInput
                            label="Date"
                            type="date"
                            value={formData.date}
                            onChange={(e: any) => setFormData({...formData, date: e.target.value})}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Report Type</label>
                        <Select
                            options={typeOptions}
                            value={typeOptions.find(opt => opt.label === formData.type)}
                            onChange={(opt: any) => setFormData({...formData, type: opt?.label || ''})}
                            placeholder="Select Type..."
                            styles={customSelectStyles}
                        />
                    </div>
                </div>
            </ReportModal>

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Header */}
                <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Compliance Reports</h2>
                        <p className="text-sm text-gray-500">View and manage compliance reports.</p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <span className="block text-sm font-bold text-gray-800">
                            {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                        </span>
                    </div>
                </div>

                <div className="p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Title & Add Button */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Compliance Documents</h1>
                                <p className="text-sm text-gray-500 mt-1">Archive of official compliance reports and audit trails.</p>
                            </div>
                            <button 
                                onClick={openCreateModal}
                                className="bg-red-900 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-md flex items-center gap-2"
                            >
                                <span>+</span> Generate New Report
                            </button>
                        </div>


                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Search</label>
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Report Title, Reference..." 
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm h-[38px]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Report Type</label>
                                <Select options={typeOptions} value={selectedType} onChange={setSelectedType} placeholder="All Types" isClearable styles={customSelectStyles} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Status</label>
                                <Select options={statusOptions} value={selectedStatus} onChange={setSelectedStatus} placeholder="All Statuses" isClearable styles={customSelectStyles} />
                            </div>
                        </div>

                        {/* Cards Grid */}
                        {reports.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {reports.map((report) => (
                                    <div key={report.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                                                    ${report.status === 'Compliant' ? 'bg-green-100 text-green-700' : 
                                                      report.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-700' : 
                                                      'bg-red-100 text-red-700'}`}>
                                                    {report.status}
                                                </span>
                                                <span className="text-xs font-mono text-gray-400">{report.reference}</span>
                                            </div>
                                            
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-900 transition-colors mb-1">
                                                {report.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-4">{report.type}</p>
                                            
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold">Created On</span>
                                                    <span className="text-sm font-medium text-gray-700">{report.date}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleView(report)}
                                                        className="px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 rounded-md transition"
                                                    >
                                                        View
                                                    </button>
                                                    <button 
                                                        onClick={() => handleArchive(report.id)}
                                                        className="px-3 py-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-md transition"
                                                    >
                                                        Archive
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-20 text-center">
                                <p className="text-gray-500 italic">No reports found matching your criteria.</p>
                            </div>
                        )}

                        {/* Pagination Footer */}
                        <div className="mt-8 flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-bold text-gray-800">{reports.length}</span> results
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition" disabled>Previous</button>
                                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition" disabled>Next</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}