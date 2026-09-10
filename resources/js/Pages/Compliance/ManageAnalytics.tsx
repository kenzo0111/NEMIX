import React from 'react';
import AnalyticsIndex from './Analytics/Index';
import { ManageAnalyticsPageProps } from './Analytics/types';

export default function ManageAnalytics(props: ManageAnalyticsPageProps) {
    return <AnalyticsIndex {...props} />;
}
