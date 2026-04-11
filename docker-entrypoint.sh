#!/bin/sh
set -e

# Check if database tables already exist by trying to query the User table
if node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst().then(() => process.exit(0)).catch(() => process.exit(1));
" 2>/dev/null; then
  echo "✅ Database already initialized. Skipping schema push."
else
  echo "⏳ Database not initialized. Pushing Prisma schema..."
  npx prisma db push --accept-data-loss
fi

echo "🚀 Starting Next.js server..."
exec node server.js
