import { Head } from '@inertiajs/react';

export default function Index() {
    return (
        <>
            <Head title="Access Control" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-2xl font-bold mb-4">Access Control</h1>
                            <p>Manage access control here.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}