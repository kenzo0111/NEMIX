import React, { KeyboardEvent, ClipboardEvent } from 'react';

interface Props {
    digits: string[];
    inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
    onChange: (index: number, value: string) => void;
    onKeyDown: (index: number, e: KeyboardEvent<HTMLInputElement>) => void;
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    hasError?: boolean;
}

export default function OtpDigitInput({
    digits,
    inputRefs,
    onChange,
    onKeyDown,
    onPaste,
    disabled = false,
    hasError = false,
}: Props) {
    return (
        <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={onPaste}>
            {digits.map((digit, idx) => (
                <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => onChange(idx, e.target.value)}
                    onKeyDown={(e) => onKeyDown(idx, e)}
                    disabled={disabled}
                    aria-label={`Digit ${idx + 1}`}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-lg border text-slate-900 focus:outline-none focus:ring-2 transition-all select-none ${
                        digit
                            ? 'border-red-900 bg-white ring-1 ring-red-900/10'
                            : disabled
                            ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                            : hasError
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/20'
                            : 'border-slate-300 bg-white focus:border-red-900 focus:ring-red-900/20'
                    }`}
                />
            ))}
        </div>
    );
}
