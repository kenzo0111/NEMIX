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

## 3. AuditLogs
- [x] **Login Trails (`AuditLogs/ManageLoginTrails.tsx`)**
  - [x] Track and display user login/logout history and IP addresses.
- [x] **Transaction Logs (`AuditLogs/ManageTransaction.tsx`)**
  - [x] Record and display vital system data modifications (who changed what, and when).

## 4. Auth
- [x] **Authentication Flow**
  - [x] Finalize login, registration, and password reset interfaces.

## 5. Compliance
- [x] **Analytics (`Compliance/ManageAnalytics.tsx`)**
  - [x] Build data visualization charts for inventory movement and expenses.
- [x] **Reports (`Compliance/ManageReports.tsx`)**
  - [x] Create customizable date-range reporting and export features (CSV/PDF).

## 6. Inventory
- [x] **Categories (`Inventory/Categories.tsx`)**
  - [x] Create category and sub-category management.
- [x] **All Items (`Inventory/AllItems.tsx`)**
  - [x] Implement complete tracking of inventory items.
  - [x] Set up item variants, SKUs, and stock-level monitoring.
- [x] **Receiving (`Inventory/Receiving.tsx`)**
  - [x] Build the workflow to acknowledge and record incoming stock.
- [x] **Issuance (`Inventory/Issuance.tsx`)**
  - [x] Implement stock issuance and dispatching workflow.

## 7. Profile
- [x] **User Profile (`Profile/`)**
  - [x] Implement user profile updates, settings, and security options.

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

