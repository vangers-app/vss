import { Key } from "./key-control";
import { ScanCode } from "./sdl-scancodes";

import moreUrl from "../../assets/more.png";
import crossUrl from "../../assets/cross.png";
import enterUrl from "../../assets/enter.png";
import stopUrl from "../../assets/stop.png";

import rollLeftUrl from "../../assets/roll-left.png";
import rollRightUrl from "../../assets/roll-right.png";
import flyUrl from "../../assets/copte.png";
import diggUrl from "../../assets/crot.png";
import zoomInUrl from "../../assets/zoom-in.png";
import zoomOutUrl from "../../assets/zoom-out.png";
import optionsUrl from "../../assets/cog.png";


import buggyUrl from "../../assets/jump.png";
import fireUrl from "../../assets/weapon-all.png";
import fire1Url from "../../assets/weapon-1.png";
import fire2Url from "../../assets/weapon-2.png";
import fire3Url from "../../assets/weapon-3.png";
import fireTUrl from "../../assets/terminator.png";
import fireVUrl from "../../assets/vector.png";

import useGlukUrl from "../../assets/gluk.png";
import useVectorUrl from "../../assets/copte-vector.png";
import inventoryUrl from "../../assets/mouse.png";
import compasUrl from "../../assets/compas.png";
import reverseUrl from "../../assets/reverse.png";
import questionUrl from "../../assets/question.png";
import clickUrl from "../../assets/cursor-click.png";
import textUrl from "../../assets/text.png";
import keyUrl from "../../assets/key.png";
import keyOffUrl from "../../assets/key-off.png";
import telegramUrl from "../../assets/telegram.png";

import upUrl from "../../assets/up.png";
import downUrl from "../../assets/down.png";

import chatUrl from "../../assets/chat.png";
import leaderboardUrl from "../../assets/leaderboard.png";
import textInputUrl from "../../assets/text-input.png";
import checkUrl from "../../assets/check.png";
import enUrl from "../../assets/gb.png";
import ruUrl from "../../assets/ru.png";
import fontUrl from "../../assets/font.png";
import mobileUrl from "../../assets/mobile.png";
import calendarUrl from "../../assets/calendar.png";

import { Switch } from "./switch-control";
import { useContext, useEffect, useState } from "preact/hooks";
import { Button } from "./button-control";
import { BridgeContext } from "../bridge";

export function NextSwitch(props: {
    class: string,
    style: JSX.CSSProperties,
    onButtonDown?: () => void,
    onButtonUp?: () => void,
    active: boolean,
}) {
    return <Switch
        class={props.class}
        style={props.style}
        onButtonDown={props.onButtonDown}
        onButtonUp={props.onButtonUp}
        image={moreUrl}
        activeImage={crossUrl}
        active={props.active}
    />;
}

export function RollRight(props: { class: string, style: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_D}
        class={props.class}
        style={props.style}
        image={rollRightUrl} />;
}

export function RollLeft(props: { class: string, style: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_A}
        class={props.class}
        style={props.style}
        image={rollLeftUrl} />;
}

export function Fly(props: { class: string, style: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_R}
        class={props.class}
        style={props.style}
        image={flyUrl} />;
}

export function Digg(props: { class: string, style: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_F}
        class={props.class}
        style={props.style}
        image={diggUrl} />;
}

export function ZoomIn(props: { class: string, style: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_EQUALS}
        repeat={true}
        class={props.class}
        style={props.style}
        image={zoomInUrl} />;
}

export function ZoomOut(props: { class: string, style: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_MINUS}
        repeat={true}
        class={props.class}
        style={props.style}
        image={zoomOutUrl} />;
}

export function Jump(props: { class: string, style?: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_W}
        class={props.class}
        style={props.style}
        image={buggyUrl} />;
}

export function Fire(props: { class?: string, style?: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_E}
        class={props.class}
        style={props.style}
        image={fireUrl} />;
}

export function Fire1(props: { class: string, style: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_1}
        class={props.class}
        style={props.style}
        image={fire1Url} />;
}

export function Fire2(props: { class: string, style: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_2}
        class={props.class}
        style={props.style}
        image={fire2Url} />;
}

export function Fire3(props: { class: string, style: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_3}
        class={props.class}
        style={props.style}
        image={fire3Url} />;
}

export function FireT(props: { class: string, style: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_4}
        class={props.class}
        style={props.style}
        image={fireTUrl} />;
}

export function FireV(props: { class: string, style: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_TAB}
        class={props.class}
        style={props.style}
        image={fireVUrl} />;
}

export function Open(props: { class?: string, style?: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_SPACE}
        class={props.class}
        style={props.style}
        single={true}
        image={enterUrl} />;
}

export function Escape(props: { class?: string, style?: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_ESCAPE}
        class={props.class}
        style={props.style}
        single={true}
        image={optionsUrl} />;
}

export function UseGluk(props: { class: string, style: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_5}
        class={props.class}
        style={props.style}
        single={true}
        image={useGlukUrl} />;
}
export function UseVector(props: { class: string, style: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_V}
        class={props.class}
        style={props.style}
        single={true}
        image={useVectorUrl} />;
}

export function Invetory(props: { buggyIcon?: boolean, class: string, style?: JSX.CSSProperties }) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_RETURN}
        class={props.class}
        style={props.style}
        single={true}
        image={props.buggyIcon === true ? buggyUrl : inventoryUrl} />;
}

export function Reverse(props: {
    class?: string,
    style?: JSX.CSSProperties,
}) {
    const bridge = useContext(BridgeContext);
    return <Button
        class={props.class}
        style={props.style}
        image={reverseUrl}
        onButtonDown={() => bridge.native.onJoystickReverseUpdate(true)}
        onButtonUp={() => bridge.native.onJoystickReverseUpdate(false)}
    />;
}

export function ZoomButton(props: {
    class?: string,
    style?: JSX.CSSProperties,
    zoomIn: boolean,
    onButtonDown?: () => void,
    onButtonUp?: () => void,
}) {
    return <Button
        onButtonDown={props.onButtonDown}
        onButtonUp={props.onButtonUp}
        class={props.class}
        style={props.style}
        image={props.zoomIn ? zoomInUrl : zoomOutUrl}
    />;
}

export function QuestionButton(props: {
    class?: string,
    style?: JSX.CSSProperties,
    onButtonDown?: () => void,
    onButtonUp?: () => void,
}) {
    return <Button
        onButtonDown={props.onButtonDown}
        onButtonUp={props.onButtonUp}
        class={props.class}
        style={props.style}
        image={questionUrl}
    />;
}

export function Handbrake(props: {
    class?: string,
    style?: JSX.CSSProperties,
    onKeyDown?: () => void,
}) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_Q}
        class={props.class}
        style={props.style}
        image={stopUrl}
    />;
}

export function Menu(props: {
    buggyIcon?: boolean,
    class?: string,
    style?: JSX.CSSProperties,
    onKeyDown?: () => void,
}) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_F1}
        class={props.class}
        style={props.style}
        image={props.buggyIcon === true ? buggyUrl : compasUrl}
    />;
}

export function Text(props: {
    buggyIcon?: boolean,
    class?: string,
    style?: JSX.CSSProperties,
    onKeyDown?: () => void,
}) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_TAB}
        class={props.class}
        style={props.style}
        image={textUrl}
    />;
}

export function InventoryUse(props: {
    buggyIcon?: boolean,
    class?: string,
    style?: JSX.CSSProperties,
    onButtonDown?: () => void,
    onButtonUp?: () => void,
}) {
    return <Button
        class={props.class}
        style={props.style}
        image={clickUrl}
        onButtonDown={props.onButtonDown}
        onButtonUp={props.onButtonUp}
    />;
}

export function InappOpen(props: {
    class?: string,
    style?: JSX.CSSProperties,
    onButtonUp?: () => void,
}) {
    const bridge = useContext(BridgeContext);
    const [haveToken, setHaveToken] = useState<boolean | null>(null);
    useEffect(() => {
        bridge.getToken(false)
            .then((token) => {
                setHaveToken(true);
            })
            .catch((error) => {
                setHaveToken(false);
                console.error(error);
            });
    }, []);

    function login() {
        bridge.getToken(true)
            .then((token) => {
                setHaveToken(true);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    if (haveToken !== true) {
        return <Button
            class={props.class + " " + (haveToken === false ? "" : "animate-pulse")}
            style={props.style}
            image={keyOffUrl}
            onButtonUp={login}
        />;
    }

    return <Button
        class={props.class}
        style={props.style}
        image={keyUrl}
        onButtonUp={props.onButtonUp}
    />;
}

export function Telegram(props: {
    class?: string,
    style?: JSX.CSSProperties,
}) {
    const bridge = useContext(BridgeContext);

    function open() {
        bridge.native.openUrl("https://t.me/vangers_app/115");
    }

    return <Button
        class={props.class + " cursor-pointer"}
        style={props.style}
        image={telegramUrl}
        noBackground={false}
        onButtonUp={open}
    />;
}

export function MenuUp(props: { class?: string, style?: JSX.CSSProperties }) {
    const bridge = useContext(BridgeContext);
    return <Button
        onButtonUp={() => bridge.native.menuUp()}
        class={props.class}
        style={props.style}
        image={upUrl} />;
}

export function MenuDown(props: { class?: string, style?: JSX.CSSProperties }) {
    const bridge = useContext(BridgeContext);
    return <Button
        onButtonUp={() => bridge.native.menuDown()}
        class={props.class}
        style={props.style}
        image={downUrl} />;
}

export function MenuActivate(props: {
    class?: string,
    style?: JSX.CSSProperties,
    onButtonUp?: () => void,
}) {
    const bridge = useContext(BridgeContext);
    return <Button
        onButtonUp={() => {
            bridge.native.menuActivate();
            if (props.onButtonUp) {
                props.onButtonUp();
            }
        }}
        class={props.class}
        style={props.style}
        image={checkUrl} />;
}

export function ChatKey(props: {
    open: boolean,
    class?: string,
    style?: JSX.CSSProperties,
    onPress?: () => void,
}) {
    const bridge = useContext(BridgeContext);

    return <Key keyCode={ScanCode.SDL_SCANCODE_F3}
        class={props.class}
        style={props.style}
        single={true}
        beforePress={() => bridge.native.setInputPosition(bridge.rendererHeight - 100)}
        afterPress={props.onPress}
        image={props.open ? crossUrl : chatUrl} />;
}

export function Leaderboard(props: {
    class?: string,
    style?: JSX.CSSProperties,
}) {
    return <Key keyCode={ScanCode.SDL_SCANCODE_S}
        class={props.class}
        style={props.style}
        single={true}
        image={leaderboardUrl} />;
}

export function TextInput(props: {
    class?: string,
    style?: JSX.CSSProperties,
    position: number,
}) {
    const bridge = useContext(BridgeContext);

    return <Button
        class={props.class}
        style={props.style}
        onButtonUp={() => {
            bridge.native.setInputPosition(props.position);
            bridge.native.showInput();
        }}
        image={textInputUrl} />;
}

export function Lang(props: {
    class?: string,
    style?: JSX.CSSProperties,
}) {
    const bridge = useContext(BridgeContext);
    const [langUrl, setLangUrl] = useState<string>(bridge.native.language() === "ru" ? ruUrl : enUrl);

    function toggleLang() {
        setLangUrl(langUrl === ruUrl ? enUrl : ruUrl);
        const newLanguage = langUrl === ruUrl ? "en" : "ru";
        if (newLanguage === "ru") {
            alert("Для приминения изменений перезагрузите игру");
        } else {
            alert("To apply changes restart the game");
        }
        bridge.native.setLanguage(newLanguage);
    }

    return <Button
        class={props.class + " cursor-pointer"}
        style={props.style}
        image={langUrl}
        noBackground={false}
        onButtonUp={toggleLang}
    />;
}

export function SizeToggle(props: { class?: string, style?: JSX.CSSProperties }) {
    const bridge = useContext(BridgeContext);

    function onToggle() {
        bridge.toggleSize();
    }

    return <Button
        onButtonUp={onToggle}
        class={props.class}
        style={props.style}
        image={fontUrl} />;
}

export function MobileButton(props: {
    class?: string,
    style?: JSX.CSSProperties,
    onButtonDown?: () => void,
    onButtonUp?: () => void,
}) {
    return <Button
        onButtonDown={props.onButtonDown}
        onButtonUp={props.onButtonUp}
        class={props.class}
        style={props.style}
        image={mobileUrl}
    />;
}


export function CalendarButton(props: {
    class?: string,
    style?: JSX.CSSProperties,
    onButtonDown?: () => void,
    onButtonUp?: () => void,
}) {
    return <Button
        onButtonDown={props.onButtonDown}
        onButtonUp={props.onButtonUp}
        class={props.class}
        style={props.style}
        image={calendarUrl}
    />;
}