import { useContext, useEffect, useRef } from "preact/hooks";
import { fromHex } from "../../encoder";
import { pauseFrame } from "../../frame-info";
import { BridgeContext } from "../bridge";
import { bindFrameMouseControl } from "../controls/mouse";

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

        const unbind = bindFrameMouseControl(canvas, bridge, () => ({
            x: (bridge.rendererWidth - pauseFrame.width) / 2,
            y: (bridge.rendererHeight - pauseFrame.height) / 2,
        }), pauseFrame);

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
