import { Button } from "./button-control";

export function Switch(props: {
    class?: string,
    style?: string | JSX.CSSProperties,
    image?: string,
    activeImage?: string,
    onButtonDown?: () => void,
    onButtonUp?: () => void,
    active: boolean,
}) {
    return <Button
        class={props.class}
        style={props.style}
        image={props.active ? props.activeImage : props.image}
        onButtonDown={props.onButtonDown}
        onButtonUp={props.onButtonUp}
    />;
}
