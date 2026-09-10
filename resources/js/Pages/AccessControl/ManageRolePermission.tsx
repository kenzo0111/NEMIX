import React from 'react';
import RolesIndex from './Roles/Index';
import { ManageRolePermissionPageProps } from './Roles/types';

export default function ManageRolePermission(props: ManageRolePermissionPageProps) {
    return <RolesIndex {...props} />;
}

export * from './Roles/types';