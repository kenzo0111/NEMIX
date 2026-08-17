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

## 3. How to Deploy New Updates to the Server

Whenever you modify your project locally and push changes to GitHub, deploy them to the live server in **4 easy steps**:

```bash
# Step 1: Connect to server
ssh root@157.230.253.79

# Step 2: Navigate to project folder
cd /var/www/NEMIX

# Step 3: Pull latest changes from GitHub
git pull origin master

# Step 4: Rebuild Vite assets inside container
docker compose exec app npm run build
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
