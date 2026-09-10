// Reusable AudioContext instance for RFID scan chime
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!sharedAudioContext) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
            sharedAudioContext = new AudioCtx();
        }
    }

    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume().catch(() => {
            // Browser autoplay gesture restriction
        });
    }

    return sharedAudioContext;
}

/**
 * Plays a discrete institutional scan chime.
 * Safe against gesture policies without blocking scanner operations.
 */
export function playScanChime(): void {
    try {
        const ctx = getAudioContext();
        if (!ctx || ctx.state !== 'running') return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.12);
    } catch {
        // Suppress audio failure to ensure scanning flow is never interrupted
    }
}
