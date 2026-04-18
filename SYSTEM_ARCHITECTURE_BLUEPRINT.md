# NEMIX System Architecture Blueprint

## 1) Architecture Style

This project follows a modular monolith architecture using Laravel + Inertia + React, with business capabilities isolated under `Modules/` using nwidart/laravel-modules.

- Presentation layer: Web routes + Inertia pages
- Application layer: Module controllers
- Domain/data layer: Eloquent models per module
- Persistence layer: Shared MySQL database with module-owned tables

Enabled modules:

- UserManagement
- Inventory
- Suppliers
- AuditLogs

## 2) High-Level Blueprint (Component View)

```mermaid
flowchart LR
		U[End User Browser] --> R[Laravel Web Routes]
		R --> M1[UserManagement Module]
		R --> M2[Suppliers Module]
		R --> M3[Inventory Module]
		R --> M4[AuditLogs Module]

		M1 --> DB[(MySQL Database)]
		M2 --> DB
		M3 --> DB
		M4 --> DB

		M3 -.reads supplier master data.-> M2
		R -.dashboard analytics.-> M3
		R -.dashboard audit feed.-> M4
		M4 -.reads user identity/roles.-> M1
```

## 3) Runtime Routing and Module Registration

- Global routes are mounted from `routes/web.php`.
- Each module registers routes via its own RouteServiceProvider.
- Inventory, Suppliers, AuditLogs, and UserManagement web routes are mounted into the web middleware group.
- Active modules are controlled by `modules_statuses.json` and loaded into front-end build inputs by `vite-module-loader.js`.

## 4) Module Responsibilities and Data Ownership

### UserManagement

Purpose:
- User CRUD endpoints scaffold
- Identity/roles source for audit attribution

Owned entities:
- Users/roles are primarily from core app auth + permission integration

### Suppliers

Purpose:
- Supplier master data lifecycle

Owned entities:
- Supplier (name, tin, address, reg_number, category, status)

Used by:
- Inventory receiving for supplier association

### Inventory

Purpose:
- Item catalog and stock state management
- Receiving and issuance transactions
- Category management
- Compliance and dashboard metrics support

Owned entities:
- Item
- Category
- Receiving
- Issuance

Cross-module dependencies:
- Receiving belongs to Supplier (Suppliers module)
- Issuance issuer belongs to User (core app)

### AuditLogs

Purpose:
- Login trail tracking
- Transaction trail visualization for operational traceability

Owned entities:
- LoginTrail
- TransactionTrail

Cross-module dependencies:
- TransactionTrail and LoginTrail resolve related user identity and roles

## 5) End-to-End Process Blueprints

### A) Receiving and Stock Impact (Inventory + Suppliers)

```mermaid
sequenceDiagram
		participant User as Inventory Staff
		participant Web as /inventory/receiving
		participant Inv as Inventory Controller
		participant Rec as Receiving Model
		participant Item as Item Model
		participant Sup as Supplier Model
		participant DB as Database

		User->>Web: Submit receiving transaction
		Web->>Inv: storeReceiving(request)
		Inv->>Rec: Create receiving record
		Rec->>DB: Insert receivings
		Inv->>Item: Update stock/amount status
		Item->>DB: Update items
		Inv->>Sup: Validate supplier relation
		Sup->>DB: Read suppliers
		Inv-->>User: Return updated receiving view
```

### B) Issuance and Compliance Reporting (Inventory + Dashboard)

```mermaid
flowchart TD
		A[Issuance created or updated] --> B[Inventory Issuance table]
		B --> C[Compliance Reports view reads issuance + item relations]
		B --> D[Dashboard aggregates monthly and yearly RIS issued]
		E[Item stock updates] --> D
```

### C) Audit Monitoring Flow (AuditLogs + UserManagement)

```mermaid
flowchart LR
		A[Authenticated user activity] --> B[Audit trail rows available]
		B --> C[AuditLogs controllers query latest trails]
		C --> D[Attach user and role context]
		D --> E[Inertia ManageLoginTrails / ManageTransaction pages]
		B --> F[Dashboard recent audit feed]
```

## 6) Integration Contracts Between Modules

- Inventory -> Suppliers:
	- Contract: `receivings.supplier_id` references Supplier
	- Benefit: Stable foreign key style association

- AuditLogs -> UserManagement/Core Auth:
	- Contract: `user_id` relation for attribution + role display
	- Benefit: Traceability of actions and login events

- Dashboard -> Inventory + AuditLogs:
	- Contract: Read-only analytics aggregation for KPIs and activity stream

## 7) Security and Access Pattern

- Module web endpoints are protected by `auth` and `verified` middleware for operational views.
- API routes are protected by `auth:sanctum`.
- Dashboard and compliance pages aggregate data only if module classes exist, reducing runtime hard failures when modules are toggled.

## 8) Recommended Future Hardening (Optional)

- Introduce service layer per module (Application services) to decouple controllers from direct model orchestration.
- Add domain events for receiving/issuance and consume them in AuditLogs for guaranteed activity capture.
- Introduce module-level API contracts (DTO/Resource classes) for clearer boundaries.

## 9) Quick Reference: Primary Process Ownership

- Supplier lifecycle: Suppliers module
- Inventory stock lifecycle: Inventory module
- Login and transaction traceability: AuditLogs module
- Identity and role context: UserManagement/core auth

