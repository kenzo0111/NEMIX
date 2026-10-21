<?php
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
try { $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); echo "Boot OK\n"; }
catch (Throwable $e) { echo get_class($e).': '.$e->getMessage()."\n".$e->getTraceAsString(); }
