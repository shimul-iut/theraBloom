#!/bin/bash

echo "🔧 Fixing Prisma client for Unavailability feature..."
echo ""

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

echo ""
echo "🗄️  Running migrations..."
npx prisma migrate deploy

echo ""
echo "✅ Done! Please restart your backend server."
echo ""
echo "To restart:"
echo "  npm run dev"
