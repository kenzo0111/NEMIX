#include "../include/reader_health.h"
constexpr bool transportRecovery() {
    ReaderHealth health;
    health.transportFailure(false); health.transportFailure(true);
    if(health.needsRecovery()) return false;
    health.transportFailure(false);
    if(!health.needsRecovery()) return false;
    health.response(123);
    return !health.needsRecovery()&&health.responses==1&&health.timeouts==2&&health.invalidFrames==1;
}
constexpr bool noTagRemainsHealthy() {
    ReaderHealth health;
    for(int i=0;i<10;++i) { health.response(i); health.error(0x15); }
    return !health.needsRecovery()&&health.tags==0&&health.readerErrors==10;
}
static_assert(transportRecovery(),"Repeated UART failures require recovery; a valid reply restores transport health");
static_assert(noTagRemainsHealthy(),"Valid no-tag responses must not trigger reader recovery");
