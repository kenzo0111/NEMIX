<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Modules\AuditLogs\Models\TransactionTrail;
use Symfony\Component\Process\Process;

class RestoreDatabase extends Command
{
    protected $signature = 'system:restore-database {backup : Filename of a compressed backup in private storage} {--force : Skip the interactive confirmation}';
    protected $description = 'Restore a database from a verified compressed private backup';

    public function handle(): int
    {
        $directory = realpath(storage_path('app/private/backups'));
        $path = realpath(storage_path('app/private/backups/'.basename((string) $this->argument('backup'))));
        if (! $directory || ! $path || ! str_starts_with($path, $directory.DIRECTORY_SEPARATOR) || ! is_file($path)) {
            $this->error('Backup file was not found in the private backups directory.');
            return self::FAILURE;
        }
        if (! str_ends_with($path, '.gz')) {
            $this->error('Only compressed database backups created by SupplySync can be restored.');
            return self::FAILURE;
        }

        $database = config('database.connections.'.config('database.default'), []);
        $driver = $database['driver'] ?? null;
        $isSqlite = str_ends_with($path, '.sqlite.gz');
        if (($driver === 'sqlite') !== $isSqlite || ! in_array($driver, ['sqlite', 'mysql', 'mariadb', 'pgsql'], true)) {
            $this->error('Backup format does not match the configured database driver.');
            return self::FAILURE;
        }

        if (! $this->option('force') && ! $this->confirm('This replaces the current database. A pre-restore backup will be created. Continue?', false)) {
            return self::SUCCESS;
        }
        if ($this->call('system:backup-database') !== self::SUCCESS) {
            $this->error('Could not create a pre-restore backup; restore cancelled.');
            return self::FAILURE;
        }

        $temporary = $directory.DIRECTORY_SEPARATOR.'.restore-'.bin2hex(random_bytes(8)).($isSqlite ? '.sqlite' : '.sql');
        if (! $this->decompress($path, $temporary)) {
            @unlink($temporary);
            $this->audit(basename($path), 'Failed', 'Backup decompression or integrity check failed.');
            $this->error('The backup could not be decompressed or did not pass integrity checks.');
            return self::FAILURE;
        }

        try {
            $ok = $isSqlite
                ? $this->restoreSqlite($temporary, (string) ($database['database'] ?? ''))
                : $this->restoreSqlDump($temporary, $driver, $database);
        } catch (\Throwable $e) {
            Log::error('Database restore failed.', ['error' => $e->getMessage()]);
            $ok = false;
        } finally {
            @unlink($temporary);
        }

        $this->audit(basename($path), $ok ? 'Success' : 'Failed', $ok ? 'Restored database from a verified backup.' : 'Database restore failed.');
        if (! $ok) {
            $this->error('Database restore failed. Review application logs and the pre-restore backup before retrying.');
            return self::FAILURE;
        }
        $this->info('Database restored. Restart long-running workers and verify application health before reopening service.');
        return self::SUCCESS;
    }

    private function decompress(string $source, string $destination): bool
    {
        $input = gzopen($source, 'rb');
        $output = fopen($destination, 'xb');
        if (! $input || ! $output) {
            if (is_resource($input)) gzclose($input);
            if (is_resource($output)) fclose($output);
            return false;
        }
        $valid = true;
        while (! gzeof($input)) {
            $chunk = gzread($input, 1024 * 1024);
            if ($chunk === false || fwrite($output, $chunk) === false) { $valid = false; break; }
        }
        $valid = gzclose($input) && $valid;
        fclose($output);
        chmod($destination, 0600);
        return $valid;
    }

    private function restoreSqlite(string $snapshot, string $databasePath): bool
    {
        if ($databasePath === ':memory:' || ! is_file($databasePath)) return false;
        $check = new \PDO('sqlite:'.$snapshot);
        if ($check->query('PRAGMA integrity_check')->fetchColumn() !== 'ok') return false;
        unset($check);
        // handle() creates a compressed, retained pre-restore database backup
        // before reaching this replacement step.
        \Illuminate\Support\Facades\DB::purge();
        $displaced = $databasePath.'.replaced-'.now()->format('Ymd-His').'-'.bin2hex(random_bytes(3));
        if (! rename($databasePath, $displaced)) return false;
        if (! rename($snapshot, $databasePath)) {
            @rename($displaced, $databasePath);
            return false;
        }
        @unlink($displaced);
        return true;
    }

    private function restoreSqlDump(string $sqlFile, string $driver, array $database): bool
    {
        $env = getenv();
        if (! is_array($env)) $env = [];
        $args = $driver === 'pgsql'
            ? ['psql', '--set=ON_ERROR_STOP=1', '--host='.($database['host'] ?? 'localhost'), '--port='.(string) ($database['port'] ?? 5432), '--username='.($database['username'] ?? ''), $database['database'] ?? '']
            : ['mysql', '--host='.($database['host'] ?? 'localhost'), '--port='.(string) ($database['port'] ?? 3306), '--user='.($database['username'] ?? ''), $database['database'] ?? ''];
        $password = (string) ($database['password'] ?? '');
        if ($password !== '') $env[$driver === 'pgsql' ? 'PGPASSWORD' : 'MYSQL_PWD'] = $password;
        $process = new Process($args, null, $env);
        $stream = fopen($sqlFile, 'rb');
        if (! $stream) return false;
        $process->setInput($stream);
        $code = $process->run();
        fclose($stream);
        if ($code !== 0) Log::error('Database SQL restore process failed.', ['error' => trim($process->getErrorOutput())]);
        return $code === 0;
    }

    private function audit(string $reference, string $status, string $details): void
    {
        try {
            $operator = getenv('SUDO_USER') ?: get_current_user();
            TransactionTrail::create([
                'user_id' => null,
                'module' => 'Administration',
                'action' => 'Database Restore',
                'resource_ref' => $reference,
                'details' => $details.' CLI operator: '.$operator.'.',
                'status' => $status,
                'event_key' => 'system.backup.database.restore',
                'is_parent' => true,
                'metadata' => ['operator' => $operator, 'interface' => 'CLI'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Could not write database restore audit event.', ['error' => $e->getMessage()]);
        }
    }
}
