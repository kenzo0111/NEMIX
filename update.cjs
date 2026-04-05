const fs = require('fs');
const path = require('path');
const files = [
    { p: 'resources/js/Pages/Dashboard.tsx', i: [] },
    { p: 'resources/js/Pages/Acquisition/InboundDeliveries.tsx', i: [{name: 'Acquisition'}, {name: 'Inbound Deliveries'}] },
    { p: 'resources/js/Pages/Acquisition/ProcurementPanel.tsx', i: [{name: 'Acquisition'}, {name: 'Procurement Panel'}] },
    { p: 'resources/js/Pages/AuditLogs/ManageLoginTrails.tsx', i: [{name: 'Audit Logs'}, {name: 'Manage Login Trails'}] },
    { p: 'resources/js/Pages/AuditLogs/ManageTransaction.tsx', i: [{name: 'Audit Logs'}, {name: 'Manage Transaction'}] },
    { p: 'resources/js/Pages/Compliance/ManageAnalytics.tsx', i: [{name: 'Compliance'}, {name: 'Manage Analytics'}] },
    { p: 'resources/js/Pages/Compliance/ManageReports.tsx', i: [{name: 'Compliance'}, {name: 'Manage Reports'}] },
    { p: 'resources/js/Pages/Inventory/AllItems.tsx', i: [{name: 'Inventory'}, {name: 'All Items'}] },
    { p: 'resources/js/Pages/Inventory/Categories.tsx', i: [{name: 'Inventory'}, {name: 'Categories'}] },
    { p: 'resources/js/Pages/Inventory/Issuance.tsx', i: [{name: 'Inventory'}, {name: 'Issuance'}] },
    { p: 'resources/js/Pages/Inventory/Receiving.tsx', i: [{name: 'Inventory'}, {name: 'Receiving'}] },
    { p: 'resources/js/Pages/Suppliers/ManageSupplier.tsx', i: [{name: 'Suppliers'}, {name: 'Manage Supplier'}] }
];

files.forEach(f => {
    const fullPath = path.join(process.cwd(), f.p);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('import Breadcrumbs')) {
        content = content.replace(/(import .*?;)/, "$1\nimport Breadcrumbs from '@/Components/Breadcrumbs';");
    }
    if (!content.includes('<Breadcrumbs')) {
        const items = JSON.stringify(f.i).replace(/"/g, "'").replace(/'name'/g, 'name');
        const b = "\n                                <div className=\"mb-2\">\n                                    <Breadcrumbs items={" + items + "} />\n                                </div>\n";
        content = content.replace(/(<h2[^>]*>)/, b + "$1");
        fs.writeFileSync(fullPath, content);
        console.log('Updated ' + f.p);
    }
});
