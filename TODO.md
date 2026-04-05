# NEMIX Project Todo List

## 1. Dashboard & Common Pages
- [x] **Dashboard (`Dashboard.tsx`)**
  - [x] Build key statistics and metrics summary.
  - [x] Implement recent activity feeds.
- [ ] **Welcome Page (`Welcome.tsx`)**
  - [ ] Finalize landing/login entry page layout.

## 2. User Management & Access Control
- [ ] **User Management (`UserManagement/Users.tsx`)**
  - [ ] Implement CRUD operations for Users (Create, Read, Update, Delete).
  - [ ] Handle user roles and status toggling (active/inactive).
- [ ] **Profile (`Profile/`)**
  - [ ] Implement user profile updates.
  - [ ] Add password change and account security features.
- [ ] **Access Control (`AccessControl/index.tsx`)**
  - [ ] Implement Role-Based Access Control (RBAC) management.
  - [ ] Map permissions to specific roles.

## 3. Inventory Management
- [x] **Categories (`Inventory/Categories.tsx`)**
  - [x] Create category and sub-category management.
- [x] **All Items (`Inventory/AllItems.tsx`)**
  - [x] Implement complete tracking of inventory items.
  - [x] Set up item variants, SKUs, and stock-level monitoring.
- [ ] **Receiving (`Inventory/Receiving.tsx`)**
  - [ ] Build the workflow to acknowledge and record incoming stock.
- [ ] **Issuance (`Inventory/Issuance.tsx`)**
  - [ ] Implement stock issuance and dispatching workflow.

## 4. Acquisition / Procurement
- [ ] **Procurement Panel (`Acquisition/ProcurementPanel.tsx`)**
  - [ ] Handle purchase requests and procurement bidding/approvals.
- [ ] **Inbound Deliveries (`Acquisition/InboundDeliveries.tsx`)**
  - [ ] Set up tracking for supplier shipments in transit.
  - [ ] Link deliveries to the Inventory Receiving feature.

## 5. Suppliers Management
- [x] **Manage Supplier (`Suppliers/ManageSupplier.tsx`)**
  - [x] Implement CRUD for Supplier records (names, contact info, ratings).
  - [x] View supplier histories and associated Purchase Orders.

## 6. Audit & System Logs
- [ ] **Login Trails (`AuditLogs/ManageLoginTrails.tsx`)**
  - [ ] Track and display user login/logout history and IP addresses.
- [ ] **Transaction Logs (`AuditLogs/ManageTransaction.tsx`)**
  - [ ] Record and display vital system data modifications (who changed what, and when).

## 7. Compliance & Analytics
- [ ] **Analytics (`Compliance/ManageAnalytics.tsx`)**
  - [ ] Build data visualization charts for inventory movement and expenses.
- [ ] **Reports (`Compliance/ManageReports.tsx`)**
  - [ ] Create customizable date-range reporting and export features (CSV/PDF).

## 8. Official Forms (from `resources/Official Forms/`)
*Ensure the generation, data-binding, and print-layout works correctly for all standardized documents:*
- [x] **Purchase Order (`PurchaseOrder.tsx`)**
- [x] **Inspection and Acceptance Report (`InspectionAcceptanceReport.tsx`)**
- [x] **Requisition Issue Slip (`RequisitionIssueSlip.tsx`)**
- [x] **Inventory Custodian Slip (`InventoryCustodianSlip.tsx`)**
- [x] **Property Acknowledge Report (`PropertyAcknowledgeReport.tsx`)**
- [x] **Stock Card Report (`Stock Card Report.tsx`)**
- [x] **RSMI (Report of Supplies and Materials Issued) (`RSMI Report.tsx`)**
- [x] **RPCI (Report on the Physical Count of Inventories) (`RPCI Report.tsx`)**

