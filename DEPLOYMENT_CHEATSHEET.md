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
ssh root@157.230.253.79 "docker cp /var/www/NEMIX/public/build/. nemix-app-1:/var/www/html/public/build/ && docker compose -f /var/www/NEMIX/docker-compose.yml exec -T app php artisan migrate --force && docker compose -f /var/www/NEMIX/docker-compose.yml exec -T app php artisan optimize:clear && docker compose -f /var/www/NEMIX/docker-compose.yml exec -T app php artisan config:cache && docker compose -f /var/www/NEMIX/docker-compose.yml exec -T app php artisan route:cache && docker compose -f /var/www/NEMIX/docker-compose.yml exec -T app php artisan view:cache && docker compose -f /var/www/NEMIX/docker-compose.yml exec -T app php artisan queue:restart"
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

## 5. Live Database Access (pgAdmin Web Interface)

The database management interface runs via Docker container on port `5050`:

* **URL:** `http://157.230.253.79:5050`
* **pgAdmin Login Email:** `admin@example.com` (or `PGADMIN_DEFAULT_EMAIL` in `.env`)
* **pgAdmin Login Password:** `admin` (or `PGADMIN_DEFAULT_PASSWORD` in `.env`)

### How to Register the Database Server inside pgAdmin:
1. Click **Add New Server**
2. **General Tab:**
   * Name: `NEMIX DB`
3. **Connection Tab:**
   * Host name / address: `db`
   * Port: `5432`
   * Maintenance database: `laravel`
   * Username: `sail`
   * Password: `password`

