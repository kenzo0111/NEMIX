import { InventoryItem, InventoryStatus } from '../types';

export const buildSupplierAcronym = (supplierName: string): string => {
    if (!supplierName) return '';
    const words = supplierName.trim().split(/\s+/).slice(0, 3);
    const letters = words.map((word) => word.charAt(0).toUpperCase());
    while (letters.length < 3) letters.push('X');
    return letters.join('');
};

export const generateSkuPreview = (
    items: InventoryItem[] = [],
    supplierName: string,
    supplierId: number | string
): string => {
    const acronym = buildSupplierAcronym(supplierName);
    if (!acronym) return '';

    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const supplierItems = items.filter((item) => String(item.supplier_id) === String(supplierId));
    const itemIndex = String(supplierItems.length + 1).padStart(3, '0');
    const sequence = '0001';

    return `${acronym}-${year}-${month}-${itemIndex}-${sequence}`;
};

export const computeStatusFromStock = (
    stock: string | number | null | undefined,
    lowStockThreshold: number = 10
): InventoryStatus => {
    const quantity = Number(stock ?? 0);
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= lowStockThreshold) return 'Low Stock';
    return 'Available';
};

export const formatCurrency = (amount: number | string | null | undefined): string => {
    const num = Number(amount ?? 0);
    return '₱' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatNumber = (val: number | string | null | undefined): string => {
    const num = Number(val ?? 0);
    return num.toLocaleString('en-US');
};
