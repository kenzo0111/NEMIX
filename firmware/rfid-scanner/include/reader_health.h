#pragma once
#include <stdint.h>

// A valid reply (including no-tag) proves transport is responding.
struct ReaderHealth {
    uint32_t responses=0,tags=0,timeouts=0,invalidFrames=0,readerErrors=0;
    uint32_t lastResponse=0,lastTag=0;
    int lastError=-1;
    uint8_t failures=0;
    constexpr void transportFailure(bool invalid) {
        if(invalid) ++invalidFrames; else ++timeouts;
        if(failures<3) ++failures;
    }
    constexpr void response(uint32_t now) { ++responses; lastResponse=now; failures=0; }
    constexpr void tag(uint32_t now) { ++tags; lastTag=now; lastError=-1; }
    constexpr void error(uint8_t code) { ++readerErrors; lastError=code; }
    constexpr bool needsRecovery() const { return failures>=3; }
};
