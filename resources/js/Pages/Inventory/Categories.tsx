import ApplicationLogo from '@/Components/ApplicationLogo';
import Sidebar from '@/Components/Sidebar';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { getSidebarModules } from '@/utils/sidebarConfig';

// --- REUSABLE UI COMPONENTS (Internal for this file) ---

const InventoryModal = ({ show, onClose, title, children, footer, isSubmitting }: any) => {
    if (!show) return null;

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
            {/* Backdrop with Blur */}
            <div 
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                onClick={!isSubmitting ? onClose : undefined}
            ></div>

            {/* Modal Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100 overflow-hidden border border-red-100">
                
                {/* Decorative Top Bar */}
                <div className="h-2 w-full bg-gradient-to-r from-red-900 via-red-800 to-red-950"></div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-red-900">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
                            <p className="text-xs text-gray-500 font-medium">Inventory Management</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label="Close"
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {children}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    {footer}
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ label, icon, ...props }: any) => (
    <div className="group">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-600 transition-colors">
                {icon}
            </div>
            <input 
                {...props}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm shadow-sm placeholder-gray-400
                focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
            />
        </div>
    </div>
);

const FormTextarea = ({ label, icon, ...props }: any) => (
    <div className="group">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">{label}</label>
        <div className="relative">
            <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none text-gray-400 group-focus-within:text-red-600 transition-colors">
                {icon}
            </div>
            <textarea 
                {...props}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm shadow-sm placeholder-gray-400
                focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 min-h-[100px]"
            />
        </div>
    </div>
);

// --- MAIN COMPONENT ---

export default function Categories({ auth, categories }: { auth: any, categories: any[] }) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);

    // Modal and Form State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        router.post(route('inventory.categories.store'), formData, {
            onSuccess: () => {
                setShowAddModal(false);
                setFormData({ name: '', description: '' });
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleEdit = (category: any) => {
        setEditingCategory(category);
        setFormData({ name: category.name, description: category.description || '' });
        setShowEditModal(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.put(route('inventory.categories.update', editingCategory.id), formData, {
            onSuccess: () => {
                setShowEditModal(false);
                setEditingCategory(null);
                setFormData({ name: '', description: '' });
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleDelete = (category: any) => {
        if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
            router.delete(route('inventory.categories.delete', category.id));
        }
    }; 

    // Sidebar Modules Definition
    const modules = getSidebarModules('Inventory', 'Categories');

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Head title="Inventory - Categories" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            {/* --- MAIN CONTENT --- */}
            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
                
                {/* Fixed Top Header */}
                <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Inventory Management</h2>
                        <p className="text-sm text-gray-500">Master list of item classifications.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <span className="block text-sm font-bold text-gray-800">
                                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-8 max-w-[1600px] mx-auto">
                    
                    {/* Content Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        
                        {/* Card Header & Actions */}
                        <div className="px-8 py-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Categories</h3>
                                <p className="text-xs text-gray-500 mt-1">Organize and manage your inventory classifications.</p>
                            </div>
                            <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    placeholder="Search categories..." 
                                    className="text-sm border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500 shadow-sm"
                                />
                                <button 
                                    onClick={() => setShowAddModal(true)}
                                    className="bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    Add New Category
                                </button>
                            </div>
                        </div>

                        {/* Categories Grid */}
                        <div className="p-8 bg-white min-h-[400px]">
                            {categories.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                    <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                    <p>No categories found. Start by adding one.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {categories.map((category, index) => (
                                        <div key={index} className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-red-100 transition-all duration-300">
                                            {/* Decorative Folder Icon */}
                                            <div className="absolute top-4 right-4 text-gray-200 group-hover:text-red-50 transition-colors">
                                                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"></path></svg>
                                            </div>

                                            <div className="relative z-10">
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-900 transition-colors mb-2">
                                                    {category.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 line-clamp-2 mb-6">
                                                    {category.description || 'No description provided.'}
                                                </p>
                                                
                                                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                                                    <button 
                                                        onClick={() => handleEdit(category)}
                                                        className="flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors gap-1"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(category)}
                                                        className="flex items-center text-xs font-semibold text-red-500 hover:text-red-700 transition-colors gap-1"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Pagination (Placeholder) */}
                        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Showing {categories.length} categories</span>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-white disabled:opacity-50" disabled>Previous</button>
                                <button className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-white disabled:opacity-50" disabled>Next</button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* --- MODALS SECTION (Enhanced) --- */}
            
            {/* Add Modal */}
            <InventoryModal 
                show={showAddModal} 
                onClose={() => setShowAddModal(false)} 
                title="New Category"
                isSubmitting={isSubmitting}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 shadow-lg hover:shadow-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Creating...
                                </>
                            ) : 'Create Category'}
                        </button>
                    </>
                }
            >
                <form id="addForm" className="space-y-5">
                    <FormInput 
                        label="Category Name"
                        id="name"
                        value={formData.name}
                        onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Office Supplies"
                        required
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>}
                    />
                    <FormTextarea 
                        label="Description"
                        id="description"
                        value={formData.description}
                        onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Briefly describe what items belong in this category..."
                        rows={3}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>}
                    />
                </form>
            </InventoryModal>

            {/* Edit Modal */}
            <InventoryModal 
                show={showEditModal} 
                onClose={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                    setFormData({ name: '', description: '' });
                }} 
                title="Edit Category"
                isSubmitting={isSubmitting}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                setShowEditModal(false);
                                setEditingCategory(null);
                                setFormData({ name: '', description: '' });
                            }}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 shadow-lg hover:shadow-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Updating...
                                </>
                            ) : 'Save Changes'}
                        </button>
                    </>
                }
            >
                <form id="editForm" className="space-y-5">
                    <FormInput 
                        label="Category Name"
                        id="edit-name"
                        value={formData.name}
                        onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Office Supplies"
                        required
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>}
                    />
                    <FormTextarea 
                        label="Description"
                        id="edit-description"
                        value={formData.description}
                        onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Briefly describe what items belong in this category..."
                        rows={3}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>}
                    />
                </form>
            </InventoryModal>
        </div>
    );
}