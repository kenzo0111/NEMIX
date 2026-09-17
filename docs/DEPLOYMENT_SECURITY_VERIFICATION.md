# NEMIX Production Deployment Security Verification & Secret Hygiene Guide

This guide establishes the operational and DevOps verification procedures for live infrastructure controls (Cloudflare, DigitalOcean) and the mandatory remediation for credentials exposed in prior git commit history.

---

## 1. Cloudflare & DigitalOcean Live Verification Guide

Because these infrastructure controls reside in third-party cloud control panels and firewalls, they are classified as **`REQUIRES LIVE VERIFICATION`**. The infrastructure engineer must execute the following verifications on the live production environment.

### 1.1 Cloudflare Origin CA & Strict SSL/TLS Verification
Ensure that traffic between Cloudflare edge servers and the DigitalOcean droplet is strictly authenticated via Cloudflare Origin Certificates, preventing origin bypass and MitM attacks.

- **Cloudflare Dashboard Verification**:
  1. Navigate to **SSL/TLS** -> **Overview**.
  2. Confirm encryption mode is set to **`Full (strict)`**. *(Do not use 'Flexible' or plain 'Full').*
  3. Navigate to **SSL/TLS** -> **Origin Server**.
  4. Verify that an **Origin Certificate** is active and installed on the droplet's web server (`/etc/ssl/certs/origin.pem` and `/etc/ssl/private/origin.key`).
  5. Enable **Authenticated Origin Pulls (AOP)** to ensure the web server only accepts requests signed by Cloudflare's client certificate.

- **CLI Verification Command (from external machine)**:
  ```bash
  # 1. Test that direct connection to droplet IP without Cloudflare hostname is blocked or rejected
  curl -kv https://<DROPLET_PUBLIC_IP>/ -H "Host: nemix.camarinesnorte.edu.ph"
  # Expected: Connection refused, timeout, or 403 Forbidden
  
  # 2. Test production hostname via Cloudflare edge
  curl -Iv https://nemix.camarinesnorte.edu.ph/
  # Expected: HTTP/2 200 or 302, CF-RAY header present, Strict-Transport-Security present
  ```

### 1.2 DigitalOcean Cloud Firewall (Port 80/443 Restrict to Cloudflare IPs Only)
The DigitalOcean Droplet must NOT accept HTTP/HTTPS traffic from arbitrary public IP addresses. Only Cloudflare's published IP ranges should be allowed.

- **DigitalOcean Console Verification**:
  1. Navigate to **Networking** -> **Firewalls** -> `nemix-droplet-firewall`.
  2. Under **Inbound Rules**:
     * **SSH (Port 22)**: Restrict to Bastion host or internal VPN IP only.
     * **HTTP (Port 80)**: Source = `Cloudflare` (or Cloudflare official IP ranges: [cloudflare.com/ips](https://www.cloudflare.com/ips/)).
     * **HTTPS (Port 443)**: Source = `Cloudflare` (official IPv4 and IPv6 ranges).
     * **PostgreSQL (Port 5432)**: Only internal VPC network (`10.x.x.x`) or local loopback (`127.0.0.1`). Disallow all public sources `0.0.0.0/0`.
  3. Under **Outbound Rules**: All IPv4 and IPv6 allowed.

- **CLI UFW Verification on Droplet**:
  ```bash
  sudo ufw status verbose
  # Ensure default incoming policy is 'deny'
  # Verify rule: 443/tcp ALLOW from 173.245.48.0/20, 103.21.244.0/22, etc.
  ```

---

## 2. Git History Secret Scrubbing & Mandatory Rotation

> [!WARNING]
> **STATUS: `ROTATION REQUIRED`**
> Prior commits contained exposed secrets (such as development `.env` values, API tokens, database passwords, and device secrets). Removing a secret from the current working tree does **NOT** revoke or erase it from git object history. Any past exposed secret must be treated as fully compromised.

### 2.1 Authoritative Rotation Checklist
Every key listed below must be immediately re-issued in production:

| Secret / Credential | Past Status | Action Required | Status |
| :--- | :--- | :--- | :--- |
| **`APP_KEY`** (Laravel AES encryption key) | Committed in sample `.env` / commit history | Re-generate via `php artisan key:generate`. Invalidate existing sessions. | **`ROTATION REQUIRED`** |
| **`DB_PASSWORD`** (PostgreSQL) | Exposed in historical docker-compose/env files | Change database user password via `ALTER USER nemix WITH PASSWORD '...';` and update `.env`. | **`ROTATION REQUIRED`** |
| **`RESEND_API_KEY`** / Mailer SMTP credentials | Committed in historical commits | Revoke API key in Resend/SMTP dashboard; issue fresh API key. | **`ROTATION REQUIRED`** |
| **RFID Device Secrets (`device_secret_encrypted`)** | Exposed in sample seeds or commits | Re-generate 64-char cryptographically random hex secrets for each active RFID scanner. | **`ROTATION REQUIRED`** |
| **System Admin Accounts** | Default seeded passwords | Enforce immediate password reset on first login; mandate 2FA. | **`ROTATION REQUIRED`** |

### 2.2 Purging Secrets from Git Commit History

To scrub past exposed tokens and secrets from the repository git history, execute the following commands on a fresh mirror clone:

#### Option A: Using `git-filter-repo` (Recommended by Git)
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

#### Option B: Using BFG Repo-Cleaner
```bash
# 1. Create text file of passwords to remove
cat << 'EOF' > passwords.txt
<EXPOSED_DB_PASSWORDS>
<EXPOSED_APP_KEYS>
<EXPOSED_RESEND_KEYS>
EOF

# 2. Run BFG
java -jar bfg.jar --replace-text passwords.txt nemix.git
cd nemix.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push origin --force --all
```
