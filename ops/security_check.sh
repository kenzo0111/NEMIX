#!/usr/bin/env bash
set -euo pipefail
cd /var/www/NEMIX
for key in DB_USERNAME DB_PASSWORD PGADMIN_DEFAULT_EMAIL PGADMIN_DEFAULT_PASSWORD TRUSTED_PROXIES; do
    if grep -Eq "^${key}=.+" .env; then
        printf '%s: set\n' "$key"
    else
        printf '%s: missing or empty\n' "$key"
    fi
done
for pair in 'APP_ENV=production' 'APP_DEBUG=false' 'SESSION_SECURE_COOKIE=true' 'SESSION_HTTP_ONLY=true'; do
    if grep -Fqx "$pair" .env; then
        printf '%s: configured\n' "${pair%%=*}"
    else
        printf '%s: verify configuration\n' "${pair%%=*}"
    fi
done
if grep -Fqx 'DB_PASSWORD=password' .env; then echo 'DB_PASSWORD: documented default in use'; fi
if grep -Fqx 'DB_USERNAME=sail' .env; then echo 'DB_USERNAME: documented default in use'; fi
if grep -Fqx 'PGADMIN_DEFAULT_PASSWORD=admin' .env; then echo 'PGADMIN_DEFAULT_PASSWORD: documented default in use'; fi
printf 'Origin HTTP response: '
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' -H 'Host: unc-nemix.com' http://127.0.0.1/login
printf 'Listening TCP ports: '
ss -lntH | awk '{print $4}' | grep -E ':(22|80|443|5050|5432|5433)$' | tr '\n' ' '
echo
