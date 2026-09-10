export default function ScannerIdleState() {
    return (
        <div className="text-center py-12 px-4 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-700">
                Awaiting Item Selection
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Select an inventory item from the catalog on the left to activate the RFID scanner.
            </p>
        </div>
    );
}
