import React from 'react';
import AllItemsIndex from './AllItems/Index';
import { AllItemsProps } from './AllItems/types';

export default function AllItems(props: AllItemsProps) {
    return <AllItemsIndex {...props} />;
}

export * from './AllItems/types';