import type { PropsWithChildren, ReactNode } from 'react';
import AppLayout from './AppLayout';
export default function Authenticated({ header, children }: PropsWithChildren<{ header?: ReactNode }>) {
    return <AppLayout header={header}>{children}</AppLayout>;
}
