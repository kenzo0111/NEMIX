# NEMIX Production Deployment Security Verification & Secret Hygiene Guide

This guide establishes the operational and DevOps verification procedures for live infrastructure controls (Cloudflare, DigitalOcean) and the mandatory remediation for credentials exposed in prior git commit history.

> **Production Domain:** `https://unc-nemix.com`  
> **Droplet Public IP:** `157.230.253.79`  
> **Server Platform:** DigitalOcean Ubuntu 24.04 (Docker + Nginx Host Reverse Proxy)

---

## 1. Cloudflare & DigitalOcean Live Verification Guide

> [!NOTE]
> **STATUS: `VERIFIED & COMPLETE`**
> Live infrastructure controls on Cloudflare edge and the DigitalOcean Droplet (`157.230.253.79`) have been verified and confirmed active. Direct public origin access is dropped by UFW, and edge requests are served with valid Cloudflare certificates and full security response headers.

### 1.1 Cloudflare Origin CA & Strict SSL/TLS Verification — `VERIFIED & COMPLETE`
Ensure that traffic between Cloudflare edge servers and the DigitalOcean droplet is strictly authenticated via Cloudflare Origin Certificates, preventing origin bypass and MitM attacks.

- **Live State Verification**:
  - Origin Certificate: `/etc/ssl/certs/origin.pem` (Installed, mode `644`)
  - Private Key: `/etc/ssl/private/origin.key` (Installed, mode `600`)
  - Nginx Host Reverse Proxy: Active and passing configuration tests (`nginx -t` OK), proxying port 443 to `http://127.0.0.1:8080`.
  - Edge Response: Returns `Server: cloudflare`, `cf-ray`, and full HSTS/CSP/X-Frame-Options headers.

- **Droplet Host Nginx SSL Termination Setup**:
  To enable port 443 with the Cloudflare Origin Certificate and route traffic to the Docker application:
  ```bash
  # 1. Install Nginx on Droplet host
  sudo apt update && sudo apt install -y nginx

  # 2. Save certificates
  sudo mkdir -p /etc/ssl/certs /etc/ssl/private
  sudo nano /etc/ssl/certs/origin.pem      # Paste Origin Certificate
  sudo nano /etc/ssl/private/origin.key    # Paste Private Key
  sudo chmod 644 /etc/ssl/certs/origin.pem
  sudo chmod 600 /etc/ssl/private/origin.key

  # 3. Create Nginx site configuration
  cat << 'EOF' | sudo tee /etc/nginx/sites-available/unc-nemix
  server {
      listen 80;
      listen [::]:80;
      server_name unc-nemix.com www.unc-nemix.com;
      return 301 https://$host$request_uri;
  }

  server {
      listen 443 ssl http2;
      listen [::]:443 ssl http2;
      server_name unc-nemix.com www.unc-nemix.com;

      ssl_certificate /etc/ssl/certs/origin.pem;
      ssl_certificate_key /etc/ssl/private/origin.key;

      ssl_protocols TLSv1.2 TLSv1.3;
      ssl_ciphers HIGH:!aNULL:!MD5;

      client_max_body_size 64M;

      location / {
          proxy_pass http://127.0.0.1:8080;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  EOF

  # 4. Bind Docker app to local port 8080 in docker-compose.yml:
  #    ports:
  #      - "127.0.0.1:8080:80"

  # 5. Enable site and restart Nginx
  sudo ln -sf /etc/nginx/sites-available/unc-nemix /etc/nginx/sites-enabled/
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t && sudo systemctl restart nginx
  ```

- **CLI Verification Command & Results**:
  ```bash
  # 1. Direct connection to droplet IP from external machine:
  curl -kv --connect-timeout 5 https://157.230.253.79/ -H "Host: unc-nemix.com"
  # RESULT: Connection timed out / dropped by UFW firewall (PASSED - Direct origin bypass impossible)

  # 2. Production hostname via Cloudflare edge:
  curl.exe -Iv https://unc-nemix.com/
  # RESULT: HTTP/1.1 302 Found, Server: cloudflare, CF-RAY present (PASSED)
  ```

### 1.2 DigitalOcean Cloud Firewall & Droplet UFW — `VERIFIED & COMPLETE`
The DigitalOcean Droplet must NOT accept HTTP/HTTPS traffic from arbitrary public IP addresses. Only Cloudflare's published IP ranges should be allowed.

- **Droplet UFW Live Status**:
  - `Default: deny (incoming), allow (outgoing)`
  - `22/tcp LIMIT IN Anywhere` (brute-force rate limited)
  - `80,443/tcp ALLOW IN` strictly from all Cloudflare IPv4 & IPv6 CIDRs.
  - PostgreSQL port `5432` & pgAdmin port `5050` completely omitted from public ingress (isolated inside Docker network).

- **Automated UFW Enforcement on Droplet**:
  ```bash
  # Ensure default incoming policy is deny
  sudo ufw default deny incoming
  sudo ufw default allow outgoing

  # Allow SSH from your current IP (do not lock yourself out!)
  sudo ufw allow 22/tcp

  # Allow HTTP & HTTPS strictly from Cloudflare official IP ranges
  curl -s https://www.cloudflare.com/ips-v4 | while read ip; do sudo ufw allow from $ip to any port 80,443 proto tcp; done
  curl -s https://www.cloudflare.com/ips-v6 | while read ip; do sudo ufw allow from $ip to any port 80,443 proto tcp; done

  # Enable UFW
  sudo ufw enable
  sudo ufw status verbose
  ```

---

## 2. Git History Secret Scrubbing & Mandatory Rotation

> [!NOTE]
> **STATUS: `COMPLETED IN PRODUCTION`**
> All operational credentials, encryption keys, mailer tokens, database credentials, device secrets, and administrative access passwords have been rotated in the live production environment.
> If cleaning historical commits from the repository is desired, see Section 2.2 below.

### 2.1 Authoritative Rotation Checklist
Every key listed below has been re-issued and verified in production:

| Secret / Credential | Past Status | Action Required | Status |
| :--- | :--- | :--- | :--- |
| **`APP_KEY`** (Laravel AES encryption key) | Committed in sample `.env` / commit history | Re-generated via `php artisan key:generate --force`. Invalidated all previous sessions. | **`COMPLETED`** |
| **`DB_PASSWORD` & `DB_USERNAME`** (PostgreSQL) | Exposed default (`sail` / `password`) | Rotated to hardened `nemix` user with cryptographically secure 48-char hex secret; updated in `.env` and PostgreSQL engine. | **`COMPLETED`** |
| **`RESEND_API_KEY`** / Mailer SMTP credentials | Committed in historical commits | Rotated in Resend dashboard, injected into production `.env`, and restarted queue/app workers. | **`COMPLETED`** |
| **RFID Device Secrets (`device_secret_encrypted`)** | Exposed in sample seeds or commits | Re-generated 64-char cryptographically random hex secret for `RFID-HH-0FF0A4`, encrypted under new `APP_KEY`. | **`COMPLETED`** |
| **System Admin Accounts** | Default seeded passwords | Rotated default passwords with cryptographically secure random secrets; assigned `System Admin` to institutional admin (`balcevince@gmail.com`). | **`COMPLETED`** |

### 2.2 Purging Secrets from Git Commit History

To scrub past exposed tokens and secrets from the repository git history, execute the following commands on a fresh mirror clone:

#### Using `git-filter-repo` (Recommended by Git)
```bash
# 1. Install git-filter-repo
pip install git-filter-repo

# 2. Create a fresh bare clone
git clone --mirror https://github.com/kenzo0111/NEMIX.git nemix-clean
cd nemix-clean

# 3. Create expressions file with secrets to replace
cat << 'EOF' > replace-passwords.txt
# Syntax: string_to_replace===>replacement_string
APP_KEY=base64:***===>APP_KEY=REDACTED_HISTORICAL_SECRET
re_***===>REDACTED_RESEND_KEY
secret_password***===>REDACTED_PASSWORD
EOF

# 4. Filter commit history
git filter-repo --replace-text replace-passwords.txt --invert-paths --paths .env --paths .env.backup

# 5. Verify git history is clean
git log -S "re_" --source --all

# 6. Force push clean history to remote (coordinate with team!)
git push origin --force --all
git push origin --force --tags
```
