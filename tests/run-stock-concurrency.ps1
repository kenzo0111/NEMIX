$ErrorActionPreference = 'Stop'
# Only the dedicated loopback database is used. The test class checks this before migrate:fresh.
$env:APP_ENV = 'testing'
$env:DB_CONNECTION = 'pgsql'
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '55439'
$env:DB_DATABASE = 'supplysync_stock_tests'
$env:DB_USERNAME = 'Ramil'
$env:DB_PASSWORD = ''
$env:CACHE_STORE = 'array'
$env:SESSION_DRIVER = 'array'
$env:QUEUE_CONNECTION = 'sync'
$env:MAIL_MAILER = 'array'
$env:BCRYPT_ROUNDS = '4'
& python tests/concurrency_stock.py
exit $LASTEXITCODE
