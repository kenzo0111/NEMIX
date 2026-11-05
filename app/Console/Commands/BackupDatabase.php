<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\AuditLogs\Models\TransactionTrail;
use Symfony\Component\Process\Process;

class BackupDatabase extends Command
{
    protected $signature = 'system:backup-database {--retention=30 : Number of days to retain database backups}';
    protected $description = 'Create a compressed database backup in private application storage';

    public function handle(): int
    {
        $connectionName = config('database.default');
        $connection = config("database.connections.{$connectionName}", []);
        $driver = $connection['driver'] ?? null;
        $directory = storage_path('app/private/backups');
        if (! is_dir($directory) && ! mkdir($directory, 0700, true) && ! is_dir($directory)) {
            $this->error('Could not create the private backup directory.');
            return self::FAILURE;
        }
        @chmod($directory, 0700);

        $extension = $driver === 'sqlite' ? 'sqlite.gz' : 'sql.gz';
        $path = $directory.DIRECTORY_SEPARATOR.'supply-sync-'.now()->format('Ymd-His').'.'.$extension;
        $ok = match ($driver) {
            'sqlite' => $this->backupSqlite((string) ($connection['database'] ?? ''), $path),
            'pgsql' => $this->backupWithProcess($this->postgresCommand($connection), $path, $this->processEnvironment($connection, 'pgsql')),
            'mysql', 'mariadb' => $this->backupWithProcess($this->mysqlCommand($connection), $path, $this->processEnvironment($connection, 'mysql')),
            default => false,
        };

        if (! $ok) {
            @unlink($path);
            $this->audit('Database Backup Failed', null, 'Failed to create a database backup.', 'Failed');
            $this->error("Backup failed for database driver [{$driver}]. Ensure its native dump utility is installed and configured.");
            return self::FAILURE;
        }

        chmod($path, 0600);
        $this->audit('Database Backup Created', basename($path), 'Created a compressed database backup.', 'Success');
        $this->pruneOldBackups(max(1, (int) $this->option('retention')));
        $this->info('Database backup created: '.basename($path));
        return self::SUCCESS;
    }

    private function backupSqlite(string $databasePath, string $destination): bool
    {
        if ($databasePath !== ':memory:' && ! is_file($databasePath)) return false;
        $snapshotPath = $destination.'.sqlite';
        try {
            $pdo = DB::connection()->getPdo();
            $pdo->exec('VACUUM INTO '.$pdo->quote($snapshotPath));
        } catch (\Throwable $e) {
            Log::error('SQLite database snapshot failed.', ['error' => $e->getMessage()]);
            @unlink($snapshotPath);
            return false;
        }
        $source = fopen($snapshotPath, 'rb');
        $target = gzopen($destination, 'wb6');
        if (! $source || ! $target) {
            if (is_resource($source)) fclose($source);
            if (is_resource($target)) gzclose($target);
            @unlink($snapshotPath);
            return false;
        }
        while (! feof($source)) {
            $chunk = fread($source, 1024 * 1024);
            if ($chunk === false || gzwrite($target, $chunk) === false) {
                fclose($source); gzclose($target); @unlink($snapshotPath); return false;
            }
        }
        fclose($source);
        $closed = gzclose($target);
        @unlink($snapshotPath);
        return $closed;
    }

    private function backupWithProcess(array $command, string $destination, array $environment): bool
    {
        $gzip = gzopen($destination, 'wb6');
        if (! $gzip) return false;
        $process = new Process($command, null, $environment, null, null);
        $exitCode = $process->run(function (string $type, string $buffer) use ($gzip) {
            if ($type === Process::OUT && gzwrite($gzip, $buffer) === false) {
                throw new \RuntimeException('Could not write database dump to compressed backup.');
            }
        });
        $closed = gzclose($gzip);
        if ($exitCode !== 0) {
            Log::error('Database backup process failed.', ['error' => trim($process->getErrorOutput())]);
            return false;
        }
        return $closed;
    }

    private function postgresCommand(array $c): array
    {
        return array_values(array_filter([
            'pg_dump', '--no-owner', '--no-acl', '--clean', '--if-exists', '--format=plain',
            '--host='.($c['host'] ?? 'localhost'), '--port='.(string) ($c['port'] ?? 5432),
            '--username='.($c['username'] ?? ''), $c['database'] ?? null,
        ], fn ($part) => $part !== null));
    }

    private function mysqlCommand(array $c): array
    {
        return array_values(array_filter([
            'mysqldump', '--single-transaction', '--routines', '--triggers', '--hex-blob', '--add-drop-table',
            '--host='.($c['host'] ?? 'localhost'), '--port='.(string) ($c['port'] ?? 3306),
            '--user='.($c['username'] ?? ''), $c['database'] ?? null,
        ], fn ($part) => $part !== null));
    }

    private function processEnvironment(array $c, string $driver): array
    {
        $env = getenv();
        if (! is_array($env)) $env = [];
        $password = (string) ($c['password'] ?? '');
        if ($driver === 'pgsql' && $password !== '') $env['PGPASSWORD'] = $password;
        if ($driver === 'mysql' && $password !== '') $env['MYSQL_PWD'] = $password;
        return $env;
    }

    private function pruneOldBackups(int $retentionDays): void
    {
        $cutoff = now()->subDays($retentionDays)->getTimestamp();
        foreach (glob(storage_path('app/private/backups/supply-sync-*')) ?: [] as $file) {
            if (is_file($file) && filemtime($file) < $cutoff) @unlink($file);
        }
    }

    private function audit(string $action, ?string $reference, string $details, string $status): void
    {
        try {
            $operator = getenv('SUDO_USER') ?: get_current_user();
            TransactionTrail::create([
                'user_id' => null,
                'module' => 'Administration',
                'action' => $action,
                'resource_ref' => $reference ?? 'DATABASE-BACKUP',
                'details' => $details.' CLI operator: '.$operator.'.',
                'status' => $status,
                'event_key' => 'system.backup.database',
                'is_parent' => true,
                'metadata' => ['operator' => $operator, 'interface' => 'CLI'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Could not write database backup audit event.', ['error' => $e->getMessage()]);
        }
    }
}
