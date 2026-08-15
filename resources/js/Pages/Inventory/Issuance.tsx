import SystemModeBadge from '@/Components/SystemModeBadge';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Breadcrumbs from '@/Components/Breadcrumbs';
import Sidebar from '@/Components/Sidebar';
import Modal from '@/Components/Modal';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect } from 'react'; // Added useMemo
import { getSidebarModules } from '@/utils/sidebarConfig';
import Select from 'react-select';
import RequisitionIssueSlip from '../../../Official Forms/RequisitionIssueSlip';

type IssuanceItem = {
    item_id: string;
    quantity: string;
};

export default function Issuance({ auth, issuances, items }: { auth: any, issuances: any[], items: any[] }) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);

    // --- MODAL STATE ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isViewFormModalOpen, setIsViewFormModalOpen] = useState(false);
    const [selectedIssuance, setSelectedIssuance] = useState<any>(null);

    // --- DIALOG MODALS STATE ---
    const [showFormSuccessModal, setShowFormSuccessModal] = useState(false);
    const [showFormErrorModal, setShowFormErrorModal] = useState(false);
    const [formSuccessMessage, setFormSuccessMessage] = useState('');
    const [formErrorMessage, setFormErrorMessage] = useState('');

    // --- FORM STATE ---
    const [recipient, setRecipient] = useState('');
    const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
    const [department, setDepartment] = useState('');
    const [fundCluster, setFundCluster] = useState<any>(null);
    const [recipientDesignation, setRecipientDesignation] = useState('');
    const [purpose, setPurpose] = useState('');
    const [approvedBy, setApprovedBy] = useState('');
    const [approvedByDesignation, setApprovedByDesignation] = useState('');
    const [issuanceItems, setIssuanceItems] = useState<IssuanceItem[]>([{ item_id: '', quantity: '' }]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const modalFormRef = useRef<HTMLFormElement | null>(null);
    const newItemAnchorRef = useRef<HTMLDivElement | null>(null);

    const getFormattedId = (issuance: any) => {
        if (!issuance) return '';
        const date = new Date(issuance.date || new Date());
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const num = String(issuance.display_id || issuance.original_id || issuance.id).padStart(4, '0');
        return `${year}-${month}-${num}`;
    };

    // --- FILTERS STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRecipient, setFilterRecipient] = useState<any>(null);

    // --- PAGINATION STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // --- DERIVED DATA (DROPDOWN OPTIONS) ---
    const groupedIssuances = useMemo(() => {
        const groups: Record<string, any> = {};
        issuances.forEach(issuance => {
            const key = issuance.created_at || `${issuance.recipient}_${issuance.date}_${issuance.status}_${issuance.issued_by}`;
            if (!groups[key]) {
                groups[key] = {
                    ...issuance,
                    original_id: issuance.id,
                    item_names: [issuance.item],
                    total_quantity: Number(issuance.quantity),
                    total_amount: Number(issuance.quantity) * Number(issuance.unit_cost || 0),
                    all_ids: [issuance.id],
                    items_list: [{ item: issuance.item, quantity: issuance.quantity, id: issuance.id, stock_no: issuance.sku }]
                };
            } else {
                groups[key].item_names.push(issuance.item);
                groups[key].total_quantity += Number(issuance.quantity);
                groups[key].total_amount += Number(issuance.quantity) * Number(issuance.unit_cost || 0);
                if (issuance.id < groups[key].original_id) {
                    groups[key].original_id = issuance.id;
                }
                groups[key].all_ids.push(issuance.id);
                groups[key].items_list.push({ item: issuance.item, quantity: issuance.quantity, id: issuance.id, stock_no: issuance.sku });
            }
        });

        // Sort chronologically to preserve order, then assign sequential display IDs
        const sortedGroups = Object.values(groups).sort((a: any, b: any) => a.original_id - b.original_id);
        let currentDisplayId = 1;

        return sortedGroups.map((g: any) => {
            const res = {
                ...g,
                display_id: currentDisplayId,
                item: g.item_names.length > 1 ? `${g.item_names.length} items (${g.item_names.slice(0, 2).join(', ')}${g.item_names.length > 2 ? '...' : ''})` : g.item_names[0],
                quantity: g.total_quantity,
                amount: g.total_amount
            };
            currentDisplayId++;
            return res;
        });
    }, [issuances]);

    const itemOptions = items.map(item => ({ value: item.id, label: `${item.name} (${item.sku})` }));

    const fundClusterOptions = [
        { value: '01', label: '01 - Regular Agency Fund' },
        { value: '05', label: '05 - Internally Generated Funds' },
        { value: '06', label: '06 - Business Related Funds' },
        { value: '07', label: '07 - Trust Receipts' }
    ];

    const divisionOptions = [
        {
            label: 'University Offices and Services',
            options: [
                { value: 'Admission Office', label: 'Admission Office' },
                { value: 'Center for Equity, Inclusivity and Diversity (CEID)', label: 'Center for Equity, Inclusivity and Diversity (CEID)' },
                { value: 'Culture and Performing Arts Unit (CPAU)', label: 'Culture and Performing Arts Unit (CPAU)' },
                { value: 'Electronic Counseling Services (E-Counseling)', label: 'Electronic Counseling Services (E-Counseling)' },
                { value: 'Extension Services Division (ESD)', label: 'Extension Services Division (ESD)' },
                { value: 'Fabrication and Manufacturing Research Center (FMRC)', label: 'Fabrication and Manufacturing Research Center (FMRC)' },
                { value: 'General Services Office (GSO)', label: 'General Services Office (GSO)' },
                { value: 'Guidance and Counseling Office', label: 'Guidance and Counseling Office' },
                { value: 'Information Technology Services Office (ITSO)', label: 'Information Technology Services Office (ITSO)' },
                { value: 'Integrated Sustainability and Resilience Office (ISRO)', label: 'Integrated Sustainability and Resilience Office (ISRO)' },
                { value: 'Legal Affairs Office (LAO)', label: 'Legal Affairs Office (LAO)' },
                { value: 'Library', label: 'Library' },
                { value: 'Medical and Dental Services', label: 'Medical and Dental Services' },
                { value: 'Office of the President (OP)', label: 'Office of the President (OP)' },
                { value: 'Office of Student Services and Development (OSSD)', label: 'Office of Student Services and Development (OSSD)' },
                { value: 'Office of the Vice President for Academic Affairs (OVPAA)', label: 'Office of the Vice President for Academic Affairs (OVPAA)' },
                { value: 'Public Information and Community Relations Office (PICRO)', label: 'Public Information and Community Relations Office (PICRO)' },
                { value: 'Quality Assurance Office (QAO)', label: 'Quality Assurance Office (QAO)' },
                { value: "Registrar's Office", label: "Registrar's Office" },
                { value: 'Research Services Division (RSD)', label: 'Research Services Division (RSD)' },
                { value: 'Sentro ng Wika at Kultura', label: 'Sentro ng Wika at Kultura' },
                { value: 'Sports and Development Office', label: 'Sports and Development Office' },
                { value: 'Student Financial Assistance Unit (SFAU)', label: 'Student Financial Assistance Unit (SFAU)' },
                { value: 'Testing and Evaluation', label: 'Testing and Evaluation' },
            ],
        },
        {
            label: 'Colleges / Academic Institutions',
            options: [
                { value: 'College of Arts and Sciences (CAS) - Main Campus', label: 'College of Arts and Sciences (CAS) - Main Campus' },
                { value: 'College of Business and Public Administration (CBPA) - Main Campus', label: 'College of Business and Public Administration (CBPA) - Main Campus' },
                { value: 'College of Engineering - Main Campus', label: 'College of Engineering - Main Campus' },
                { value: 'Graduate School (GS) - Main Campus', label: 'Graduate School (GS) - Main Campus' },
                { value: 'College of Computing and Multimedia Studies (CCMS) - Main Campus', label: 'College of Computing and Multimedia Studies (CCMS) - Main Campus' },
                { value: 'College of Education (CoEd) - Abaño Campus', label: 'College of Education (CoEd) - Abaño Campus' },
                { value: 'College of Fisheries, Aquatic Sciences, & Technology (CFAST) - Mercedes Campus', label: 'College of Fisheries, Aquatic Sciences, & Technology (CFAST) - Mercedes Campus' },
                { value: 'College of Agriculture and Natural Resources (CANR) - Labo Campus', label: 'College of Agriculture and Natural Resources (CANR) - Labo Campus' },
                { value: 'College of Trades and Technology (CoTT) - Jose Panganiban Campus', label: 'College of Trades and Technology (CoTT) - Jose Panganiban Campus' },
            ],
        },
    ];

    const selectedDivisionOption = useMemo(() => {
        for (const group of divisionOptions) {
            const found = group.options.find((option) => option.value === department);
            if (found) {
                return found;
            }
        }
        return null;
    }, [department]);

    const divisionSelectStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            borderRadius: '0.75rem',
            borderColor: errors.department ? '#fca5a5' : state.isFocused ? '#f97316' : '#d1d5db',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(249, 115, 22, 0.2)' : 'none',
            '&:hover': { borderColor: '#f97316' },
            minHeight: '42px',
            fontSize: '0.875rem',
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#9a3412' : state.isFocused ? '#fed7aa' : '#ffffff',
            color: state.isSelected ? '#ffffff' : '#1f2937',
            cursor: 'pointer',
            fontSize: '0.875rem',
        }),
        groupHeading: (provided: any) => ({
            ...provided,
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#7c2d12',
            textTransform: 'none',
            paddingTop: '0.25rem',
            paddingBottom: '0.25rem',
        }),
        menuList: (provided: any) => ({
            ...provided,
            maxHeight: '260px',
            overflowY: 'auto',
        }),
        placeholder: (provided: any) => ({
            ...provided,
            color: '#9ca3af',
        }),
        singleValue: (provided: any) => ({
            ...provided,
            color: '#1f2937',
        }),
    };

    const getFundClusterDisplay = (value: string | null | undefined) => {
        if (!value) {
            return '';
        }

        const matched = fundClusterOptions.find((option) => option.value === value);
        return matched ? matched.label : value;
    };

    const recipientOptions = useMemo(() => {
        const uniqueRecipients = Array.from(new Set(groupedIssuances.map((i: any) => i.recipient)));
        return uniqueRecipients.map(r => ({ value: r, label: r }));
    }, [groupedIssuances]);

    // --- FILTERING LOGIC ---
    const filteredIssuances = useMemo(() => {
        return groupedIssuances.filter((issuance: any) => {
            // 1. Search Filter (Item Name OR Recipient)
            const lowerTerm = searchTerm.toLowerCase();
            const matchesSearch =
                issuance.item_names.some((name: string) => name.toLowerCase().includes(lowerTerm)) ||
                issuance.recipient.toLowerCase().includes(lowerTerm);

            // 2. Recipient Filter
            const matchesRecipient = filterRecipient ? issuance.recipient === filterRecipient.value : true;

            return matchesSearch && matchesRecipient;
        });
    }, [groupedIssuances, searchTerm, filterRecipient]);

    // Reset pagination when filters or grouped data change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterRecipient, groupedIssuances]);

    const totalPages = Math.max(1, Math.ceil(filteredIssuances.length / itemsPerPage));
    const paginatedIssuances = filteredIssuances.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // --- CUSTOM STYLES FOR REACT SELECT ---
    const customSelectStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            borderRadius: '0.375rem',
            borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
            borderWidth: '1px',
            padding: '1px 2px',
            minWidth: '150px',
            boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
            fontSize: '0.8125rem',
            fontWeight: '600',
            backgroundColor: '#ffffff',
            '&:hover': { borderColor: '#7f1d1d' },
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : '#ffffff',
            color: state.isSelected ? '#ffffff' : '#111827',
            padding: '7px 12px',
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: 'pointer',
        }),
        singleValue: (provided: any) => ({ ...provided, color: '#111827' }),
        menu: (provided: any) => ({
            ...provided,
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
            zIndex: 50,
        }),
        indicatorSeparator: () => ({ display: 'none' }),
    };

    // --- HANDLERS (Unchanged) ---
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsModalOpen(false);
        setRecipient('');
        setDateIssued(new Date().toISOString().split('T')[0]);
        setDepartment('');
        setFundCluster(null);
        setRecipientDesignation('');
        setPurpose('');
        setApprovedBy('');
        setApprovedByDesignation('');
        setIssuanceItems([{ item_id: '', quantity: '' }]);
        setErrors({});
    };

    const addItem = () => {
        setIssuanceItems([...issuanceItems, { item_id: '', quantity: '' }]);
    };

    useEffect(() => {
        if (!isModalOpen || issuanceItems.length <= 1) {
            return;
        }

        newItemAnchorRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
        });
    }, [issuanceItems.length, isModalOpen]);

    const removeItem = (index: number) => {
        if (issuanceItems.length > 1) {
            setIssuanceItems(issuanceItems.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof IssuanceItem, value: string) => {
        const newItems = [...issuanceItems];
        newItems[index][field] = value;
        setIssuanceItems(newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const data = {
            recipient,
            date_issued: dateIssued,
            department,
            fund_cluster: fundCluster?.label || '',
            recipient_designation: recipientDesignation,
            purpose,
            approved_by: approvedBy,
            approved_by_designation: approvedByDesignation,
            issuances: issuanceItems.filter(item => item.item_id && item.quantity),
        };

        router.post(route('inventory.issuance.store'), data, {
            onSuccess: () => {
                closeModal();
                setProcessing(false);
                setFormSuccessMessage('The new issuance record was successfully created.');
                setShowFormSuccessModal(true);
            },
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
                setFormErrorMessage('Failed to create the issuance record. Please check the form for errors.');
                setShowFormErrorModal(true);
            },
        });
    };

    const handleDetails = (issuance: any) => {
        setSelectedIssuance(issuance);
        setIsDetailsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedIssuance(null);
    };

    const handleViewForm = (issuance: any) => {
        setSelectedIssuance(issuance);
        setIsViewFormModalOpen(true);
    };

    const closeViewFormModal = () => {
        setIsViewFormModalOpen(false);
        setSelectedIssuance(null);
    };

    const handlePrintForm = () => {
        document.body.classList.add('printing-issuance');
        window.print();
        setTimeout(() => {
            document.body.classList.remove('printing-issuance');
        }, 500);
    };

    // Sidebar Modules
    const modules = getSidebarModules('Inventory', 'Issuance');

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 overflow-x-hidden">
            <Head title="Inventory - Issuance" />
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 8mm;
                    }
                    body.printing-issuance {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background: white !important;
                    }
                    
                    /* Completely remove Sidebar, Main content, and Dialog backdrops from layout */
                    body.printing-issuance aside,
                    body.printing-issuance main,
                    body.printing-issuance .absolute.inset-0.bg-gray-900\\/60 {
                        display: none !important;
                    }
                    
                    /* Reset Modal Wrapper so it sits cleanly at the top-left */
                    body.printing-issuance .fixed.inset-0.z-50 {
                        position: relative !important;
                        display: block !important;
                        width: auto !important;
                        height: auto !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
                    }

                    body.printing-issuance .relative.bg-white.rounded-2xl {
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        border-radius: 0 !important;
                        max-width: 210mm !important;
                        max-height: none !important;
                        transform: none !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                    }

                    body.printing-issuance .issuance-print-area {
                        border: none !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: 210mm !important;
                        display: flex !important;
                        justify-content: center !important;
                    }

                    body.printing-issuance .print\\:hidden {
                        display: none !important;
                    }

                    /* Make it actual A4 size without forced shrinking */
                    body.printing-issuance .print-zoom-fit {
                        zoom: 1;
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                        page-break-before: avoid !important;
                    }

                    /* Disable scrollbars */
                    ::-webkit-scrollbar {
                        display: none;
                    }
                }
            `}</style>


            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            {/* --- MAIN CONTENT --- */}
            <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>

                {/* Merged Sticky Institutional Header */}
                <header className="sticky top-0 z-40 shadow-xs">
                    {/* Top Institutional Bar */}
                    <div className="bg-red-950 text-red-100 text-[11px] px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-red-900 font-medium tracking-wide">
                        <div className="flex items-center gap-3">
                            <span className="font-bold tracking-wider uppercase text-amber-300">Supply & Property Management Office (SPMO)</span>
                            <span className="hidden md:inline text-red-400">|</span>
                            <span className="hidden md:inline text-red-200/80">University Enterprise Administrative System</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-red-300">
                            <SystemModeBadge />
                            <span>•</span>
                            <span>ACCESS LEVEL: AUTHORIZED PERSONNEL</span>
                        </div>
                    </div>

                    {/* Main Header Content */}
                    <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div>
                            <div className="mb-1">
                                <Breadcrumbs items={[{ name: 'Inventory' }, { name: 'Issuance' }]} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">Inventory Management</h2>
                            <p className="text-xs text-gray-500 font-medium">Stock distribution and issuance records</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block border-l border-gray-200 pl-6">
                                <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mt-0.5">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full overflow-x-hidden pb-16">

                    {/* Content Card */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 overflow-hidden">

                        {/* Card Header & Actions */}
                        <div className="px-6 lg:px-8 py-5 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">Inventory Issuance Records</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Track items released to faculty and departments.</p>
                            </div>

                            {/* Filter Controls Container */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                                {/* Search Input */}
                                <div className="relative flex-grow sm:w-64">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search item or recipient..."
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-xs"
                                    />
                                </div>

                                {/* Recipient Filter */}
                                <div className="w-full sm:w-48">
                                    <Select
                                        value={filterRecipient}
                                        onChange={setFilterRecipient}
                                        options={recipientOptions}
                                        placeholder="Recipient"
                                        isClearable
                                        styles={customSelectStyles}
                                        classNamePrefix="react-select"
                                    />
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={openModal}
                                    className="bg-red-950 hover:bg-red-900 text-white font-bold py-2 px-4 rounded-md shadow-xs transition-all text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider"
                                >
                                    <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    Record Issuance
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-hidden">
                            <table className="w-full table-fixed divide-y divide-gray-200">
                                <thead className="bg-gray-50/80 border-b border-gray-200">
                                    <tr>
                                        <th className="hidden lg:table-cell px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Item ID</th>
                                        <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Item Issued</th>
                                        <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Quantity</th>
                                        <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Amount</th>
                                        <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Recipient / Dept.</th>
                                        <th className="hidden md:table-cell px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Date Issued</th>
                                        <th className="hidden sm:table-cell px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Status</th>
                                        <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-right text-gray-700 uppercase font-mono w-[240px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {paginatedIssuances.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 lg:px-8 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                                    <p className="font-medium text-sm">No issuance records found.</p>
                                                    {(searchTerm || filterRecipient) && (
                                                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedIssuances.map((issuance: any, index: number) => (
                                            <tr key={index} className="hover:bg-red-50/30 transition-colors border-b border-gray-100 last:border-0 group">
                                                <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">
                                                    {getFormattedId(issuance)}
                                                </td>
                                                <td className="px-4 lg:px-6 py-4 text-sm font-bold text-gray-900 break-words">{issuance.item}</td>
                                                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold font-mono">
                                                    {issuance.quantity} <span className="text-gray-400 text-xs font-normal font-sans">pcs</span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium font-mono">
                                                    ₱{Number(issuance.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 lg:px-6 py-4 text-sm text-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-red-950/10 text-red-950 border border-red-950/20 flex items-center justify-center text-xs font-bold font-mono">
                                                            {issuance.recipient.charAt(0)}
                                                        </div>
                                                        <span className="break-words font-medium">{issuance.recipient}</span>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">{issuance.date}</td>
                                                <td className="hidden sm:table-cell px-4 lg:px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        issuance.status === 'Issued' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80' :
                                                        issuance.status === 'Pending' ? 'bg-amber-50 text-amber-800 border border-amber-200/80' : 
                                                        'bg-red-50 text-red-800 border border-red-200/80'
                                                    }`}>
                                                        {issuance.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-4 text-sm font-medium">
                                                    <div className="flex flex-wrap justify-end items-center gap-x-3 gap-y-1 text-right">
                                                        <button
                                                            onClick={() => handleViewForm(issuance)}
                                                            className="text-emerald-700 hover:text-emerald-900 transition-colors font-semibold text-xs uppercase tracking-wide"
                                                        >
                                                            View Form
                                                        </button>
                                                        <button
                                                            onClick={() => handleDetails(issuance)}
                                                            className="text-blue-700 hover:text-blue-900 transition-colors font-semibold text-xs uppercase tracking-wide"
                                                        >
                                                            Quick Details
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {groupedIssuances.length > 0 && (
                            <div className="px-6 lg:px-8 py-4 border-t border-gray-200/80 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <span className="text-xs text-gray-500 font-medium">Showing <span className="font-bold text-gray-800">{paginatedIssuances.length}</span> of <span className="font-bold text-gray-800">{filteredIssuances.length}</span> filtered records</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-50 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs text-gray-500 font-medium">Page {currentPage} of {totalPages}</span>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage >= totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-50 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </main>

            {/* ... MODALS ... */}
            <Modal show={isModalOpen} onClose={() => !processing && closeModal()} maxWidth="2xl" closeable={!processing}>
                <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-orange-100 max-h-[90vh] flex flex-col">
                    <div className="h-2 w-full bg-gradient-to-r from-orange-900 via-orange-800 to-orange-950"></div>
                    <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Record New Issuance</h3>
                                <p className="text-xs text-gray-500 font-medium">Issue multiple items in one transaction</p>
                            </div>
                        </div>
                        <button
                            onClick={closeModal}
                            disabled={processing}
                            className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-full transition-colors disabled:opacity-50"
                            aria-label="Close"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <form ref={modalFormRef} onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="group w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Recipient</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                            ${errors.recipient ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                        placeholder="Enter recipient name"
                                    />
                                </div>
                                {errors.recipient && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.recipient}</p>}
                            </div>
                            <div className="group w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Date Issued</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    </div>
                                    <input
                                        type="date"
                                        value={dateIssued}
                                        onChange={(e) => setDateIssued(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                            ${errors.date_issued ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                    />
                                </div>
                                {errors.date_issued && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.date_issued}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="group w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Division</label>
                                <Select
                                    value={selectedDivisionOption}
                                    onChange={(selected: any) => setDepartment(selected?.value || '')}
                                    options={divisionOptions}
                                    placeholder="Select Division"
                                    styles={divisionSelectStyles}
                                    classNamePrefix="react-select"
                                    isSearchable
                                    isClearable
                                    maxMenuHeight={260}
                                />
                                {errors.department && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.department}</p>}
                            </div>
                            <div className="group w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Fund Cluster</label>
                                <Select
                                    value={fundCluster}
                                    onChange={setFundCluster}
                                    options={fundClusterOptions}
                                    placeholder="Select fund cluster"
                                    styles={customSelectStyles}
                                    classNamePrefix="react-select"
                                />
                                {errors.fund_cluster && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.fund_cluster}</p>}
                            </div>
                            <div className="group w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Recipient Designation</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={recipientDesignation}
                                        onChange={(e) => setRecipientDesignation(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                            ${errors.recipient_designation ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                        placeholder="Enter recipient designation"
                                    />
                                </div>
                                {errors.recipient_designation && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.recipient_designation}</p>}
                            </div>
                            <div className="group w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Purpose</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                            ${errors.purpose ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                        placeholder="Enter purpose"
                                    />
                                </div>
                                {errors.purpose && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.purpose}</p>}
                            </div>
                            <div className="group w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Approved By</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={approvedBy}
                                        onChange={(e) => setApprovedBy(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                            ${errors.approved_by ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                        placeholder="Enter approver name"
                                    />
                                </div>
                                {errors.approved_by && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.approved_by}</p>}
                            </div>
                            <div className="group w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Approved By Designation</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={approvedByDesignation}
                                        onChange={(e) => setApprovedByDesignation(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                            ${errors.approved_by_designation ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                        placeholder="Enter approver designation"
                                    />
                                </div>
                                {errors.approved_by_designation && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.approved_by_designation}</p>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-semibold text-gray-700">Items to Issue</label>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    Add Item
                                </button>
                            </div>
                            {issuanceItems.map((item, index) => (
                                <div key={index} className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Item</label>
                                        <Select
                                            value={itemOptions.find(option => option.value === item.item_id)}
                                            onChange={(selected) => updateItem(index, 'item_id', selected?.value || '')}
                                            options={itemOptions}
                                            placeholder="Select item"
                                            styles={{
                                                control: (provided: any, state: any) => ({
                                                    ...provided,
                                                    borderRadius: '0.5rem',
                                                    borderColor: state.isFocused ? '#ea580c' : '#d1d5db',
                                                    boxShadow: state.isFocused ? '0 0 0 2px rgba(234, 88, 12, 0.2)' : provided.boxShadow,
                                                    '&:hover': { borderColor: '#ea580c' },
                                                    minHeight: '38px',
                                                    fontSize: '0.875rem',
                                                }),
                                                option: (provided: any, state: any) => ({
                                                    ...provided,
                                                    backgroundColor: state.isSelected ? '#9a3412' : state.isFocused ? '#fed7aa' : null,
                                                    color: state.isSelected ? 'white' : '#1f2937',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                }),
                                                input: (provided: any) => ({ ...provided, color: '#1f2937' }),
                                                singleValue: (provided: any) => ({ ...provided, color: '#1f2937' }),
                                            }}
                                            classNamePrefix="react-select"
                                        />
                                        {errors[`issuances.${index}.item_id`] && <p className="mt-1 text-xs text-red-600 font-medium">{errors[`issuances.${index}.item_id`]}</p>}
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                            className={`w-full px-3 py-2 bg-white border rounded-lg text-sm shadow-sm placeholder-gray-400
                                                focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                                ${errors[`issuances.${index}.quantity`] ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                            min="1"
                                            placeholder="Qty"
                                        />
                                        {errors[`issuances.${index}.quantity`] && <p className="mt-1 text-xs text-red-600 font-medium">{errors[`issuances.${index}.quantity`]}</p>}
                                    </div>
                                    {issuanceItems.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="text-red-500 hover:text-red-700 p-2"
                                            title="Remove item"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <div ref={newItemAnchorRef} />
                            {errors.issuances && <p className="mt-1 text-xs text-red-600 font-medium">{errors.issuances}</p>}
                        </div>

                        <div className="pt-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 -m-8 px-8 py-5">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={processing}
                                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2.5 bg-gradient-to-r from-orange-700 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Issuing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        Issue Items
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal show={isDetailsModalOpen && Boolean(selectedIssuance)} onClose={closeDetailsModal} maxWidth="2xl">
                {selectedIssuance && (
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-blue-100">
                        <div className="h-2 w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950"></div>
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-900">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Issuance Details</h3>
                                    <p className="text-xs text-gray-500 font-medium">Item ID: {getFormattedId(selectedIssuance)}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeDetailsModal}
                                className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Items Issued</label>
                                    <div className="space-y-1">
                                        {selectedIssuance.items_list?.map((it: any, idx: number) => (
                                            <p key={idx} className="text-sm text-gray-900 font-medium">
                                                {it.quantity}x {it.item}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total Quantity</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.quantity} pcs</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.recipient}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date Issued</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.date}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedIssuance.status === 'Issued' ? 'bg-green-100 text-green-800' :
                                        selectedIssuance.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {selectedIssuance.status}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Issued By</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.issued_by || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button
                                onClick={closeDetailsModal}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal show={isViewFormModalOpen && Boolean(selectedIssuance)} onClose={closeViewFormModal} maxWidth="4xl">
                {selectedIssuance && (
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-green-100 flex flex-col max-h-[90vh] print:max-w-full print:max-h-full print:rounded-none print:border-none print:shadow-none print-single-page print-zoom-fit">
                        <div className="h-2 w-full bg-gradient-to-r from-green-900 via-green-800 to-green-950 flex-shrink-0 print:hidden"></div>
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 print:hidden">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 rounded-lg text-green-900">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Issuance Form</h3>
                                    <p className="text-xs text-gray-500 font-medium">Item ID: {getFormattedId(selectedIssuance)}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeViewFormModal}
                                className="text-gray-400 hover:text-green-600 hover:bg-green-50 p-2 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto w-full bg-gray-100 flex justify-center print:p-0 print:bg-white print:overflow-hidden">
                            <div className="issuance-print-area border border-gray-300 rounded shadow-sm bg-white overflow-x-auto w-full max-w-[210mm] p-4 print:border-none print:rounded-none print:shadow-none print:bg-white print:p-0 print:max-w-full print-single-page">
                                <RequisitionIssueSlip data={{
                                    entity_name: "University of Camarines Norte",
                                    fund_cluster: getFundClusterDisplay(selectedIssuance.fund_cluster),
                                    division: selectedIssuance.department || "",
                                    responsibility_center_code: "",
                                    office: selectedIssuance.department || "",
                                    ris_no: getFormattedId(selectedIssuance),
                                    purpose: selectedIssuance.purpose || "",
                                    items: selectedIssuance.items_list?.map((it: any) => ({
                                        stock_no: it.stock_no || '',
                                        unit: "pcs",
                                        description: it.item,
                                        quantity: it.quantity,
                                        stock_available: true,
                                        issue_quantity: it.quantity,
                                        remarks: ""
                                    })) || [],
                                    requested_by_name: selectedIssuance.recipient,
                                    requested_by_designation: selectedIssuance.recipient_designation,
                                    requested_by_date: selectedIssuance.date,
                                    approved_by_name: selectedIssuance.approved_by,
                                    approved_by_designation: selectedIssuance.approved_by_designation,
                                    approved_by_date: selectedIssuance.date,
                                    issued_by_name: selectedIssuance.issued_by,
                                    issued_by_designation: "Supply Officer",
                                    issued_by_date: selectedIssuance.date,
                                    received_by_name: selectedIssuance.recipient,
                                    received_by_designation: selectedIssuance.recipient_designation,
                                    received_by_date: selectedIssuance.date
                                }} />
                            </div>
                        </div>
                        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0 print:hidden">
                            <button
                                onClick={handlePrintForm}
                                className="px-6 py-2 text-green-700 bg-green-50 hover:bg-green-100 font-bold rounded-lg transition-colors flex items-center gap-2 border border-green-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                Print Form
                            </button>
                            <button
                                onClick={closeViewFormModal}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition-all duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>


            {/* FORM SUCCESS MODAL */}
            <Modal show={showFormSuccessModal} onClose={() => setShowFormSuccessModal(false)} maxWidth="sm">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-green-100 text-center">
                    <div className="h-2 w-full bg-gradient-to-r from-green-500 to-green-600"></div>
                    <div className="p-8">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                        <p className="text-sm text-gray-500 mb-8">{formSuccessMessage}</p>
                        <button
                            onClick={() => setShowFormSuccessModal(false)}
                            className="w-full px-5 py-3 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-md focus:outline-none transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* FORM ERROR MODAL */}
            <Modal show={showFormErrorModal} onClose={() => setShowFormErrorModal(false)} maxWidth="sm">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-red-100 text-center">
                    <div className="h-2 w-full bg-gradient-to-r from-red-500 to-red-600"></div>
                    <div className="p-8">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Operation Failed</h3>
                        <p className="text-sm text-gray-500 mb-8">{formErrorMessage || 'Please check the form for errors and try again.'}</p>
                        <button
                            onClick={() => setShowFormErrorModal(false)}
                            className="w-full px-5 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md focus:outline-none transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}