import React from 'react';
import LoginAudit from '../resources/js/Pages/AuditLogs/Login/Index';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import CoordinatorInventory from '../resources/js/Pages/Inventory/Coordinator/Index';
import CentralSupplyCatalog from '../resources/js/Pages/Inventory/Coordinator/Catalog';
import MyRequests from '../resources/js/Pages/Inventory/Requests/Index';
import DashboardIndex from '../resources/js/Pages/Dashboard/Index';
import '../resources/css/app.css';

const dashboardPreview = new URLSearchParams(location.search).get('view') === 'dashboard';
const auditPreview = new URLSearchParams(location.search).get('view') === 'audit';
const catalogPreview = new URLSearchParams(location.search).get('view') === 'catalog';
const requestsPreview = new URLSearchParams(location.search).get('view') === 'requests';
const activeRoute = dashboardPreview ? 'dashboard' : auditPreview ? 'audit-logs.login-trails' : catalogPreview ? 'coordinator.catalog.index' : requestsPreview ? 'inventory.requests.index' : 'coordinator.inventory.index';
const urls = { 'audit-logs.login-trails': '/audit-logs/login-trails', dashboard: '/dashboard', 'inventory.requests.index': '/inventory/requests', 'coordinator.inventory.index': '/delivery-unit/inventory', 'coordinator.catalog.index': '/delivery-unit/central-stock' };
window.route = ((name, args) => name ? `${urls[name] ?? '/preview'}${args ? `?${new URLSearchParams(args)}` : ''}` : { current: (name) => name ? name === activeRoute : activeRoute }) as any;
const stockData = [
    ['Ballpen (Black)', 'COS-26-10-002-0006', 'piece', 96, '1344'], ['Ballpen (Blue)', 'COS-26-10-001-0001', 'piece', 47, '564'],
    ['Bleach Solution', 'OWI-26-10-013-0003', 'bottle', 2, '138'], ['Bond Paper A4', 'NBS-26-10-004-0001', 'ream', 118, '32712'],
    ['Bond Paper Long', 'COS-26-10-005-0005', 'ream', 92, '29900'], ['Correction Tape', 'COS-26-10-007-0007', 'piece', 0, '0'],
].map(([name, sku, unit, quantity, value], i) => ({ id: i + 1, name, sku, unit, quantity, value }));
const props = {
    auth: { user: { id: 1, name: 'Supply Coordinator', email: 'coordinator@example.test', role: 'Supply Coordinator', roles: ['Supply Coordinator'] }, roles: ['Supply Coordinator'], is_system_admin: false,
        permissions: ['route:coordinator.inventory.index', 'route:coordinator.inventory.issue', 'route:coordinator.inventory.stock-card', 'route:inventory.requests.index', 'route:inventory.requests.store', 'route:inventory.requests.update', 'route:inventory.requests.cancel'],
        capabilities: { dashboard: true, coordinatorInventory: true, requests: true, inventory: { view: false, receiving: false, issuance: false, requests: true }, rfid: { view: false }, suppliers: { view: false }, compliance: { reports: false, analytics: false }, audit: { login: true, transactions: false }, accessControl: { roles: false, staff: false }, systemSettings: false } },
    branding: { institutionName: 'University of Camarines Norte', acronym: 'UCN', officeName: 'Supply & Property Management Office' }, inventoryScope: 'coordinator', lowStockThreshold: 10,
    stocks: stockData,
    movements: { data: [{ id: 1, type: 'receipt', quantity: 15, date: '2026-10-19', reference: '2026-10-0008', office: 'College of Computing and Multimedia Studies (CCMS) – Main Campus', stock: stockData[2] }, { id: 2, type: 'issue', quantity: 4, date: '2026-10-20', reference: 'UNIT-ISSUE-2', office: 'Faculty Room — Juan Dela Cruz', stock: stockData[0] }], from: 1, to: 2, total: 2, links: [{ url: null, label: '&laquo; Previous', active: false }, { url: '/tmp/coordinator-preview.html?page=1', label: '1', active: true }, { url: null, label: 'Next &raquo;', active: false }] },
};
const catalogItems = stockData.map((stock, i) => ({ id: stock.id, name: stock.name, sku: stock.sku, description: 'For daily administrative and academic office use.', unit: stock.unit, on_hand: i === 5 ? 3 : stock.quantity, available_quantity: i === 0 ? 80 : stock.quantity }));
const catalogProps = { ...props, filters: { search: '', availability: 'all' }, items: { data: catalogItems, from: 1, to: 6, total: 6, links: [] } };
const requestItems = stockData.filter(stock => Number(stock.quantity) > 0).map(stock => ({ id: stock.id, name: stock.name, sku: stock.sku, stock: stock.quantity, unit_of_issue: stock.unit, unit_cost: 10 }));
const requestSamples = ['Pending', 'Approved', 'Issued', 'Rejected', 'Cancelled', ...Array(8).fill('Pending')].map((status, i) => ({ id: i + 1, requested_by: 1, recipient: 'Supply Coordinator', department: 'College of Computing and Multimedia Studies (CCMS) – Main Campus', purpose: ['Faculty office supplies', 'Learning materials for the semester', 'Daily administrative operations'][i % 3], status, ris_number: `2026-10-${String(i + 1).padStart(4, '0')}`, review_remarks: status === 'Approved' ? 'Approved quantities adjusted to available stock.' : status === 'Rejected' ? 'Please revise the item quantities.' : null, created_at: `2026-10-${String(21 - i).padStart(2, '0')}T02:00:00Z`, date_requested: `2026-10-${String(21 - i).padStart(2, '0')}`, items: [{ id: i + 1, item_id: requestItems[i % 4].id, item: requestItems[i % 4], quantity: 10, approved_quantity: ['Approved', 'Issued'].includes(status) ? 7 : null }] }));
const requestProps = { ...props, requests: requestSamples, initialItemId: Number(new URLSearchParams(location.search).get('item_id')), items: requestItems };
const auditProps = { ...props, inventoryScope: null, loginData: ['login_success', 'logout', 'login_failed'].map((event, i) => ({ id: i + 1, user_id: 1, user_name: 'Supply Coordinator', email: 'coordinator@example.test', role: 'Supply Coordinator', event, ip_address: '192.0.2.10', occurred_at: '2026-10-21T02:30:00Z', user_agent: 'Example browser for layout preview' })), summary: {total: 3, successful: 1, failed: 1, unique_users: 1}, filters: {}, availableRoles: ['Supply Coordinator'], availableStatuses: [{ value: 'login_success', label: 'Successful Login' }, { value: 'login_failed', label: 'Failed Login' }, { value: 'logout', label: 'Logged Out' }] };
const dashboardProps = {
    ...props,
    coordinatorName: 'Supply Coordinator',
    summary: { total_inventory_value: 64658, available_items: 5, issued_this_month: 24, critical_stock: 1, unserviceable: 1 },
    movement: [
        { label: 'May 2026', starting: 40, stockIn: 100, risIssued: 45 },
        { label: 'Jun 2026', starting: 95, stockIn: 80, risIssued: 60 },
        { label: 'Jul 2026', starting: 115, stockIn: 120, risIssued: 70 },
        { label: 'Aug 2026', starting: 165, stockIn: 50, risIssued: 80 },
        { label: 'Sep 2026', starting: 135, stockIn: 90, risIssued: 55 },
        { label: 'Oct 2026', starting: 170, stockIn: 65, risIssued: 24 },
    ],
    movementSummary: { received: 505, issued: 334, starting_balance: 40, ending_balance: 211 },
    recentReceiving: [
        { id: 1, item_name: 'Bond Paper A4', quantity: 20, unit: 'ream', supplier: 'Supply Office', received_at: '2026-10-19' },
        { id: 2, item_name: 'Ballpen (Black)', quantity: 50, unit: 'piece', supplier: 'Supply Office', received_at: '2026-10-15' },
    ],
    recentIssuance: [
        { id: 1, ris_number: 'UNIT-ISSUE-1', item_name: 'Bond Paper A4', recipient: 'College Dean Office', total_items: 5, unit: 'ream', issued_at: '2026-10-20' },
        { id: 2, ris_number: 'UNIT-ISSUE-2', item_name: 'Ballpen (Black)', recipient: 'Faculty Room — Juan Dela Cruz', total_items: 4, unit: 'piece', issued_at: '2026-10-20' },
    ],
    criticalStock: [
        { id: 3, name: 'Bleach Solution', sku: 'OWI-26-10-013-0003', current: 2, min: 10, unit: 'bottle', priority: 'Critical' },
        { id: 6, name: 'Correction Tape', sku: 'COS-26-10-007-0007', current: 0, min: 10, unit: 'piece', priority: 'Critical' },
    ],
    recentActivity: [
        { id: 1, title: 'Delivery Unit issue', summary: '4 piece · Ballpen (Black)', reference: 'UNIT-ISSUE-2', module: 'Inventory', occurred_at: '2026-10-20T10:30:00Z' },
        { id: 2, title: 'Received from Supply Office', summary: '15 bottle · Bleach Solution', reference: '2026-10-0008', module: 'Inventory', occurred_at: '2026-10-19T08:15:00Z' },
    ],
    requestSummary: { Pending: 8, Approved: 1, Issued: 1, Rejected: 1, Cancelled: 1 },
    filters: { chartFilter: 'monthly' },
};
createInertiaApp({ page: { component: 'Preview', props: dashboardPreview ? dashboardProps : auditPreview ? auditProps : catalogPreview ? catalogProps : requestsPreview ? requestProps : props, url: location.pathname + location.search, version: 'preview', clearHistory: false, encryptHistory: false }, resolve: () => dashboardPreview ? DashboardIndex : auditPreview ? LoginAudit : catalogPreview ? CentralSupplyCatalog : requestsPreview ? MyRequests : CoordinatorInventory, setup: ({ el, App, props }) => createRoot(el).render(<App {...props} />) });
