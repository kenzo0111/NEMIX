# Inventory policy settings

The Inventory Rules section of System Settings controls these behaviors:

- **Low-stock threshold:** positive stock at or below this value is Low Stock, unless it is critical.
- **Critical-stock threshold:** positive stock at or below this value is Critical Stock. Zero or negative stock is Out of Stock. The critical threshold cannot exceed the low-stock threshold. Saving either threshold immediately reclassifies existing items.
- **Stock safeguard:** when enabled, approvals and issuances cannot exceed stock minus quantities reserved for other approved requests. When disabled, approvals and issuances can exceed available stock. FIFO allocations record any shortfall as a batch with zero received quantity and negative remaining quantity. This preserves the balance when receipts arrive and when an issuance is edited or voided. Shortfalls use the item's reference unit cost; inventory asset values are floored at zero.
- **Recognized units:** inventory item forms use the configured list, and the backend rejects other units. Matching ignores capitalization and surrounding spaces. Existing items can keep a retired unit, but newly created items cannot use it. Blank, duplicate, oversized, or empty unit lists are rejected.

Low-stock email notifications follow the existing notification enablement and recipient settings. Crossing the critical threshold sends a critical warning, including when stock was already low. Repeated reductions within the same severity band do not resend a warning until stock first recovers above that band's threshold. A single drop through both thresholds sends one critical warning.

The `2026_10_16_000001_add_critical_stock_status` migration adds the Critical Stock status and reclassifies existing stock. Deploy it before serving the updated inventory code.

Regression coverage: `InventoryPolicySettingsTest`, `LowStockAlertTest`, and the existing inventory workflow and system settings tests. Tests use an isolated database; do not run `migrate:fresh` against production.
