# LetLoyal — Deployment Guide (Hostinger VPS)

## Prerequisites
- Ubuntu 22.04 LTS VPS (2+ vCPU, 4GB+ RAM)
- Domain pointed to VPS IP (A record)
- SSH access as root or sudo user

---

## Step 1 — System update

```bash
sudo apt update && sudo apt upgrade -y
```

---

## Step 2 — Install Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
node --version   # must show v20.x.x
```

---

## Step 3 — Install MySQL 8.0

```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation
# Answer: Y, set root password, Y, Y, Y, Y

sudo mysql -e "CREATE DATABASE letloyal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'letloyal'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';"
sudo mysql -e "GRANT ALL PRIVILEGES ON letloyal.* TO 'letloyal'@'localhost'; FLUSH PRIVILEGES;"
```

---

## Step 4 — Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
```

---

## Step 5 — Install PM2 and Certbot

```bash
npm install -g pm2
sudo apt install certbot python3-certbot-nginx -y
```

---

## Step 6 — Upload project to VPS

**Option A — rsync (recommended):**
```bash
# Run from your local machine
rsync -avz --exclude node_modules --exclude .next ./ user@YOUR_VPS_IP:/home/user/letloyal/
```

**Option B — git:**
```bash
sudo mkdir -p /home/user/letloyal
sudo chown $USER:$USER /home/user/letloyal
cd /var/www && git clone YOUR_REPO letloyal
```

---

## Step 7 — Create production .env file

```bash
nano /home/user/letloyal/.env.production
```

Paste and fill in all values:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=letloyal
DB_PASSWORD=STRONG_PASSWORD_HERE
DB_NAME=letloyal
JWT_SECRET=<run: openssl rand -hex 32>
JWT_EXPIRY=30d
OTP_EXPIRY_SECONDS=600
OTP_MAX_ATTEMPTS=3
NEXT_PUBLIC_BASE_URL=https://YOUR_DOMAIN.com
NODE_ENV=production
PORT=3000
```

---

## Step 8 — Install dependencies and build

```bash
cd /home/user/letloyal
npm install
NODE_ENV=production npm run build
```

---

## Step 9 — Apply database schema and seed

```bash
cd /home/user/letloyal
mysql -u letloyal -pSTRONG_PASSWORD letloyal < db/schema.sql
NODE_ENV=production npx ts-node --project tsconfig.seed.json db/seed.ts
```

---

## Step 10 — Start with PM2

`ecosystem.config.js` is already in the project root. Just run:

```bash
cd /home/user/letloyal
NODE_ENV=production pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup    # run the printed command to enable auto-start on reboot
pm2 logs letloyal --lines 50   # verify no errors
```

---

## Step 11 — Configure Nginx

```bash
# Edit the template (replace YOUR_DOMAIN.com with your real domain)
sudo cp /home/user/letloyal/nginx/letloyal.conf /etc/nginx/sites-available/letloyal
sudo nano /etc/nginx/sites-available/letloyal

sudo ln -s /etc/nginx/sites-available/letloyal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # remove default site
sudo nginx -t                                  # must say "test is successful"
sudo systemctl reload nginx
```

---

## Step 12 — SSL Certificate

```bash
sudo certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com
# Follow the prompts. Auto-renewal is configured automatically.

# Verify renewal works:
sudo certbot renew --dry-run
```

---

## Step 13 — Final verification

```bash
# Health check (DB connectivity)
curl https://YOUR_DOMAIN.com/api/health
# Expected: {"status":"ok","timestamp":"...","db":"connected"}

# Homepage
curl -I https://YOUR_DOMAIN.com
# Expected: HTTP/2 200
```

Then open in browser:
- `https://YOUR_DOMAIN.com` — marketing homepage
- `https://YOUR_DOMAIN.com/store/brewhouse-cafe` — customer store (test on mobile)
- `https://YOUR_DOMAIN.com/merchant/brewhouse-cafe` — merchant dashboard

**Demo login:** slug = `brewhouse-cafe`, password = `demo1234`

---

## Quick re-deploy after code changes

```bash
cd /home/user/letloyal
git pull                          # or rsync from local
npm install                       # only if package.json changed
NODE_ENV=production npm run build
pm2 reload letloyal               # zero-downtime reload
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `502 Bad Gateway` | `pm2 list` — is letloyal running? Check `pm2 logs letloyal` |
| DB connection error | Verify `.env.production` values; check `sudo systemctl status mysql` |
| Build fails | Check Node is v20+; run `npm install` again |
| SSL not renewing | `sudo certbot renew --dry-run`; check port 80 is open in firewall |
| PM2 not starting on reboot | Re-run `pm2 startup` and execute the printed command |

---

## Demo Merchant Logins

| Merchant | Slug | Password |
|----------|------|----------|
| BrewHouse Café | `brewhouse-cafe` | `demo1234` |
| Bella Beauty | `bella-beauty` | `demo1234` |
| The Fit Club | `the-fit-club` | `demo1234` |
| Metro Deli | `metro-deli` | `demo1234` |
| Luxe Boutique | `luxe-boutique` | `demo1234` |
| Casa Pizzeria | `casa-pizzeria` | `demo1234` |
