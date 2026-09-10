import { RFIDInventoryItem } from '../../types';

interface ScannerReadyStateProps {
    item: RFIDInventoryItem;
    onOpenManualEntry: () => void;
}

export default function ScannerReadyState({ item, onOpenManualEntry }: ScannerReadyStateProps) {
    return (
        <div className="text-center py-10 px-4 bg-gray-50/50 rounded-xl border border-gray-200 flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-white rounded-full border border-gray-200 shadow-2xs flex items-center justify-center mx-auto text-red-900 mb-3">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                </svg>
            </div>

            <h3 className="text-base font-semibold text-gray-900 font-serif">
                Ready to Scan
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Present the RFID tag to the handheld reader or point the scanner trigger at the tag.
            </p>

            <div className="w-20 border-t border-gray-200 my-4" />

            <div className="text-xs text-gray-500">
                <span>Having scanner issues? </span>
                <button
                    type="button"
                    onClick={onOpenManualEntry}
                    className="text-red-900 hover:text-red-950 font-medium underline cursor-pointer"
                >
                    Enter RFID manually
                </button>
            </div>
        </div>
    );
}
