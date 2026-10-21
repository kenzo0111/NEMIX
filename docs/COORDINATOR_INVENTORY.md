# Delivery Unit coordinator inventory

Supply Coordinators use the same dashboard components as inventory staff, with metrics, movements, request counts, and links scoped to their account. A user with both Supply Coordinator and Property Staff roles uses the coordinator workspace. System Administrators retain the central workspace.

Submitting or approving a request does not create Delivery Unit stock. Releasing the approved request deducts Supply Office inventory and credits the requesting coordinator with the approved quantities and issuance costs in one database transaction. A failed credit rolls back the release. Each request line can create only one receipt.

Coordinators open **Unit Inventory & Stock Cards** to see their stock, record issues to offices or end users, and download an automatically generated Stock Card for each item. Date filters carry the opening balance forward and exclude later movements. Unit issues affect only the coordinator's inventory. Stock Cards use the existing Appendix 58 PDF template. Other coordinators' records and central inventory/report routes are inaccessible, even if a coordinator is accidentally granted a central route permission.

RFID remains available as an optional receiving and tagging tool for inventory staff. Manual receiving remains available. Untagged items are described as managed without tags rather than requiring assignment. Authentication branding describes consumable inventory, supply requests, and automated reports.

## Apply the change

Run `php artisan migrate` in the application's configured runtime before serving the updated application. The migration creates the coordinator inventory ledger, grants the three coordinator route permissions, and imports existing released requests for users currently assigned the Supply Coordinator role. Historical receipts keep their release dates and RIS references. Historical unit consumption was not recorded by the previous system; verify imported balances and record any past consumption before relying on opening stock.

Then run `npm run build` if production assets have not already been built. No existing central inventory records are moved or relabeled.

## Verification

`php artisan test --filter=CoordinatorInventoryTest` covers release-only credit, partial approval quantities, duplicate receipt prevention, coordinator isolation, local stock deductions, Stock Card date balances, PDF generation, and rollback of failed transfers. The existing dashboard and supply request suites cover central workflows. Frontend checks use `npx tsc --noEmit`, `npm run build`, and `node --test tests/Frontend/*.test.mjs`.
