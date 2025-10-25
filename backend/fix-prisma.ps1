Write-Host "🔧 Fixing Prisma client for Unavailability feature..." -ForegroundColor Yellow
Write-Host ""

# Generate Prisma client
Write-Host "📦 Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate

Write-Host ""
Write-Host "🗄️  Running migrations..." -ForegroundColor Cyan
npx prisma migrate deploy

Write-Host ""
Write-Host "✅ Done! Please restart your backend server." -ForegroundColor Green
Write-Host ""
Write-Host "To restart:" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor Gray
