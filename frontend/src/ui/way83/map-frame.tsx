import { useContext, useEffect, useRef } from "preact/hooks";
import { fromHex } from "../../encoder";
import { mapFrame } from "../../frame-info";
import { BridgeContext } from "../bridge";

const aspect = mapFrame.width / mapFrame.height;

export function MapFrame(props: {}) {
    const bridge = useContext(BridgeContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef === null || canvasRef.current === null) {
            return;
        }

        let live = true;
        const canvas = canvasRef.current;
        canvas.width = mapFrame.width;
        canvas.height = mapFrame.height;
        function update() {
            const data = new Uint8ClampedArray(fromHex(bridge.native.getMapFrame()));
            canvas.getContext("2d")?.putImageData(
                new ImageData(data, mapFrame.width, mapFrame.height), 0, 0);
            if (live) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);

        return () => {
            live = false;
        };
    }, [bridge, canvasRef]);

    const canvasHeight = innerHeight;
    const canvasWidth = canvasHeight * aspect;
    const canvasTop = (innerHeight - canvasHeight) / 2;

    return <div class="w-full h-full">
        <canvas ref={canvasRef} class="absolute cl-0 hard-shadow" style={{
            top: canvasTop + "px",
            width: canvasWidth + "px",
            height: canvasHeight + "px",
            borderTopRightRadius: "25%",
            borderBottomRightRadius: "25%",
        }}></canvas>
    </div>;
}
