# NEMIX Project Todo List

> **Project Target Deadline:** Before May 1, 2026
> **Timeline (Starting April 8, 2026):**
> - **April 8 - April 14:** Finish AccessControl, Auth, and Profile sections.
> - **April 15 - April 19:** Complete Inventory (Receiving & Issuance).
> - **April 20 - April 25:** Build AuditLogs and Compliance features.
> - **April 26 - April 30:** Final testing, bug fixing, and polish.

## 1. AccessControl
- [x] **Role Management**
  - [x] Implement Role-Based Access Control (RBAC).
  - [x] Map permissions to specific roles.

## 2. Acquisition
- [x] **Procurement Panel (`Acquisition/ProcurementPanel.tsx`)**
  - [x] Handle purchase requests and procurement bidding/approvals.
- [x] **Inbound Deliveries (`Acquisition/InboundDeliveries.tsx`)**
  - [x] Set up tracking for supplier shipments in transit.
  - [x] Link deliveries to the Inventory Receiving feature.

## 3. AuditLogs
- [ ] **Login Trails (`AuditLogs/ManageLoginTrails.tsx`)**
  - [ ] Track and display user login/logout history and IP addresses.
- [ ] **Transaction Logs (`AuditLogs/ManageTransaction.tsx`)**
  - [ ] Record and display vital system data modifications (who changed what, and when).

## 4. Auth
- [ ] **Authentication Flow**
  - [ ] Finalize login, registration, and password reset interfaces.

## 5. Compliance
- [ ] **Analytics (`Compliance/ManageAnalytics.tsx`)**
  - [ ] Build data visualization charts for inventory movement and expenses.
- [ ] **Reports (`Compliance/ManageReports.tsx`)**
  - [ ] Create customizable date-range reporting and export features (CSV/PDF).

## 6. Inventory
- [x] **Categories (`Inventory/Categories.tsx`)**
  - [x] Create category and sub-category management.
- [x] **All Items (`Inventory/AllItems.tsx`)**
  - [x] Implement complete tracking of inventory items.
  - [x] Set up item variants, SKUs, and stock-level monitoring.
- [ ] **Receiving (`Inventory/Receiving.tsx`)**
  - [ ] Build the workflow to acknowledge and record incoming stock.
- [ ] **Issuance (`Inventory/Issuance.tsx`)**
  - [ ] Implement stock issuance and dispatching workflow.

## 7. Profile
- [ ] **User Profile (`Profile/`)**
  - [ ] Implement user profile updates, settings, and security options.

## 8. Suppliers
- [x] **Manage Supplier (`Suppliers/ManageSupplier.tsx`)**
  - [x] Implement CRUD for Supplier records (names, contact info, ratings).
  - [x] View supplier histories and associated Purchase Orders.

## 9. Dashboard & Official Forms
- [x] **Dashboard (`Dashboard.tsx`)**
  - [x] Build key statistics and metrics summary.
  - [x] Implement recent activity feeds.
- [x] **Official Forms (`resources/Official Forms/`)**
  - [x] Ensure the generation, data-binding, and print-layout works correctly for all standardized documents.

