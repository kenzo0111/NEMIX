import type { PropsWithChildren } from 'react';
export default function DashboardContent({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
    return <div className={'mx-auto w-full min-w-0 max-w-[1600px] space-y-6 p-4 pb-16 sm:p-7 sm:pb-16 lg:p-8 lg:pb-16 ' + className}>{children}</div>;
}
