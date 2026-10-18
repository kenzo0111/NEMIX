# Signatory settings cleanup audit

Scope: the System Settings signatory controls and their state, directory deletion safeguards, settings persistence, compliance previews, printed forms, and historical snapshots. This is an audit of the affected paths, not an exhaustive audit of unrelated application modules.

## Removed controls

- RSMI certification designation.
- RSMI accounting designation.
- RPCI Certified Correct By designation.
- Stock Card Storekeeper / Custodian.
- MR issuing / custodial office title.
- Separate RPCI Inventory Committee Chairman selector, consolidated into Certified Correct By (Inventory Committee Chair).

The removed controls no longer have editable form state, default values, selector targets, or hidden submissions. The two RSMI name selectors and RPCI certifier selector no longer copy a directory designation into a retired setting. Eight active name selectors remain.

## Compatibility and data preservation

- No settings rows, directory records, migration history, or report snapshots are deleted by this cleanup.
- Existing retired metadata and report-payload readers remain for compatibility. These fields are not claimed to have been erased from the database or all backend contracts.
- If only a legacy RPCI chairman is configured, the normalizer displays that person and their ID in the remaining certifier selector. An explicit current certifier takes precedence.
- Saving that selector synchronizes the legacy chairman name and ID in the same settings transaction. Clearing it clears both identities, preventing hidden fallback restoration.
- Directory deletion checks the eight active roles, by ID and by name. A legacy chairman is protected only when they are the effective fallback certifier. Retired Stock Card assignments and overridden chairman assignments no longer block deletion.
- Printed form templates and their fixed official role captions are unchanged. RIS OIC delegation, active signatory names and designations, and the MR appendix-number control remain connected.

## Remaining finding

RIS approving and issuing designations can still be overridden by a nonempty designation on the selected directory record. This behavior predates this cleanup: `SystemSettingsService::getIssuanceSignatories()` and `SystemSetting::getPublicSettings()` resolve RIS directory IDs and prefer directory designations. This cleanup does not change that separate precedence policy.

## Validation

- 81 PHP tests passed, covering directory access and assignment safeguards, retired metadata preservation, RPCI clearing and fallback, saved report snapshots, compliance forms, and RIS workflows.
- `node tests/Frontend/signatory-settings.test.mjs` passed. It renders the real settings component, checks that retired controls are absent and active controls remain, tests legacy/canonical precedence, and confirms that retired settings are not submitted.
- `npx tsc --noEmit --pretty false` passed for the full configured TypeScript project.
- `npm run build` passed.
- Reference search found no retired fields in the settings component or its TypeScript settings interface. The normalizer retains only the intentional legacy chairman reads.
- `git diff --check` passed.

No database migration is required. Deployment status is tracked separately from this source audit.
