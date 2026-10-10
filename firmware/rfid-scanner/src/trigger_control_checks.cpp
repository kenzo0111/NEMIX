#include "../include/trigger_control.h"

// Compile-time regression checks exercise the actual production controller.
constexpr bool normalHold() {
    TriggerControl trigger;
    if(trigger.update(true,100)!=TriggerControl::Event::None) return false;
    if(trigger.update(true,130)!=TriggerControl::Event::Press) return false;
    if(trigger.update(true,20000)!=TriggerControl::Event::None) return false;
    if(trigger.update(false,20001)!=TriggerControl::Event::None) return false;
    return trigger.update(false,20031)==TriggerControl::Event::Release;
}
constexpr bool bounce() {
    TriggerControl trigger;
    trigger.update(true,100); trigger.update(false,110); trigger.update(true,120);
    if(trigger.update(true,149)!=TriggerControl::Event::None) return false;
    if(trigger.update(true,150)!=TriggerControl::Event::Press) return false;
    trigger.update(false,160); trigger.update(true,170);
    return trigger.update(true,200)==TriggerControl::Event::None;
}
constexpr bool bootSetup() {
    TriggerControl trigger(true,100);
    if(trigger.update(true,8099)!=TriggerControl::Event::None) return false;
    if(trigger.update(true,8100)!=TriggerControl::Event::Setup) return false;
    if(trigger.update(true,20000)!=TriggerControl::Event::None) return false;
    trigger.update(false,20001);
    if(trigger.update(false,20031)!=TriggerControl::Event::None) return false;
    trigger.update(true,20100);
    return trigger.update(true,20130)==TriggerControl::Event::Press;
}
constexpr bool earlyBootRelease() {
    TriggerControl trigger(true,100);
    trigger.update(false,200);
    if(trigger.update(false,230)!=TriggerControl::Event::None) return false;
    trigger.update(true,300);
    return trigger.update(true,330)==TriggerControl::Event::Press&&
        trigger.update(true,10000)==TriggerControl::Event::None;
}
constexpr bool timerWrap() {
    TriggerControl trigger(false,0xfffffff0);
    trigger.update(true,0xfffffff5);
    return trigger.update(true,19)==TriggerControl::Event::Press;
}
static_assert(normalHold(),"Long normal holds must scan once and never open setup");
static_assert(bounce(),"Contact bounce must not generate additional trigger presses");
static_assert(bootSetup(),"Boot recovery must open once and suppress the release scan");
static_assert(earlyBootRelease(),"Releasing the boot gesture must restore normal triggering");
static_assert(timerWrap(),"Debouncing must survive millis rollover");
