import { useContext, useEffect, useRef } from "preact/hooks";
import { fromHex } from "../../encoder";
import { pauseFrame } from "../../frame-info";
import { BridgeContext } from "../bridge";
import { bindMouseControl } from "../controls/mouse";

const aspect = pauseFrame.width / pauseFrame.height;

export function PauseFrame(props: {}) {
    const bridge = useContext(BridgeContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef === null || canvasRef.current === null) {
            return;
        }

        let live = true;
        const canvas = canvasRef.current;
        const frameStartX = (bridge.rendererWidth - pauseFrame.width) / 2;
        const frameStartY = (bridge.rendererHeight - pauseFrame.height) / 2;
        canvas.width = pauseFrame.width;
        canvas.height = pauseFrame.height;

        function update() {
            const data = new Uint8ClampedArray(fromHex(bridge.native.getPauseFrame()));
            canvas.getContext("2d")?.putImageData(
                new ImageData(data, pauseFrame.width, pauseFrame.height), 0, 0);
            if (live) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);

        const unbind = bindMouseControl(canvas, bridge, (pageX, pageY) => {
            const scale = bridge.rendererHeight / pauseFrame.height;
            const rect = canvas.getBoundingClientRect();
            const { x: pageOffsetX, y: pageOffsetY } =
                bridge.rendererToPage(frameStartX, frameStartY);
            return bridge.map2Window(
                bridge.windowOffsetX / bridge.pageScaleX + pageOffsetX + (pageX - rect.left) / scale,
                pageOffsetY + (pageY - rect.top) / scale,
            );
        });

        return () => {
            live = false;
            unbind();
        };
    }, [bridge, canvasRef]);

    const canvasHeight = innerHeight;
    const canvasWidth = innerHeight * aspect;
    const left = (innerWidth - canvasWidth) / 2;

    return <div class="w-full h-full">
        <canvas ref={canvasRef} class="absolute ct-0 hard-shadow" style={{
            left: left + "px",
            width: canvasWidth + "px",
            height: canvasHeight + "px",
            borderRadius: "100%",
        }}></canvas>
    </div>;
}
