import React from 'react';
import ReceivingIndex from './Receiving/Index';
import { ReceivingPageProps } from './Receiving/types';

export default function Receiving(props: ReceivingPageProps) {
    return <ReceivingIndex {...props} />;
}

export * from './Receiving/types';