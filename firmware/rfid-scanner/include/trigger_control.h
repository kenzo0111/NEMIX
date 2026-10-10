#pragma once
#include <stdint.h>

// Pure button state: one press/release pair per physical hold, with boot-only recovery.
class TriggerControl {
public:
    enum class Event { None, Press, Release, Setup };
    constexpr TriggerControl(bool held=false,uint32_t now=0)
        : raw(held),stable(held),suppress(held),bootRecovery(held),changedAt(now),bootAt(now) {}
    constexpr Event update(bool held,uint32_t now) {
        if(held!=raw) { raw=held; changedAt=now; }
        if(bootRecovery&&held&&stable&&(uint32_t)(now-bootAt)>=8000) {
            bootRecovery=false; return Event::Setup;
        }
        if(raw==stable||(uint32_t)(now-changedAt)<30) return Event::None;
        stable=raw;
        if(suppress) {
            if(!stable) { suppress=false; bootRecovery=false; }
            return Event::None;
        }
        return stable?Event::Press:Event::Release;
    }
    constexpr bool held() const { return stable; }
private:
    bool raw,stable,suppress,bootRecovery;
    uint32_t changedAt,bootAt;
};
