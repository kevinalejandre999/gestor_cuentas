#!/bin/sh
set -e

echo "⏳ Syncing database schema..."
npx prisma db push --accept-data-loss

echo "🚀 Starting Next.js server..."
exec node server.js
