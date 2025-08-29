#!/bin/bash
set -e

echo "🚀 Starting backend deploy process..."

# 1. Run local migration (for your dev DB)
npx prisma migrate dev --name auto_migration

# 2. Generate updated Prisma client
npx prisma generate

# 3. Apply migrations to PRODUCTION DB (uses .env DATABASE_URL)
npx prisma migrate deploy --schema=prisma/schema.prisma

# 4. Build backend
npm run build

# 5. Package files into a deploy.zip
echo "📦 Creating deploy.zip for cPanel..."
rm -f deploy.zip
zip -r deploy.zip dist prisma node_modules/@prisma node_modules/.prisma package.json package-lock.json .env

echo "✅ Backend build, migrations, and deploy.zip created successfully!"
echo "👉 Upload deploy.zip to cPanel, then extract it in your backend folder."
