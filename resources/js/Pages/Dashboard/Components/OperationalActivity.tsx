import React from 'react';
import { RecentReceiving as RecentReceivingType, RecentIssuance as RecentIssuanceType } from '../types';
import RecentReceiving from './RecentReceiving';
import RecentIssuance from './RecentIssuance';

interface OperationalActivityProps {
    receiving?: RecentReceivingType[];
    issuance?: RecentIssuanceType[];
}

export default function OperationalActivity({
    receiving = [],
    issuance = [],
}: OperationalActivityProps) {
    return (
        <section aria-label="Operational Activity">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Operational Activity
                </h2>
                <span className="text-[11px] text-gray-500 font-medium">
                    Recent Inflow & Outflow
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <RecentReceiving receivings={receiving} />
                <RecentIssuance issuances={issuance} />
            </div>
        </section>
    );
}
