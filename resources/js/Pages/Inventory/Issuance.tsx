import React from 'react';
import IssuanceIndex from './Issuance/Index';
import { IssuancePageProps } from './Issuance/types';

export default function Issuance(props: IssuancePageProps) {
    return <IssuanceIndex {...props} />;
}

export * from './Issuance/types';