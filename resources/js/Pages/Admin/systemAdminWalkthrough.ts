export const SYSTEM_ADMIN_TOUR_START_EVENT = 'nemix:system-admin-tour:start';

export const SYSTEM_ADMIN_TOUR_CHAPTERS = [
    'Start here',
    'Accounts & permissions',
    'System settings',
    'Security & continuity',
    'Supply operations',
    'Audit & daily routine',
] as const;

type Chapter = typeof SYSTEM_ADMIN_TOUR_CHAPTERS[number];

export type SystemAdminTourStep = {
    id: string;
    chapter: Chapter;
    routeName: string;
    params?: Record<string, string>;
    selector: string;
    title: string;
    description: string;
    instructions: string[];
    outcome: string;
    tip?: string;
};

export const SYSTEM_ADMIN_TOUR_STEPS: SystemAdminTourStep[] = [
    {
        id: 'welcome', chapter: 'Start here', routeName: 'dashboard',
        selector: '[data-tour="system-admin-dashboard-header"]',
        title: 'Your System Admin workspace',
        description: 'You maintain accounts, access, system policies, and service availability, while overseeing organization-wide supply records.',
        instructions: [
            'Follow Next and Back to visit each screen, or use Jump to a topic to review a specific task.',
            'Read the instructions and expected result before performing a task. Exit the guide when you are ready to use the highlighted screen.',
            'Use your own administrator account and review the operating mode before saving real transactions.',
        ],
        outcome: 'You know how to navigate the guide and where your administration responsibilities begin.',
        tip: 'The walkthrough only opens screens. Account changes, emails, exports, and transactions require your action after you exit.',
    },
    {
        id: 'health', chapter: 'Start here', routeName: 'dashboard',
        selector: '[data-tour="system-admin-dashboard-status"]',
        title: 'Check system health before work begins',
        description: 'These cards summarize users, the database connection, email configuration, and the current operating mode.',
        instructions: [
            'Confirm that Database shows Connected and that the operating mode matches the planned activity.',
            'Compare total and active users when reviewing account access.',
            'Check email delivery separately in Settings → Notifications. Configured reports a configuration check; it does not confirm that a message reached an inbox.',
        ],
        outcome: 'You can distinguish a connection problem, an account issue, and an email delivery issue.',
        tip: 'Unavailable means a check could not be completed. Record the message and time, then investigate before relying on that service.',
    },
    {
        id: 'supply-overview', chapter: 'Start here', routeName: 'dashboard',
        selector: '[data-tour="system-admin-supply-overview"]',
        title: 'Read the organization-wide supply picture',
        description: 'The supply overview combines central stock, requisition progress, and recent receiving and issuance across the system.',
        instructions: [
            'Review low or critical stock and out-of-stock counts to identify replenishment needs.',
            'Check pending requests and approved requests awaiting release for work that needs follow-up.',
            'Use View inventory or Open requests to inspect the underlying record before deciding what action is needed.',
        ],
        outcome: 'You can connect a summary count to the detailed records that explain it.',
        tip: 'An approved request and a released request represent different stages. Confirm the recorded release before treating supplies as delivered.',
    },
    {
        id: 'shortcuts', chapter: 'Start here', routeName: 'dashboard',
        selector: '[data-tour="system-admin-shortcuts"]',
        title: 'Find the right administration screen',
        description: 'Administration shortcuts take you directly to account management, roles, settings, diagnostics, and audit records.',
        instructions: [
            'Use User Management for an individual staff account and Roles & Permissions for access shared by a role.',
            'Use System Settings for policies; Diagnostics, Security & Backup opens the Operations category.',
            'Use Login Audit for authentication activity and Activity Audit for changes to system and supply records.',
        ],
        outcome: 'You can choose the appropriate screen without searching through unrelated modules.',
    },
    {
        id: 'staff-directory', chapter: 'Accounts & permissions', routeName: 'access-control.staffs',
        selector: '[data-tour="system-admin-staff-directory"]',
        title: 'Review an account before changing it',
        description: 'The staff directory separates identity, assigned role, Delivery Unit, invitation verification, and account status.',
        instructions: [
            'Search the staff member by name or email; use the status filter when reviewing active or disabled accounts.',
            'Match the email, role, department, and office head to the staff member’s approved assignment.',
            'Check both Verified / Pending Invite and Active / Disabled. These indicators describe different account conditions.',
        ],
        outcome: 'You have identified the correct account and the specific access or invitation issue.',
        tip: 'Clear search and status filters if an expected account is missing before creating another record.',
    },
    {
        id: 'invite-staff', chapter: 'Accounts & permissions', routeName: 'access-control.staffs',
        selector: '[data-tour="system-admin-staff-add"]',
        title: 'Register staff and follow up on invitations',
        description: 'Add Staff creates the account and sends a registration invitation to the supplied email address.',
        instructions: [
            'After exiting the guide, select Add Staff and enter the person’s official name and correct email address.',
            'Choose the approved System Role and complete the Delivery Unit assignment where required; review the details before submitting.',
            'Ask the staff member to complete the invitation, then check the verification indicator. Use Resend Invite on the eligible account if another invitation is needed.',
        ],
        outcome: 'The staff record exists with the intended role, and invitation completion can be confirmed in the directory.',
        tip: 'A mail error can occur after the account is created. Check the directory, fix delivery, and resend the invitation instead of creating a duplicate.',
    },
    {
        id: 'delivery-unit', chapter: 'Accounts & permissions', routeName: 'access-control.staffs',
        selector: '[data-tour="system-admin-staff-directory"]',
        title: 'Assign the correct Delivery Unit and office head',
        description: 'Delivery Unit details support requester accountability and can prefill the requesting office on supply requests.',
        instructions: [
            'Select Edit on the intended staff account and verify Department / Delivery Unit.',
            'For a Supply Coordinator, select the required Delivery Unit and an active Department / Office Head with a designation.',
            'If the head is missing or inactive, maintain the signatory directory in System Settings → Signatories, then return to the staff record.',
        ],
        outcome: 'The staff account shows the intended unit and office head for its supply workflow.',
        tip: 'Use consistent department names. Check the head’s designation and active status before a coordinator submits new requests.',
    },
    {
        id: 'account-access', chapter: 'Accounts & permissions', routeName: 'access-control.staffs',
        selector: '[data-tour="system-admin-staff-directory"]',
        title: 'Update access and disable accounts carefully',
        description: 'Edit changes staff details and role; Enable and Disable control whether an account can access the system.',
        instructions: [
            'Confirm the approved change and the staff member’s identity before editing the role or account status.',
            'Use Edit for assignment changes. For Enable or Disable, read the confirmation and verify the selected person before confirming.',
            'Recheck the directory and review the resulting audit record. Ask the affected user to refresh or sign in again to check updated access.',
        ],
        outcome: 'The account’s role and status match the approved access decision, with an audit trail for the change.',
        tip: 'You cannot disable your own account. Keep an authorized administrator available when planning access changes.',
    },
    {
        id: 'role-directory', chapter: 'Accounts & permissions', routeName: 'access-control.role-permission',
        selector: '[data-tour="system-admin-role-directory"]',
        title: 'Understand roles before creating one',
        description: 'A role groups access rights for staff who perform the same work. Role changes can affect every account assigned to that role.',
        instructions: [
            'Search Configured Roles and review the existing role names, access counts, and system or custom role indicators.',
            'Use an existing appropriate role where possible. Create Role adds a named role; review and configure its permissions before assigning it to staff.',
            'Define the job responsibilities first so the new role receives only the access needed for that work.',
        ],
        outcome: 'You can choose or prepare an appropriate role without duplicating an existing access pattern.',
    },
    {
        id: 'role-permissions', chapter: 'Accounts & permissions', routeName: 'access-control.role-permission',
        selector: '[data-tour="system-admin-role-directory"]',
        title: 'Grant and review permissions by module',
        description: 'Edit a role to inspect module permissions and select the actions its staff may perform.',
        instructions: [
            'Select Edit on the intended role, then choose each relevant module in the permission editor.',
            'Review individual actions such as viewing, creating, updating, approving, releasing, and exporting; select only the required permissions.',
            'Save the reviewed changes and verify the affected user’s available pages and actions after a refresh or new sign-in.',
        ],
        outcome: 'The role’s available actions align with its approved responsibilities.',
        tip: 'Broad selection can grant more than viewing access. Read the action labels before using a module-wide selection.',
    },
    {
        id: 'protected-roles', chapter: 'Accounts & permissions', routeName: 'access-control.role-permission',
        selector: '[data-tour="system-admin-role-policy"]',
        title: 'Respect protected roles and session updates',
        description: 'System roles and roles still assigned to staff have deletion safeguards. Updated capabilities are refreshed through the authorization and session policy.',
        instructions: [
            'Check the role’s system indicator and assigned staff before planning any deletion.',
            'For an unused custom role, confirm that its access is no longer needed. Reassign staff appropriately before attempting to remove their old role.',
            'If a user still sees earlier access, refresh the page or have the user sign in again, then check the role assignment and permission changes.',
        ],
        outcome: 'You understand why a role may be protected and how to verify that access updates took effect.',
        tip: 'System roles cannot be deleted. Treat administrator permissions as privileged access when reviewing assignments.',
    },
    {
        id: 'settings-workflow', chapter: 'System settings', routeName: 'system.settings.index', params: { tab: 'institution' },
        selector: '[data-tour="system-admin-settings-save"]',
        title: 'Review, save, and reset system settings',
        description: 'The seven settings categories share a primary Save Settings action. Unsaved changes are identified in the page controls.',
        instructions: [
            'Choose a category and review the current values before editing. Changes across categories are included in the settings submission.',
            'Use Save Settings after reviewing the changes. Correct field errors if the system rejects the submission.',
            'Use Reset to discard unsaved edits. Confirm the success message and saved values before leaving the screen.',
        ],
        outcome: 'You can distinguish saved policies from pending edits and recover from a validation error.',
        tip: 'Device registration, device configuration, signatory directory actions, and Send Test have their own actions. Review each action’s result separately.',
    },
    {
        id: 'institution', chapter: 'System settings', routeName: 'system.settings.index', params: { tab: 'institution' },
        selector: '[data-tour="system-admin-settings-institution"]',
        title: 'Maintain institution details and branding',
        description: 'Institution & Branding supplies the organization details used in the system and official forms.',
        instructions: [
            'Review Institution Name, Default Fund Cluster, Agency Acronym, Custodial Supply Office, and the address against the official details.',
            'Enter approved corrections consistently and use Save Settings to apply them.',
            'Preview an official form or report after the change and confirm that the institution details appear correctly.',
        ],
        outcome: 'The system and newly generated forms use the approved institution identity.',
    },
    {
        id: 'signatories', chapter: 'System settings', routeName: 'system.settings.index', params: { tab: 'signatories' },
        selector: '[data-tour="system-admin-settings-signatories"]',
        title: 'Maintain signatories and office heads',
        description: 'Consumable Signatories connects approving, issuing, accounting, and office-head identities to official supply forms.',
        instructions: [
            'Review the signatory directory and register the correct name, designation, and office details for an approved officer when needed.',
            'Select the appropriate officers for the form fields and save changes to the signatory assignments.',
            'Preview a new RIS or report and check the names and designations. Review linked staff assignments when an office head changes.',
        ],
        outcome: 'New supply documents use the intended officers, and requester office-head assignments remain usable.',
        tip: 'Directory actions and selected form signatories are separate. Registering a person does not automatically assign them to every form.',
    },
    {
        id: 'stock-rules', chapter: 'System settings', routeName: 'system.settings.index', params: { tab: 'inventory' },
        selector: '[data-tour="system-admin-settings-inventory"]',
        title: 'Set stock thresholds and issuance rules',
        description: 'Stock & Reorder Rules controls global stock indicators, the negative-stock policy, and recognized units of issue.',
        instructions: [
            'Set the low-stock and critical-stock thresholds using the approved replenishment policy; the critical threshold must not exceed the low threshold.',
            'Review Prevent issuance resulting in negative stock. When enabled, approvals and issuances cannot exceed unreserved stock.',
            'Review units of issue for consistency with inventory and receiving records, then save and inspect the resulting stock indicators.',
        ],
        outcome: 'Stock alerts and issuance safeguards reflect the approved inventory policy.',
        tip: 'Disabling the negative-stock safeguard permits shortages and negative balances. Understand that effect before changing the policy.',
    },
    {
        id: 'numbering', chapter: 'System settings', routeName: 'system.settings.index', params: { tab: 'numbering' },
        selector: '[data-tour="system-admin-settings-numbering"]',
        title: 'Understand automatic document sequences',
        description: 'Document Sequences displays the system-managed formats and previews for official supply document numbers.',
        instructions: [
            'Review the displayed format and reset rule for each document type.',
            'Use the normal document workflow to reserve a number; a displayed preview is not a reserved document.',
            'When investigating an unexpected number, compare the document date, type, and existing registry records.',
        ],
        outcome: 'You can explain document numbering without treating a preview as an issued record.',
        tip: 'These sequences are generated by the system. This screen does not provide a manual counter reset.',
    },
    {
        id: 'rfid-policy', chapter: 'System settings', routeName: 'system.settings.index', params: { tab: 'rfid' },
        selector: '[data-tour="system-admin-settings-rfid"]',
        title: 'Understand the available RFID controls',
        description: 'RFID & Bin Storage displays warehouse policies and the operational configuration of registered handheld readers.',
        instructions: [
            'Review the displayed warehouse settings. Warehouse mode and browser debounce are unavailable in this version, as noted on the screen.',
            'Use the enabled handheld scan mode and timeout controls below for the selected device instead.',
            'Before scanning, verify the selected device, its applied configuration, and the task the stockroom staff will perform.',
        ],
        outcome: 'You know which RFID controls are available and where to configure the handheld reader.',
        tip: 'RFID scan behavior and the system’s Live / Maintenance / Training operating mode are separate controls.',
    },
    {
        id: 'rfid-devices', chapter: 'System settings', routeName: 'system.settings.index', params: { tab: 'rfid' },
        selector: '[data-tour="system-admin-rfid-devices"]',
        title: 'Register devices and verify applied configuration',
        description: 'Registered handheld devices have their own identity, credentials, connection status, Wi-Fi settings, and configuration versions.',
        instructions: [
            'Register an approved reader with the correct device identity and server URL. Copy its one-time device token securely when it is displayed.',
            'Select the device, review connection and reader diagnostics, then save the intended device settings using the device controls.',
            'Compare requested and device-confirmed configuration versions, connected Wi-Fi, and the latest heartbeat to verify that the reader applied the change.',
        ],
        outcome: 'The selected reader is registered and its reported configuration can be checked against the requested settings.',
        tip: 'An online connection does not prove that tags can be read. Check reader diagnostics; token rotation or revocation affects device access.',
    },
    {
        id: 'notifications', chapter: 'System settings', routeName: 'system.settings.index', params: { tab: 'mail' },
        selector: '[data-tour="system-admin-settings-mail"]',
        title: 'Configure stock alerts and test email delivery',
        description: 'Email & Notifications controls low-stock emails and provides a separate delivery test.',
        instructions: [
            'Review the low-stock email toggle and Alert Recipient Email, then save the approved notification settings.',
            'After exiting the guide, enter a test recipient and use Send Test to check the configured email transport.',
            'Check the result message and recipient inbox, including spam. If delivery fails, record the error and have the server mail configuration checked.',
        ],
        outcome: 'The alert recipient is correct and actual email delivery has been checked separately from configuration status.',
        tip: 'Send Test sends a real email. A blank alert recipient uses the administrator fallback described on the screen.',
    },
    {
        id: 'operating-mode', chapter: 'Security & continuity', routeName: 'dashboard',
        selector: '[data-tour="system-admin-operating-mode"]',
        title: 'Review and change the operating mode',
        description: 'The System Mode badge opens the available modes, diagnostics, and the confirmation for a mode change.',
        instructions: [
            'Open System Mode after exiting the guide and review the current environment and mode description.',
            'Choose Live Production, Staging Sandbox, Maintenance Mode, or Training Simulation only for the intended activity; read the warning and enter a useful reason.',
            'Confirm the change, check the refreshed mode badge, and verify the mode-switch event in Activity Audit.',
        ],
        outcome: 'The operating mode matches the planned activity and the change has an identifiable audit record.',
        tip: 'Live Production changes real records. Maintenance restricts non-admin writes; confirm the configured test environment before practicing transactions.',
    },
    {
        id: 'session-security', chapter: 'Security & continuity', routeName: 'system.settings.index', params: { tab: 'operations' },
        selector: '[data-tour="system-admin-session-security"]',
        title: 'Set an appropriate inactivity timeout',
        description: 'Session Security controls the inactivity period used for automatic logout on stockroom terminals and user sessions.',
        instructions: [
            'Review Terminal Inactivity Auto-Logout against the organization’s session policy and shared-terminal usage.',
            'Enter a value within the displayed range of 5 to 480 minutes and save the settings.',
            'Verify the saved value and tell affected staff how to handle work when a session expires.',
        ],
        outcome: 'The inactivity timeout is saved within the allowed range and understood by the affected users.',
        tip: 'Always sign out when leaving a shared terminal. The inactivity timeout supports that practice.',
    },
    {
        id: 'policy-snapshot', chapter: 'Security & continuity', routeName: 'system.settings.index', params: { tab: 'operations' },
        selector: '[data-tour="system-admin-policy-snapshot"]',
        title: 'Export a policy and signatory snapshot',
        description: 'Download Policy Snapshot (JSON) exports the current system policy configuration and official signatories.',
        instructions: [
            'Save approved settings first so the export reflects the intended configuration.',
            'After exiting the guide, use Download Policy Snapshot (JSON) and retain the file in the approved archive location.',
            'Label the archive with its export date and the related policy change so it can support later review.',
        ],
        outcome: 'You have a dated reference copy of system policies and signatories.',
        tip: 'A policy snapshot does not contain the full inventory, account, and transaction database. Database recovery uses the separate database backup process.',
    },
    {
        id: 'telemetry', chapter: 'Security & continuity', routeName: 'system.settings.index', params: { tab: 'operations' },
        selector: '[data-tour="system-admin-telemetry"]',
        title: 'Collect useful diagnostics for an incident',
        description: 'Runtime Environment Information identifies the runtime, framework, database driver, operating mode, and server node.',
        instructions: [
            'Read the displayed environment information and check its cached time when available.',
            'Record the affected screen, action, time, error message, and server node when reporting a problem.',
            'Compare the dashboard’s database, failed-job, and storage checks to narrow down the affected service.',
        ],
        outcome: 'A technical support report includes enough context to investigate the incident.',
        tip: 'Do not include passwords, device tokens, or other secrets in screenshots or incident notes.',
    },
    {
        id: 'database-backup', chapter: 'Security & continuity', routeName: 'dashboard',
        selector: '[data-tour="system-admin-backup-status"]',
        title: 'Verify database backup readiness',
        description: 'Backup status reports the latest database backup. A scheduled backup must actually run before it can support recovery.',
        instructions: [
            'Read the latest backup timestamp. Follow up if no backup has run or the timestamp is older than the expected schedule.',
            'Confirm that the server scheduler runs the daily 02:00 backup in the application’s configured schedule; backups are retained for 30 days.',
            'Arrange a verified backup and a planned recovery procedure with the responsible technical operator. Database restore is an audited command-line operation.',
        ],
        outcome: 'You know whether a recent database backup exists and who is responsible for recovery.',
        tip: 'This dashboard reports backup status. It does not provide a one-click database restore.',
    },
    {
        id: 'inventory', chapter: 'Supply operations', routeName: 'inventory.index',
        selector: '[data-tour="system-admin-inventory-workspace"]',
        title: 'Review central inventory records',
        description: 'All Items is the central directory of supplies and their stock information.',
        instructions: [
            'Search the item and apply supplier or stock-status filters to find the intended record.',
            'Open its details and verify identity, unit of issue, stock information, supplier, and linked records before making corrections.',
            'Use receiving and issuance workflows for actual stock movements and recheck the item balance afterward.',
        ],
        outcome: 'You can trace a stock concern to the correct item and its recorded movements.',
        tip: 'Check filters and existing item identities before adding a record. Duplicate items can split stock accountability.',
    },
    {
        id: 'receiving', chapter: 'Supply operations', routeName: 'inventory.receiving',
        selector: '[data-tour="system-admin-receiving-workspace"]',
        title: 'Verify incoming supplies before recording receipt',
        description: 'Receiving records deliveries and the quantities and costs entering central inventory.',
        instructions: [
            'Match the physical delivery and supporting documents to the intended item and supplier.',
            'Review the receiving date, quantity, unit cost, and available supplier reference fields before saving a receipt.',
            'Check the receiving record, updated stock balance, and audit trail after submission. Verify scanned selections before any RFID batch submission.',
        ],
        outcome: 'The recorded receipt matches the delivery and its inventory effect can be verified.',
        tip: 'Search for an existing receipt before retrying after a delayed response to avoid recording the same delivery twice.',
    },
    {
        id: 'request-tracking', chapter: 'Supply operations', routeName: 'inventory.requests.index',
        selector: '[data-tour="system-admin-requests-workspace"]',
        title: 'Track requisitions and correction requirements',
        description: 'The requests workspace helps you find a RIS and inspect its requester, items, status, and supporting information.',
        instructions: [
            'Search by RIS, recipient, or item and filter by status to locate the request.',
            'Open the details and read the purpose, requested quantities, supporting document, and any verification or review remarks.',
            'Use Inventory → Issuance → Requisition Approval Workspace for document verification, approval, rejection, and release actions.',
        ],
        outcome: 'You know which requisition needs attention and which workflow handles its next action.',
        tip: 'Pending Verification, Under Review, For Correction, Ready for Pickup, and Released describe different stages; read the record’s remarks before following up.',
    },
    {
        id: 'document-verification', chapter: 'Supply operations', routeName: 'inventory.issuance',
        selector: '[data-tour="system-admin-approval-workspace"]',
        title: 'Verify authorization documents before approval',
        description: 'Document-backed Authorized Personnel requests require supporting-document review as part of the approval workflow.',
        instructions: [
            'Locate a request awaiting verification and inspect the attached document and request details.',
            'Check the document type, authority, requester, purpose, and requested supplies for consistency.',
            'Use the appropriate verification or correction action and enter clear remarks explaining any issue the requester must resolve.',
        ],
        outcome: 'The request has a documented verification decision and a clear next step.',
        tip: 'Document verification and stock approval are separate decisions. A verified document does not by itself mean supplies have been released.',
    },
    {
        id: 'approval-release', chapter: 'Supply operations', routeName: 'inventory.issuance',
        selector: '[data-tour="system-admin-approval-workspace"]',
        title: 'Approve, release, and verify the issuance record',
        description: 'Requisition Approval Workspace handles review and release; Issuance Registry & Slips provides the recorded issuance and RIS documents.',
        instructions: [
            'Review the request purpose, verified document where required, requested quantities, and unreserved stock before an approval decision.',
            'Review approved requests in the approval workspace. For document-backed requests, use Mark Ready for Pickup & Notify Requester before release.',
            'Confirm the recipient, approved quantities, and signed RIS acknowledgment before using Confirm Release & Deduct Stock. Enter useful reasons when returning or rejecting a request.',
            'Recheck the Released / Issued status, inventory balance, and Issuance Registry & Slips. Preview the RIS and confirm the recorded signatories.',
        ],
        outcome: 'The release is traceable through the request, official issuance record, and stock balance.',
        tip: 'Approval reserves stock; release completes the stock movement. Use the actual recorded stage when answering requester questions.',
    },
    {
        id: 'suppliers', chapter: 'Supply operations', routeName: 'suppliers.index',
        selector: '[data-tour="system-admin-suppliers-workspace"]',
        title: 'Maintain a reliable supplier directory',
        description: 'Supplier Registry stores the supplier identities and contact information used in supply records.',
        instructions: [
            'Search existing suppliers and check the status filter before registering another supplier.',
            'Review the supplier’s details against the approved source and use the available edit controls for corrections.',
            'Check that the intended supplier can be selected on the relevant item and receiving records.',
        ],
        outcome: 'Supply records refer to the intended supplier with consistent directory details.',
    },
    {
        id: 'reports', chapter: 'Supply operations', routeName: 'compliance.reports',
        selector: '[data-tour="system-admin-reports-workspace"]',
        title: 'Generate and verify official supply reports',
        description: 'Manage Reports contains the official forms registry and the guided report-generation workflow.',
        instructions: [
            'Search the registry and filter by report type before generating another report for the same purpose.',
            'Choose the correct form and reporting period, then review the preview, source records, totals, and signatories.',
            'Generate or export using the provided controls and verify the resulting document before distributing or archiving it.',
        ],
        outcome: 'The report matches the intended period and the underlying supply records.',
        tip: 'Historical migration requires its own validation. Review imported data before relying on it in an official report.',
    },
    {
        id: 'analytics', chapter: 'Supply operations', routeName: 'compliance.analytics',
        selector: '[data-tour="system-admin-analytics-workspace"]',
        title: 'Use analytics to plan and investigate',
        description: 'Consumable Supply Analytics compares department demand, frequently requested items, requisition trends, and supply usage.',
        instructions: [
            'Set the relevant reporting dates and department filters before reading a chart or total.',
            'Choose the appropriate analytics view and compare demand, requests, and usage within the selected scope.',
            'Confirm unusual results in the detailed requisition or issuance records before making procurement or policy decisions.',
        ],
        outcome: 'Your interpretation of supply demand includes the reporting period, filters, and supporting records.',
    },
    {
        id: 'rfid-records', chapter: 'Supply operations', routeName: 'rfid-scanner.index',
        selector: '[data-tour="system-admin-rfid-scanner"]',
        title: 'Verify item and RFID tag associations',
        description: 'RFID Scanner connects detected or entered tag identities to the selected inventory item.',
        instructions: [
            'Select the intended item and confirm its identity before starting the relevant scanning workflow.',
            'Review the detected tag and any conflict message. Confirm an assignment only when the tag and item match the physical label.',
            'Check the resulting association. Review an existing link carefully before using unassignment controls.',
        ],
        outcome: 'The tag points to the intended item and the association can be verified in the records.',
        tip: 'Assigning a tag identifies an item; receiving and issuance workflows record its stock movements.',
    },
    {
        id: 'login-audit', chapter: 'Audit & daily routine', routeName: 'audit-logs.login-trails',
        selector: '[data-tour="system-admin-login-audit"]',
        title: 'Investigate authentication activity',
        description: 'Login Audit records authentication activity and the details available for each access event.',
        instructions: [
            'Filter the relevant date range, user or search term, role, and status using the available toolbar controls.',
            'Read the event time, identity, access result, and network or session details to identify a pattern that needs follow-up.',
            'Use Print Ledger for the filtered audit view when documentation is required, and record the filters used.',
        ],
        outcome: 'You can locate and document the authentication events relevant to an access concern.',
        tip: 'An empty filtered view does not prove no events occurred. Clear or broaden filters and check the date range.',
    },
    {
        id: 'activity-audit', chapter: 'Audit & daily routine', routeName: 'audit-logs.transaction-trails',
        selector: '[data-tour="system-admin-activity-audit"]',
        title: 'Trace administrative and supply changes',
        description: 'Transaction Audit Logs helps you review who performed a recorded action, where it happened, and the available change details.',
        instructions: [
            'Set the date range, module, action, and search filters for the change you are investigating.',
            'Locate the event and inspect its actor, time, resource reference, status, and expanded details where available.',
            'Compare the event with the affected staff, settings, request, or inventory record; use Print Ledger for documented follow-up.',
        ],
        outcome: 'An administrative or supply change can be connected to its actor, record, and recorded result.',
        tip: 'Use recorded evidence and the current source record together when investigating a discrepancy.',
    },
    {
        id: 'daily-routine', chapter: 'Audit & daily routine', routeName: 'dashboard',
        selector: '[data-tour="system-admin-recent-activity"]',
        title: 'Finish with a repeatable daily routine',
        description: 'Return to the dashboard to combine service checks, supply follow-up, and accountability review.',
        instructions: [
            'Check database and operating mode, failed background jobs, available storage, and the latest backup timestamp.',
            'Review pending invitations, critical stock, requests awaiting action, and recent system activity.',
            'Document unresolved issues and verify completed changes in the audit logs. Sign out when your administration session ends.',
        ],
        outcome: 'You have a practical checklist for keeping the system available, accurate, and accountable.',
        tip: 'Reopen Walkthrough Guide from the System Admin dashboard whenever you need to review a task.',
    },
];

export const SYSTEM_ADMIN_DAILY_CHECKLIST = [
    'Confirm database availability and the intended operating mode.',
    'Review failed jobs, storage, and the latest database backup.',
    'Follow up on pending invitations and approved account changes.',
    'Check critical stock and requisitions awaiting verification, approval, or release.',
    'Review unusual login activity and verify completed changes in Activity Audit.',
    'Record unresolved issues and sign out of shared terminals.',
];

export function buildSystemAdminWalkthrough(
    isSystemAdmin: boolean,
    can: (permission: string) => boolean,
    routeExists: (routeName: string) => boolean,
    href: (routeName: string, params?: Record<string, string>) => string,
) {
    if (!isSystemAdmin) return [];
    return SYSTEM_ADMIN_TOUR_STEPS
        .filter(step => can(step.routeName) && routeExists(step.routeName))
        .map(step => ({ ...step, href: href(step.routeName, step.params) }));
}

export type TourRect = { top: number; left: number; right: number; bottom: number; width: number; height: number };
type TourStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const systemAdminTourStorageKey = (userId: string | number) => `nemix:system-admin-tour:${userId}:v1`;

export function readSystemAdminTourProgress(storage: TourStorage, key: string, steps: Pick<SystemAdminTourStep, 'id'>[]): number | null {
    try {
        const saved = storage.getItem(key);
        if (saved === null || steps.length === 0) return null;
        const index = steps.findIndex(step => step.id === saved);
        return index < 0 ? 0 : index;
    } catch {
        return null;
    }
}

export function saveSystemAdminTourProgress(storage: TourStorage, key: string, stepId: string | null): void {
    try {
        if (stepId === null) storage.removeItem(key);
        else storage.setItem(key, stepId);
    } catch {
        // A browser that blocks session storage can still display the current step.
    }
}

export function systemAdminTourDestinationMatches(href: string, currentHref: string): boolean {
    const current = new URL(currentHref);
    const target = new URL(href, current.origin);
    return target.origin === current.origin && target.pathname === current.pathname
        && [...target.searchParams].every(([key, value]) => current.searchParams.get(key) === value);
}

export function systemAdminTourPanelPosition(target: TourRect | null, viewportWidth: number, viewportHeight: number, panelHeight: number) {
    const padding = 12;
    const gap = 16;
    const width = Math.min(460, Math.max(0, viewportWidth - padding * 2));
    const height = Math.min(panelHeight, Math.max(0, viewportHeight - padding * 2));
    const maxLeft = Math.max(padding, viewportWidth - width - padding);
    const maxTop = Math.max(padding, viewportHeight - height - padding);
    let left = (viewportWidth - width) / 2;
    let top = (viewportHeight - height) / 2;
    if (target) {
        left = target.left + target.width / 2 - width / 2;
        if (target.right + gap + width <= viewportWidth - padding) {
            left = target.right + gap;
            top = target.top;
        } else if (target.left - gap - width >= padding) {
            left = target.left - gap - width;
            top = target.top;
        } else if (target.bottom + gap + height <= viewportHeight - padding) {
            top = target.bottom + gap;
        } else if (target.top - gap - height >= padding) {
            top = target.top - gap - height;
        } else {
            left = maxLeft;
            top = maxTop;
        }
    }
    return { left: Math.min(maxLeft, Math.max(padding, left)), top: Math.min(maxTop, Math.max(padding, top)), width };
}
