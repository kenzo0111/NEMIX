# Supply Coordinator department assignment

One Supply Coordinator role can be used by accounts in different departments. The role grants permissions; the account's administrator-managed department identifies its Delivery Unit. Requests and unit inventory remain owned by the submitting account, including when two coordinators share a department.

## Setup

1. Run `php artisan migrate` in the application's configured runtime, then build the frontend with `npm run build`. The local configuration uses the Docker PostgreSQL service; start Docker and the application services, then run `docker compose exec app php artisan migrate`.
2. In System Settings, add or update the department/office head in the Signatory Directory. Enter the person's name and designation and keep the record active.
3. In Access Control → Staff Accounts, create or edit the coordinator. Assign the Supply Coordinator role, Department / Delivery Unit, and Department / Office Head. The head's designation comes from the selected directory record.

### College dean defaults

Run `php artisan db:seed --class=CollegeDeanSeeder --force` after migrating to load the ten college/academic-unit head mappings verified against the UCN College Officials directory on October 22, 2026. The seeder reuses matching signatories and preserves existing directory details and mappings when rerun. It does not change existing staff assignments or request snapshots.

Selecting a mapped college in Staff Accounts automatically selects its dean and displays the dean's designation. An existing account with a department but no head also receives that department's default when opened for editing. Save the account to apply the assignment. Administrators may explicitly select a different head for a specific account. Unknown offices require a manual head selection, and inactive directory records are excluded from automatic defaults. Changing to an unmapped office clears the previous college's dean.

College head names use uppercase without Dr./Engr. prefixes, and their designation is `DEAN`. The formatting migration updates existing mapped directory records in place, so staff assignments stay linked to the same person. Previously saved request signatories retain their original details.

Existing accounts are deliberately left unassigned by the migration. An administrator must verify their assignments; the system does not infer a department from old requests. New Supply Coordinator and Authorized Personnel requests require a complete assignment with an active head and a designation.

## Request behavior

The request form automatically fills and locks the assigned department, office head as Requested by, and the head's designation. The server takes these values from the account assignment rather than trusting form input. Other roles with custom request permissions retain the existing manual form behavior.

The logged-in coordinator remains the `requested_by` account and is displayed as Submitted by. The office head's name and designation are saved in the request's existing recipient fields, which already populate the RIS Requested by and Received by sections and the resulting issuance. The supply approving officer remains configured separately in System Settings.

Each request preserves its department, head name, and designation when edited, even after an administrator transfers the coordinator or changes the head. Existing requests retain their original recorded information. Staff Accounts displays and searches department and head assignments; the approval queue and request details show the submitting coordinator separately from the office-head signatory.

For a defense demonstration: create two coordinator accounts with the same role and different department/head assignments. Show both in Staff Accounts, sign in as each coordinator, and open a new request. The department and office-head fields differ automatically and cannot be changed by the coordinator.

## Verification

`CoordinatorDepartmentAssignmentTest` covers staff assignment, invitation validation, request prefill, server enforcement, incomplete/inactive assignments, historical details after transfers, unauthorized assignment changes, and isolation between departments. Existing supply request, alert, invitation, and Authorized Personnel suites verify the surrounding workflow. The frontend request checks exercise locked fields, missing-assignment guidance, and preserved historical details.
