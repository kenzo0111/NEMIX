# NEMIX Production Deployment & Server Cheat Sheet

> **Live Web Application:** [https://unc-nemix.com](https://unc-nemix.com)  
> **Server IP:** `157.230.253.79` (DigitalOcean Droplet - Singapore)  
> **RFID Scan API Endpoint:** `https://unc-nemix.com/api/rfid/scan`  
> **Project Directory on Server:** `/var/www/NEMIX`  

---

## 1. How to Connect to Your Server

Open **Windows PowerShell** on your laptop and run:

```powershell
ssh root@157.230.253.79
```

Once connected, switch to your application directory:
```bash
cd /var/www/NEMIX
```

---

## 2. Docker Service Management Commands

The application runs 24/7 in background mode (`-d`). You do not need to keep your terminal open.

| Task | Command | Description |
| :--- | :--- | :--- |
| **Check Status** | `docker compose ps` | Displays the status of web & database containers |
| **View Live Logs** | `docker compose logs -f app` | Streams live web traffic and RFID scan request logs |
| **Start Server** | `docker compose up -d` | Launches containers in background mode |
| **Stop Server** | `docker compose down` | Safely stops all application and database containers |
| **Restart Server** | `docker compose restart` | Quick restart of all services |

---

## 3. Recommended CPU-Efficient Deployment (Zero-Spike)

> **Why Pre-Build Locally?**  
> Running `npm run build` directly on a cloud Droplet (1-2 vCPUs, 2GB RAM) consumes over 1.2GB memory and spikes CPU to 100%, often causing kernel Out-Of-Memory (OOM) lockups. Building locally completes in ~10 seconds and keeps the Droplet CPU at ~0%.

### Fast 3-Step Deployment from Local Windows PowerShell:

```powershell
# Step 1: Build production assets locally (10-15 seconds, 0% Droplet CPU load)
npm run build

# Step 2: Push your latest git commit (if not already pushed)
git push origin master

# Step 3: Deploy to server and apply updates
ssh root@157.230.253.79 "cd /var/www/NEMIX && git pull origin master"
scp -r public/build root@157.230.253.79:/var/www/NEMIX/public/
ssh root@157.230.253.79 "chmod -R 755 /var/www/NEMIX/public/build && docker cp /var/www/NEMIX/public/build/. nemix-app-1:/var/www/html/public/build/ && docker exec nemix-app-1 chmod -R 755 /var/www/html/public/build && docker compose -f /var/www/NEMIX/docker-compose.yml exec -T app php artisan migrate --force && docker compose -f /var/www/NEMIX/docker-compose.yml exec -T app php artisan optimize:clear && docker compose -f /var/www/NEMIX/docker-compose.yml exec -T app php artisan config:cache && docker compose -f /var/www/NEMIX/docker-compose.yml exec -T app php artisan route:cache && docker compose -f /var/www/NEMIX/docker-compose.yml exec -T app php artisan view:cache && docker compose -f /var/www/NEMIX/docker-compose.yml exec -T app php artisan queue:restart"
```

---

## 4. Useful Laravel Maintenance Commands

Run these inside the server directory `/var/www/NEMIX`:

```bash
# Run database migrations
docker compose exec app php artisan migrate --force

# Seed database
docker compose exec app php artisan db:seed --force

# Clear application configuration cache
docker compose exec app php artisan config:clear

# Re-link storage directory
docker compose exec app php artisan storage:link
```

---

## 5. Restricted Database Administration

PostgreSQL has no host port mapping. pgAdmin is disabled by default and binds only to the server loopback interface when started with `docker compose --profile admin up -d pgadmin`. Set unique `DB_USERNAME`, `DB_PASSWORD`, `PGADMIN_DEFAULT_EMAIL`, and `PGADMIN_DEFAULT_PASSWORD` in the server environment before starting Docker. Existing default credentials and any previously published production credentials require rotation.

From an authorized workstation, establish `ssh -L 5050:127.0.0.1:5050 root@<server>` and open `http://127.0.0.1:5050` locally. In pgAdmin register host `db`, port `5432`, and the database credentials from the server environment. Do not publish either database service through Cloudflare or a public host port.

## 6. Origin Firewall Rollout

Before tightening ingress, confirm the current administrator IP and an active SSH session. Add an allow rule for TCP 22 from the administrator IP, then verify a second SSH connection. Permit TCP 80/443 only from the current Cloudflare published IPv4 and IPv6 ranges; automate range updates and verify the web application through Cloudflare. Deny public TCP 5050 and 5432, then verify both ports from an external host. Keep a recovery console available while applying these rules. Do not change the firewall based on an old static CIDR list.

Set `TRUSTED_PROXIES` to only the directly connected reverse proxy addresses or CIDRs. For this Cloudflare-direct origin, run `python3 ops/sync_cloudflare_proxies.py` and rebuild Laravel's config cache; rerun it when Cloudflare publishes range changes. Confirm direct origin traffic cannot provide trusted `X-Forwarded-*` metadata. Deploy the updated ESP32 firmware and provision each scanner's unique signing secret before enabling the HMAC-only API; previously issued reusable tokens must be rotated.

For production, set `APP_ENV=production`, `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`, and `SESSION_HTTP_ONLY=true`. Keep the application key and all database, mail, and scanner credentials only in the server environment. Use a shared cache backend for HMAC nonce replay protection. After deployment, check `docker compose ps`, verify Laravel can query PostgreSQL through host `db`, and confirm externally that ports 5050 and 5432 are closed.
