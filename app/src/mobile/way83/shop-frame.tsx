import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { shopFrame } from "../../frame-info";
import { BridgeContext } from "../bridge";
import { InappOpen, QuestionButton, ZoomButton } from "../controls/keys";
import { bindMouseControl } from "../controls/mouse";
import { fromHex } from "../../encoder";
import { UIType } from "../api";

const aspect = shopFrame.width / shopFrame.height;

export function ShopFrame(props: { setUiType: (uiType: UIType) => void}) {
    const bridge = useContext(BridgeContext);
    const rootRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [zoomed, setZoomed] = useState<boolean>(false);

    useEffect(() => {
        if (canvasRef === null || canvasRef.current === null) {
            return;
        }

        let live = true;
        const canvas = canvasRef.current;
        const frameStartX = shopFrame.left;
        const frameStartY = shopFrame.top;
        canvas.width = shopFrame.width;
        canvas.height = shopFrame.height;

        function update() {
            if (!live) {
                return;
            }

            if (canvas.classList.contains("hidden")) {
                requestAnimationFrame(update);
                return;
            }

            const data = new Uint8ClampedArray(fromHex(bridge.native.getShopFrame()));
            canvas.getContext("2d")?.putImageData(
                new ImageData(data, shopFrame.width, shopFrame.height), 0, 0);
            requestAnimationFrame(update);
        }

        requestAnimationFrame(update);

        const unbind = bindMouseControl(canvas, bridge, (pageX, pageY) => {
            const scale = bridge.rendererHeight / shopFrame.height;
            const { x: pageOffsetX, y: pageOffsetY } =
                bridge.rendererToPage(frameStartX, frameStartY);
            return bridge.map2Window(
                bridge.windowOffsetX / bridge.pageScaleX * bridge.scaledRendererScale +
                pageOffsetX * bridge.scaledRendererScale +
                pageX / scale * bridge.scaledRendererScale,

                pageOffsetY * bridge.scaledRendererScale +
                pageY / scale * bridge.scaledRendererScale,

                false);
        });

        return () => {
            live = false;
            unbind();
        };
    }, [bridge, canvasRef]);

    useEffect(() => {
        if (rootRef === null || rootRef.current === null) {
            return;
        }

        return bindMouseControl(rootRef.current, bridge);
    }, [bridge, rootRef]);

    const canvasHeight = innerHeight;
    const canvasWidth = innerHeight * aspect;
    const left = 0;

    return <div class="w-full h-full" ref={rootRef}>
        <canvas ref={canvasRef} class={"absolute ct-0 " + (zoomed ? "" : "hidden")}
            style={{
                left: left + "px",
                width: canvasWidth + "px",
                height: canvasHeight + "px",
            }}></canvas>
        <QuestionButton
            onButtonUp={() => bridge.native.toggleShopAvi()}
            class="absolute cl-0 cb-2" />
        <ZoomButton
            onButtonUp={() => setZoomed( !zoomed)}
            zoomIn={!zoomed}
            class="absolute cl-0 cb-0" />
        <InappOpen class="absolute cl-0 ct-0" onButtonUp={() => props.setUiType("inapp")} />
    </div >;
}
