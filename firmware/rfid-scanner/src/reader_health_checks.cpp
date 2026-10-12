#include "../include/reader_health.h"

constexpr bool missingReaderRecovers() {
    ReaderHealth health;
    health.failure(true); health.failure(false);
    if(health.needsRecovery()) return false;
    health.failure(true);
    if(!health.needsRecovery()||health.timeouts!=2||health.invalidFrames!=1) return false;
    health.response(400);
    return !health.needsRecovery()&&health.responses==1&&health.lastResponseMs==400;
}
constexpr bool noTagIsNotCommunicationFailure() {
    ReaderHealth health;
    for(int i=0;i<10;++i) { health.response(i); health.error(0x15); }
    return !health.needsRecovery()&&health.tags==0&&health.readerErrors==10&&health.lastError==0x15;
}
static_assert(missingReaderRecovers(),"Missing/invalid UART responses must trigger and clear recovery");
static_assert(noTagIsNotCommunicationFailure(),"A valid no-tag response must not power-cycle the reader");
