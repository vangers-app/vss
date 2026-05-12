import { useState, useRef, useEffect } from "preact/hooks";

export function usePropsRef<T>(value: T) {
    const ref = useRef<T>(value);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref;
}

export function useStateRef<T>(initialValue: T) {
    const [value, setValue] = useState<T>(initialValue);

    const ref = useRef<T>(value);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return [value, setValue, ref];
}
