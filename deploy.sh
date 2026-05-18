#!/bin/bash
set -e

echo "=== LetLoyal Deployment Script ==="

# Load env
if [ ! -f ".env.production" ]; then
  echo "ERROR: .env.production not found. Copy .env.production.example and fill in values."
  exit 1
fi
export $(grep -v '^#' .env.production | xargs)

echo "Step 1: Installing dependencies..."
npm install --omit=dev

echo "Step 2: Building Next.js..."
NODE_ENV=production npm run build

echo "Step 3: Copying static files for standalone build..."
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

echo "Step 4: Creating logs directory..."
mkdir -p logs

echo "Step 5: Running database schema..."
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < db/schema.sql

echo "Step 6: Running seed data..."
NODE_ENV=production npx ts-node --project tsconfig.seed.json db/seed.ts

echo "Step 7: Starting PM2..."
pm2 delete letloyal 2>/dev/null || true
NODE_ENV=production pm2 start ecosystem.config.js --env production
pm2 save

echo ""
echo "=== Deployment complete! ==="
echo "App running on port 3000"
echo "Run: pm2 logs letloyal  to verify"
