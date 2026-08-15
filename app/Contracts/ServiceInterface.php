<?php

namespace App\Contracts;

interface ServiceInterface
{
    /**
     * Execute the service operation.
     *
     * @param mixed ...$args
     * @return mixed
     */
    public function execute(...$args);
}
