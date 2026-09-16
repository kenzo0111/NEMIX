#!/usr/bin/env bash
set -euo pipefail
cd /var/www/NEMIX
db_user="$(docker exec nemix-db-1 printenv POSTGRES_USER)"
db_name="$(docker exec nemix-db-1 printenv POSTGRES_DB)"
query() { docker exec nemix-db-1 psql -U "$db_user" -d "$db_name" -Atqc "$1"; }
if [[ "$(query "SELECT to_regclass('public.rfid_devices') IS NOT NULL")" == t ]]; then
    printf 'RFID devices (total, recently seen): '
    query "SELECT count(*), count(*) FILTER (WHERE last_seen_at > now() - interval '24 hours') FROM rfid_devices"
else
    echo 'RFID devices: table absent'
fi
if [[ "$(query "SELECT to_regclass('public.password_change_requests') IS NOT NULL")" == t ]]; then
    printf 'Pending OTP requests: '
    query "SELECT count(*) FROM password_change_requests WHERE is_used = false AND expires_at > now()"
fi
printf 'Cache backend: '
if grep -Fqx 'CACHE_STORE=database' .env; then echo database; elif grep -Fqx 'CACHE_STORE=redis' .env; then echo redis; else echo other; fi
