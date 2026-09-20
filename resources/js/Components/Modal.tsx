import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';
import React, { PropsWithChildren } from 'react';

export default function Modal({
    children,
    show = false,
    maxWidth = 'lg',
    closeable = true,
    initialFocus,
    ariaLabel,
    onClose = () => {},
}: PropsWithChildren<{
    show: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
    closeable?: boolean;
    initialFocus?: React.RefObject<HTMLElement | null>;
    ariaLabel?: string;
    onClose: CallableFunction;
}>) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '3xl': 'sm:max-w-3xl',
        '4xl': 'sm:max-w-4xl',
        '5xl': 'sm:max-w-5xl',
        '6xl': 'sm:max-w-6xl',
        '7xl': 'sm:max-w-7xl',
    }[maxWidth];

    return (
        <Transition show={show} leave="duration-200">
            <Dialog
                as="div"
                id="modal"
                aria-label={ariaLabel}
                className="fixed inset-0 z-50 overflow-y-auto print:static print:overflow-visible print:p-0 print:m-0 print:block"
                onClose={close}
                initialFocus={initialFocus}
            >
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity print:hidden"
                        aria-hidden="true"
                    />
                </TransitionChild>

                <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6 print:block print:p-0">
                    <TransitionChild
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        enterTo="opacity-100 translate-y-0 sm:scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                        leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    >
                        <DialogPanel
                            className={`w-full my-auto transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-left align-middle shadow-2xl border border-slate-200/80 dark:border-slate-800 transition-all max-w-[calc(100vw-2rem)] ${maxWidthClass} print:m-0 print:p-0 print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none print:transform-none print:overflow-visible`}
                        >
                            {children}
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}

