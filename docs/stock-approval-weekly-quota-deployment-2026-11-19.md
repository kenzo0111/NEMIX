# Stock approval and weekly quota deployment

Completed on 19 November 2026 (Asia/Singapore) using `DEPLOYMENT_CHEATSHEET.md`'s local-build and compressed-archive deployment method.

- Site: https://unc-nemix.com
- Server: `157.230.253.79`, checkout `/var/www/NEMIX`
- Deployed code revision: `f30676e6b0ebfd64318d9d1228302c1fba99e6e9`
- Previous revision: `96dbdc02cc6744e9627e361654f92d59b295dd1a`
- Pre-deployment database backup: `storage/app/private/backups/supply-sync-20261119-191147.sql.gz`
- Previous asset backup: `storage/backups/stock-quota-f30676e/build`
- Live build manifest SHA-256: `bc04c54a849106859dca4b380206fe8ea1303c6f5dbb4fcea0b5ae6298165cba`

## Applied configuration

The user supplied **10**, interpreted as 10 of each listed item's unit per user per calendar week. All 23 listed inventory records (IDs 1–23) now have `weekly_request_limit = 10`. Both Highlighter Pen records, IDs 8 and 23, use this same numeric limit. Their stock and transaction history were preserved as requested. New item records need their own configured limit.

Weeks reset Monday at 00:00 in the application timezone, `Asia/Manila`, which has the same UTC offset as Asia/Singapore.

## Migration and reconciliation

- Migration `2026_11_19_000001_add_approval_allocations_and_weekly_quotas` completed.
- Conversion dry run validated one existing approved request and rolled back its trial changes.
- Actual conversion completed for one existing approval, request 25, allocating 22 units across its two lines.
- Correction Tape: available stock changed from 8 to 6; 2 pieces remain allocated awaiting pickup.
- Bleach Solution: available stock changed from 29 to 9; 20 bottles remain allocated awaiting pickup.
- These existing commitments were honored despite falling below the newer minimum-stock threshold. New approvals retain minimum-stock and weekly-quota checks.
- All item cached balances reconciled with batch balances; approved line quantities matched saved allocations.
- Released/Issued requests were not reconverted or deducted again.

## Production verification

- Every supplied limit was checked against the production item record and matched 10.
- No outstanding legacy approval remained without an allocation marker.
- Host checkout matched the deployed code revision.
- The container build manifest matched the verified local build.
- Laravel caches and permission cache refreshed; queue restart signal sent.
- Maintenance mode ended successfully.
- Public HTTPS login endpoint returned HTTP 200.
- Published JavaScript and stylesheet endpoints returned HTTP 200.
- Application and database containers remained running.

Pre-deployment validation: 87 focused PHP tests and 1,770 assertions; seven real PostgreSQL concurrency checks; request-form, request-details, and RIS-preview frontend regressions; TypeScript check and production build passed. The broader inventory suite retains previously reproduced baseline failures.
