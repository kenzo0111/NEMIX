import React from 'react';
import ManageStaffsIndex from './ManageStaffs/Index';
import { ManageStaffsPageProps } from './ManageStaffs/types';

export default function ManageStaffs(props: ManageStaffsPageProps) {
    return <ManageStaffsIndex {...props} />;
}

export * from './ManageStaffs/types';