#!/bin/bash
# LetLoyal — One-command setup for Hostinger VPS (Ubuntu 22.04)
# Run once after uploading the project:
#   chmod +x setup.sh && bash setup.sh

set -e

echo "=================================================="
echo "  LetLoyal Setup Script"
echo "=================================================="

# 1. Install dependencies
echo ""
echo "[1/5] Installing Node.js dependencies..."
npm install

# 2. Check for .env.production file
echo ""
echo "[2/5] Checking environment config..."
if [ ! -f ".env.production" ]; then
  echo ""
  echo "  ERROR: .env.production not found."
  echo "  Create it with the following variables:"
  echo ""
  echo "    DB_HOST=localhost"
  echo "    DB_PORT=3306"
  echo "    DB_USER=letloyal"
  echo "    DB_PASSWORD=YOUR_STRONG_PASSWORD"
  echo "    DB_NAME=letloyal"
  echo "    JWT_SECRET=\$(openssl rand -hex 32)"
  echo "    JWT_EXPIRY=30d"
  echo "    OTP_EXPIRY_SECONDS=600"
  echo "    OTP_MAX_ATTEMPTS=3"
  echo "    NEXT_PUBLIC_BASE_URL=https://YOUR_DOMAIN.com"
  echo "    NODE_ENV=production"
  echo "    PORT=3000"
  echo ""
  echo "  Then re-run: bash setup.sh"
  exit 1
fi

# Load env vars for the seed step
export $(grep -v '^#' .env.production | xargs)

# 3. Build Next.js
echo ""
echo "[3/5] Building Next.js app (this takes ~2 min)..."
NODE_ENV=production npm run build

# 4. Run DB schema + seed
echo ""
echo "[4/5] Setting up database..."
echo "      Applying schema..."
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < db/schema.sql
echo "      Schema applied."

echo "      Seeding demo data..."
NODE_ENV=production npx ts-node --project tsconfig.seed.json db/seed.ts
echo "      Seed complete."

# 5. Start with PM2
echo ""
echo "[5/5] Starting app with PM2..."
pm2 delete letloyal 2>/dev/null || true
NODE_ENV=production pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo ""
echo "=================================================="
echo "  LetLoyal is running on port 3000"
echo ""
echo "  Next steps:"
echo "  1. Configure Nginx:  sudo cp nginx/letloyal.conf /etc/nginx/sites-available/letloyal"
echo "                       Edit it to replace YOUR_DOMAIN.com with your real domain"
echo "                       sudo ln -s /etc/nginx/sites-available/letloyal /etc/nginx/sites-enabled/"
echo "                       sudo nginx -t && sudo systemctl reload nginx"
echo "  2. Get SSL cert:     sudo certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com"
echo "  3. Verify health:    curl http://localhost:3000/api/health"
echo "=================================================="
