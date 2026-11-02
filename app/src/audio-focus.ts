// Suspends every AudioContext while the page is hidden. The emscripten main
// loop stops with requestAnimationFrame in the background, but SDL's
// ScriptProcessorNode keeps pulling the audio callback, so music would go on
// playing after the app is sent to the background on Android.
export function installAudioFocus() {
    const contexts: AudioContext[] = [];
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = class extends NativeAudioContext {
        constructor(options?: AudioContextOptions) {
            super(options);
            contexts.push(this);
        }
    };
    document.addEventListener("visibilitychange", () => {
        for (const context of contexts) {
            (document.hidden ? context.suspend() : context.resume()).catch((error) => {
                console.error("Failed to switch audio context", error);
            });
        }
    });
}
