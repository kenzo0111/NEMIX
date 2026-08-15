<?php

namespace App\Contracts;

interface DTOInterface
{
    /**
     * Create DTO from array data.
     * @param array $data
     * @return static
     */
    public static function fromArray(array $data);
}
