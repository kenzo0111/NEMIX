#pragma once
#include <stdint.h>

// Communication health is independent of whether a tag happens to be present.
struct ReaderHealth {
    uint32_t responses=0,tags=0,timeouts=0,invalidFrames=0,readerErrors=0;
    uint32_t consecutiveFailures=0,lastResponseMs=0,lastTagMs=0;
    int lastError=-1;
    constexpr void response(uint32_t now) {
        ++responses; consecutiveFailures=0; lastResponseMs=now;
    }
    constexpr void failure(bool timeout) {
        if(timeout) ++timeouts; else ++invalidFrames;
        if(consecutiveFailures<3) ++consecutiveFailures;
    }
    constexpr void error(uint8_t code) { ++readerErrors; lastError=code; }
    constexpr void tag(uint32_t now) { ++tags; lastTagMs=now; }
    constexpr bool needsRecovery() const { return consecutiveFailures>=3; }
};
