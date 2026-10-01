# Supply request and issuance workflow

## Setup

Run the normal application migrations. They create `supply_requests` and `supply_request_items`, plus the `Supply Coordinator` and `Property Custodian` roles with their route permissions. Assign these roles to the appropriate staff in **Access Control → Staff Accounts**. Existing `Property Staff` users do not automatically become approvers.

## Daily use

1. A Supply Coordinator opens **Inventory → My Requests**, enters the office, purpose, items, and quantities, then submits. Only their own requests appear on that page. They can edit or cancel a pending request.
2. A Property Custodian opens **Inventory → Issuance** and reviews the **Awaiting approval** queue. The custodian can approve full or reduced quantities, or reject with a reason. Approval records the reviewer and time, assigns a RIS reference, and reserves approved quantities. On-hand stock does not change.
3. An approved request appears under **Approved — Awaiting Release** on the same page. The coordinator can preview and print the RIS from **My Requests**. The printout shows the approval while leaving issue and receipt entries blank for the physical handover.
4. At pickup, the Property Custodian checks the signed RIS and confirms that all approved items were handed over. This creates one linked issuance, allocates FIFO batches, deducts stock, and records the release. A repeat release is refused.
5. If quantities change before pickup, the custodian revises the approval and the coordinator prints the updated RIS. A cancelled request releases its reservation.

The existing direct **Record Issuance** action remains available to staff with its existing create permission. It honors outstanding supply request reservations. Linked issuances cannot be edited or voided independently; a dedicated reversal workflow would be needed for a post-release correction.

## State and stock rules

`Pending → Approved → Issued`, `Pending → Rejected`, and `Pending/Approved → Cancelled` are the allowed paths. Approval reserves inventory for availability checks. Only release changes physical stock and creates an `issuances` record, so dashboards and compliance reports do not count approved but uncollected requests as distributions. The release action requires an explicit signed RIS confirmation and rechecks stock inside the transaction.
