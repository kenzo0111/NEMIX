# Authorized Personnel requisitions

Apply the migration with `php artisan migrate` and build the client with `npm run build` when deploying. Assign **Authorized Personnel** through the existing staff role management screen. No existing users are reassigned.

The role uses the Supply Coordinator dashboard, catalog, inventory, request forms, and account ownership rules. Its initial permissions copy the coordinator role at migration time; subsequent role permission changes remain independent. Requests and unit inventory stay restricted to their owner. This feature does not introduce department-wide sharing.

Authorized Personnel must select Approved MOA, Approved Research, Approved Letter, or Others and upload a PDF, JPG, JPEG, or PNG of at most 10 MB. Both the file's detected format and its extension are validated. The supporting document establishes authorization and is separate from the generated RIS. Requesters can preview, replace, or remove a selected file before submitting; when editing an existing request, the existing document is retained unless replaced.

The workflow is:

`Pending Verification → Under Review → Approved → Ready for Pickup → Released`

SPMO staff may instead return a document **For Correction**, with required remarks. The requester edits and resubmits through the same form, returning to Pending Verification. Verification is reset on every resubmission. Once verified, the normal inventory review can approve or reject the request. Approved quantities reserve stock through pickup preparation; release requires the existing signed RIS confirmation, deducts stock once, and credits the requester's unit inventory. Existing coordinator requests retain Pending, Approved, Issued, Rejected, and Cancelled behavior.

The migration grants Property Custodian the new `inventory.requests.verify-document`, `inventory.requests.document`, and `inventory.requests.ready` route permissions. Administrators may assign verification permission to designated SPMO staff through existing role management. Verification permission alone provides access to the request review queue without granting inventory approval or release. Requesters cannot verify their own documents. Approval permission alone does not grant verification permission.

Documents are stored on the private `local` disk under `supporting-documents/`, outside the public storage link. Access goes through authenticated ownership and reviewer permission checks. File paths are hidden from serialized requests. Uploads, resubmissions, document access, verification decisions, corrections, pickup preparation, and release enter the transaction audit trail. Verification metadata includes the staff member, date, and remarks. Replacing a document deletes the previous private file after successful database persistence; failed submissions delete the new file.

The document requirement is saved on the requisition, so removing the user's role cannot remove the requirement from an existing request. Authenticity and prior approval are assessed by designated staff; uploading a document does not verify it automatically.

Requester alerts cover document review and pickup readiness. Staff receive submission and resubmission alerts. The existing one-alert-per-user-per-request record is refreshed and marked unread as the workflow changes.

Validation: `php vendor/phpunit/phpunit/phpunit --filter=AuthorizedPersonnelWorkflowTest`, `npx tsc --noEmit`, and `npm run build`.
