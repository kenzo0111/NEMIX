#!/usr/bin/env bash
set -euo pipefail
cd /var/www/NEMIX
umask 077
mkdir -p storage/backups
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup="storage/backups/security-backup-${stamp}.sql.gz"
docker exec nemix-db-1 sh -c 'exec pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip -1 > "$backup"
gzip -t "$backup"
test -s "$backup"
printf 'Backup verified: %s (%s bytes)\n' "$backup" "$(wc -c < "$backup")"
