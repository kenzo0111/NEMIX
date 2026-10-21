# Build locally, transfer one archive, and install through one SSH session.
[CmdletBinding()]
param([switch]$CheckConnection)

$ErrorActionPreference = 'Stop'
$Server = 'root@157.230.253.79'
$RemoteDir = '/var/www/NEMIX'
$SshOptions = @(
    '-o', 'IPQoS=none',
    '-o', 'BatchMode=yes',
    '-o', 'ConnectTimeout=15',
    '-o', 'ConnectionAttempts=1',
    '-o', 'ServerAliveInterval=10',
    '-o', 'ServerAliveCountMax=3'
)

function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Program failed (exit $LASTEXITCODE). Deployment stopped; see the output above."
    }
}

$Timer = [System.Diagnostics.Stopwatch]::StartNew()
Push-Location $PSScriptRoot
try {
    Write-Host '==> Checking production SSH connection before building...' -ForegroundColor Cyan
    Invoke-Checked 'ssh' (@('-T') + $SshOptions + @($Server, 'echo SSH_CONNECTION_OK'))
    if ($CheckConnection) {
        Write-Host ('Connection verified in {0:N1}s. No production files changed.' -f $Timer.Elapsed.TotalSeconds)
        return
    }

    # Production pulls this revision; frontend changes must be committed first.
    Invoke-Checked 'git' @('diff', '--quiet', 'HEAD', '--', 'resources', 'Modules', 'public', 'package.json', 'package-lock.json', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js', 'tsconfig.json')
    $ExpectedCommit = & git rev-parse HEAD
    if ($LASTEXITCODE -ne 0) { throw 'Cannot determine local Git revision.' }
    $ExpectedCommit = $ExpectedCommit.Trim()

    Write-Host '==> Building production assets locally...' -ForegroundColor Cyan
    Invoke-Checked 'npm' @('run', 'build')

    $ArchiveName = 'nemix-assets-' + [Guid]::NewGuid().ToString('N') + '.tar.gz'
    $Archive = Join-Path ([System.IO.Path]::GetTempPath()) $ArchiveName
    $RemoteArchive = '/tmp/' + $ArchiveName
    try {
        Invoke-Checked 'tar' @('-czf', $Archive, '-C', 'public', 'build')
        $ArchiveHash = (Get-FileHash -LiteralPath $Archive -Algorithm SHA256).Hash.ToLowerInvariant()
        $ManifestHash = (Get-FileHash -LiteralPath 'public/build/manifest.json' -Algorithm SHA256).Hash.ToLowerInvariant()
        Write-Host ('==> Uploading one compressed archive ({0:N2} MB)...' -f ((Get-Item -LiteralPath $Archive).Length / 1MB)) -ForegroundColor Cyan
        Invoke-Checked 'scp' ($SshOptions + @($Archive, ($Server + ':' + $RemoteArchive)))

        # A disconnect can leave a partially applied release: do not retry installation automatically.
        $Install = @'
set -eu
cd __REMOTE_DIR__
printf '%s  %s\n' '__ARCHIVE_HASH__' '__ARCHIVE__' | sha256sum -c -
git fetch origin master
test "$(git rev-parse origin/master)" = '__COMMIT__' || { echo 'Revision mismatch: push your commit or rebuild the latest master before deploying.' >&2; exit 1; }
git merge --ff-only origin/master
test "$(git rev-parse HEAD)" = '__COMMIT__' || { echo 'Production revision mismatch.' >&2; exit 1; }
tar -xzf '__ARCHIVE__' -C public
chmod -R 755 public/build
docker cp public/build/. nemix-app-1:/var/www/html/public/build/
docker exec nemix-app-1 chown -R www-data:www-data /var/www/html/public/build
docker exec nemix-app-1 chmod -R 755 /var/www/html/public/build
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan optimize:clear
docker compose exec -T app php artisan permission:cache-reset
docker compose exec -T app php artisan config:cache
docker compose exec -T app php artisan route:cache
docker compose exec -T app php artisan view:cache
docker compose exec -T app php artisan queue:restart
docker exec nemix-app-1 sha256sum /var/www/html/public/build/manifest.json | grep -q '^__MANIFEST_HASH__ ' || { echo 'Container manifest verification failed.' >&2; exit 1; }
rm -f '__ARCHIVE__'
echo DEPLOYMENT_INSTALLED_AND_MANIFEST_VERIFIED
'@
        $Install = $Install.Replace('__REMOTE_DIR__', $RemoteDir).Replace('__ARCHIVE_HASH__', $ArchiveHash).Replace('__ARCHIVE__', $RemoteArchive).Replace('__COMMIT__', $ExpectedCommit).Replace('__MANIFEST_HASH__', $ManifestHash).Replace("`r", '')
        Write-Host '==> Installing, updating Laravel, and verifying assets in one SSH session...' -ForegroundColor Cyan
        Invoke-Checked 'ssh' (@('-T') + $SshOptions + @($Server, $Install))

        Write-Host '==> Checking public login response...' -ForegroundColor Cyan
        $HttpStatus = & curl.exe --fail --silent --show-error --max-time 20 -o NUL -w '%{http_code}' https://unc-nemix.com/login
        if ($LASTEXITCODE -ne 0 -or $HttpStatus -ne '200') {
            throw "Installation completed, but the public health check failed (HTTP $HttpStatus). Verify production before retrying."
        }
        Write-Host ('==> Deployment completed and verified in {0:N1}s.' -f $Timer.Elapsed.TotalSeconds) -ForegroundColor Green
    }
    finally {
        if (Test-Path -LiteralPath $Archive) { Remove-Item -LiteralPath $Archive }
    }
}
finally {
    Pop-Location
}
