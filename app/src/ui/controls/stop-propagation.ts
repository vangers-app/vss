export function stopPropagation(el: HTMLElement) {
    const stop = (e: PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
    };

    const options = {
        capture: false,
    };

    el.addEventListener("pointerdown", stop, options);
    el.addEventListener("pointerup", stop, options);
    el.addEventListener("pointermove", stop, options);
    el.addEventListener("pointercancel", stop, options);

    return () => {
        el.removeEventListener("pointerdown", stop, options);
        el.removeEventListener("pointerup", stop, options);
        el.removeEventListener("pointermove", stop, options);
        el.removeEventListener("pointercancel", stop, options);
    };
}
