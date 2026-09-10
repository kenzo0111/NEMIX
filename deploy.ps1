# ==============================================================================
# NEMIX Automated CPU-Efficient Production Deployment Script
# ==============================================================================
# This script builds Vite assets locally on your workstation (avoiding 100% CPU
# spikes and OOM crashes on the DigitalOcean Droplet), uploads the build artifacts,
# pulls the latest master commit, and updates Laravel caches and migrations.
# ==============================================================================

$ErrorActionPreference = "Stop"
$Server = "root@157.230.253.79"
$RemoteDir = "/var/www/NEMIX"

Write-Host "==> [1/5] Building Vite production assets locally..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Local build failed! Aborting deployment." -ForegroundColor Red
    exit 1
}

Write-Host "==> [2/5] Pulling latest git commit on production Droplet..." -ForegroundColor Cyan
ssh $Server "cd $RemoteDir && git pull origin master"

Write-Host "==> [3/5] Transferring compiled assets to Droplet..." -ForegroundColor Cyan
scp -r public/build "${Server}:${RemoteDir}/public/"

Write-Host "==> [4/5] Copying assets into Docker app container and setting permissions..." -ForegroundColor Cyan
ssh $Server "docker cp ${RemoteDir}/public/build/. nemix-app-1:/var/www/html/public/build/ && docker compose -f ${RemoteDir}/docker-compose.yml exec -T app chown -R www-data:www-data /var/www/html/public/build"

Write-Host "==> [5/5] Running migrations, caching, and queue restart..." -ForegroundColor Cyan
ssh $Server "docker compose -f ${RemoteDir}/docker-compose.yml exec -T app php artisan migrate --force && docker compose -f ${RemoteDir}/docker-compose.yml exec -T app php artisan optimize:clear && docker compose -f ${RemoteDir}/docker-compose.yml exec -T app php artisan config:cache && docker compose -f ${RemoteDir}/docker-compose.yml exec -T app php artisan route:cache && docker compose -f ${RemoteDir}/docker-compose.yml exec -T app php artisan view:cache && docker compose -f ${RemoteDir}/docker-compose.yml exec -T app php artisan queue:restart"

Write-Host "==> Deployment completed successfully! Verifying health..." -ForegroundColor Green
curl.exe -s -I https://unc-nemix.com/login | Select-String "HTTP/"
