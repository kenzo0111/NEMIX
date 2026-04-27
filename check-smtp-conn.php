<?php
var_dump(extension_loaded('openssl'));
$errorNumber = 0;
$errorString = '';
$socket = @fsockopen('smtp.gmail.com', 587, $errorNumber, $errorString, 5);
var_dump($socket !== false);
echo 'errstr: ' . $errorString . ' err: ' . $errorNumber . PHP_EOL;
if ($socket) {
    fclose($socket);
}
