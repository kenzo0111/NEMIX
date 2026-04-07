import Sidebar from '@/Components/Sidebar';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { getSidebarModules } from '@/utils/sidebarConfig';

export default function ManageAnalytics({ auth }: { auth: any }) {
    const { props } = usePage();
    const user = auth?.user || (props.auth as any)?.user;
    const [collapsed, setCollapsed] = useState(false);
    
    const modules = getSidebarModules('Inventory', 'Manage Analytics');

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Head title="Inventory Analytics" />

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
                        
                                <div className="mb-2">
                                    <Breadcrumbs items={[{name:'Inventory'},{name:'Manage Analytics'}]} />
                                </div>
<h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Inventory Analytics</h2>
                        <p className="text-sm text-gray-500">View inventory metrics and reports.</p>
                    </div>
                </div>

                <div className="p-8">
                    <div className="max-w-7xl mx-auto">
                        <h3 className="text-lg font-medium text-gray-900">Overview</h3>
                        <p className="mt-1 text-gray-500 mb-6">
                            Key performance indicators for inventory.
                        </p>

                        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Stat Card 1 */}
                            <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <dt className="truncate text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    Total Items in Stock
                                </dt>
                                <dd className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                                    1,245
                                </dd>
                            </div>

                            {/* Stat Card 2 */}
                            <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <dt className="truncate text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    Low Stock Alerts
                                </dt>
                                <dd className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                                    12
                                </dd>
                            </div>

                            {/* Stat Card 3 */}
                            <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <dt className="truncate text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    Out of Stock
                                </dt>
                                <dd className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                                    3
                                </dd>
                            </div>

                            {/* Stat Card 4 */}
                            <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <dt className="truncate text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    Total Value
                                </dt>
                                <dd className="mt-2 text-xl font-bold tracking-tight text-gray-900">
                                    $45,230
                                </dd>
                            </div>

                            {/* Stat Card 5 */}
                            <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <dt className="truncate text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    Highest Consumable
                                </dt>
                                <dd className="mt-2 text-xl font-bold tracking-tight text-gray-900 truncate" title="Printer Paper A4">
                                    Printer Paper A4
                                </dd>
                            </div>

                            {/* Stat Card 6 */}
                            <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <dt className="truncate text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    Lowest Consumable
                                </dt>
                                <dd className="mt-2 text-xl font-bold tracking-tight text-gray-900 truncate" title="Blue Ink Cartridge">
                                    Blue Ink Cartridge
                                </dd>
                            </div>
                        </dl>
                        
                        <div className="mt-8">
                            <h4 className="text-base font-bold text-gray-900 mb-4">Detailed Reports</h4>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                               <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                                    <span className="text-gray-400 font-medium">Chart Placeholder (Integrate Charting Library Here)</span>
                               </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
