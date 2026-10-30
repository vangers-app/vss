import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { shopFrame } from "../../frame-info";
import { BridgeContext } from "../bridge";
import { QuestionButton, ZoomButton } from "../controls/keys";
import { bindFrameMouseControl, bindMouseControl } from "../controls/mouse";
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

        const unbind = bindFrameMouseControl(canvas, bridge,
            () => ({ x: shopFrame.left, y: shopFrame.top }), shopFrame);

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
    </div >;
}
