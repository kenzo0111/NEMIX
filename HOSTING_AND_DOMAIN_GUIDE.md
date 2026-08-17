# NEMIX System - Hosting, Domain & Deployment Guide

> **Project:** NEMIX - Inventory, Supply & Property Management System  
> **Client / Organization:** Supply and Property Management Office (SPMO) - University of Camarines Norte (UCN)  
> **Core Technologies:** Laravel, React/Inertia, PostgreSQL, Docker, RFID Hardware Integration  
> **Domain Name:** `unc-nemix.com` (Cloudflare Registrar)  

---

## 1. Executive Summary & Tech Architecture

The NEMIX application is a containerized web system running via Docker (`docker-compose.yml`) containing:
* **Web Application Container** (Laravel + React/Inertia frontend)
* **Database Container** (PostgreSQL 13)
* **Management Tools** (pgAdmin4)
* **Hardware Integration** (RFID scanners for asset & inventory tracking)

### Key Infrastructure Requirement:
Because the project uses Docker containers, persistent database storage, and listens for remote RFID scan events across the internet, **traditional shared hosting (Hostinger Shared, GoDaddy, Bluehost) CANNOT be used**. The project requires a **VPS (Virtual Private Server)** with full root SSH access and container support.

---

## 2. Selected Domain Details

* **Domain Name:** `nemix-ucn.com`
* **Registrar:** Cloudflare Registrar
* **Annual Cost:** ~$10.46 / year (Wholesale pricing, free WHOIS Privacy, free SSL/TLS, and global fast DNS)
* **Rationale:** Combines project brand (**NEMIX**) with institutional identity (**University of Camarines Norte - UCN**).

---

## 3. Recommended Hosting Strategy

### Primary Choice: DigitalOcean Droplet (VPS)
* **OS / Image:** Ubuntu 24.04 LTS (Select "Docker on Ubuntu" from DigitalOcean Marketplace)
* **Recommended Spec:** Basic Droplet with 1GB – 2GB RAM ($6 - $12 / month)
* **Datacenter Region:** Singapore (Best low-latency connection for the Philippines)

---

## 4. Subdomain & Network Architecture

Once the domain is registered on Cloudflare and the VPS is active, configure the following DNS records:

| Host / Subdomain | Target / Destination | Purpose |
| :--- | :--- | :--- |
| **`nemix-ucn.com`** or **`app.nemix-ucn.com`** | `A Record` $\rightarrow$ VPS Public IP | Main Web Dashboard UI for SPMO personnel & administrators |
| **`api.nemix-ucn.com`** | `A Record` $\rightarrow$ VPS Public IP | Secure HTTPS API endpoint for embedded RFID hardware scanners (ESP32/Raspberry Pi) |

---

## 5. Step-by-Step Deployment Roadmap

### Phase 1: Domain Registration (Cloudflare)
1. Complete registration for `nemix-ucn.com` on Cloudflare Registrar.
2. Confirm registrant contact details and payment.

### Phase 2: VPS Provisioning (DigitalOcean)
1. Sign up on [DigitalOcean.com](https://www.digitalocean.com).
2. Click **Create** $\rightarrow$ **Droplets**.
3. Under **Marketplace**, pick **Docker** (Ubuntu with Docker & Docker Compose pre-installed).
4. Choose **Basic Plan** ($6/mo - 1GB RAM or $12/mo - 2GB RAM).
5. Choose **Singapore** Datacenter Region.
6. Set root password or SSH key authentication.
7. Click **Create Droplet** and note your public **Server IP Address** (e.g., `157.245.xxx.xxx`).

### Phase 3: Linking Domain to Server (DNS Records)
1. In Cloudflare Dashboard, navigate to **nemix-ucn.com** $\rightarrow$ **DNS** $\rightarrow$ **Records**.
2. Click **Add Record**:
   * **Type:** `A`
   * **Name:** `@` (and another for `api`)
   * **IPv4 Address:** *[Your DigitalOcean Server IP]*
   * **Proxy Status:** Proxied (Orange Cloud enabled for free SSL/TLS)

### Phase 4: Server Setup & App Deployment
1. Connect to server via SSH on your terminal/PowerShell:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```
2. Clone repository / upload project code to server:
   ```bash
   git clone <YOUR_GIT_REPOSITORY_URL>
   cd NEMIX
   ```
3. Configure production `.env` file (Database credentials, `APP_ENV=production`, `APP_URL=https://nemix-ucn.com`).
4. Launch containers in background mode:
   ```bash
   docker compose up -d
   ```

---

## 6. RFID Device Integration Guidelines

1. **HTTPS Security:** RFID hardware scanners (e.g., ESP32 boards or Ethernet RFID readers) posting scan logs must transmit over secure HTTPS (`https://api.nemix-ucn.com/api/rfid/scan`).
2. **Payload Example:**
   ```json
   {
     "device_id": "READER_SPMO_01",
     "rfid_tag": "E2806894000050123456789A",
     "scanned_at": "2026-08-15 23:30:00"
   }
   ```
3. **Network Requirements:** Ensure campus RFID devices have internet access to reach `https://api.nemix-ucn.com`.
