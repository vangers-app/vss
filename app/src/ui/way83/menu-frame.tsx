import { useContext, useEffect, useRef } from "preact/hooks";
import { fromHex } from "../../encoder";
import { menuFrame } from "../../frame-info";
import { BridgeContext } from "../bridge";
import { bindMouseControl } from "../controls/mouse";

const aspect = menuFrame.width / menuFrame.height;

export function MenuFrame(props: {}) {
    const bridge = useContext(BridgeContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef === null || canvasRef.current === null) {
            return;
        }

        let live = true;
        const canvas = canvasRef.current;
        const frameStartX = bridge.rendererWidth - menuFrame.width;
        const frameStartY = menuFrame.top;
        canvas.width = menuFrame.width;
        canvas.height = menuFrame.height;
        function update() {
            const data = new Uint8ClampedArray(fromHex(bridge.native.getMenuFrame()));
            canvas.getContext("2d")?.putImageData(
                new ImageData(data, menuFrame.width, menuFrame.height), 0, 0);
            if (live) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);

        const unbind = bindMouseControl(canvas, bridge, (pageX, pageY) => {
            const scale = bridge.rendererHeight/ menuFrame.height;
            const rect = canvas.getBoundingClientRect();
            const { x: pageOffsetX, y: pageOffsetY } = bridge.rendererToPage(frameStartX, frameStartY);
            return bridge.map2Window(
                pageOffsetX + (pageX - rect.left) / scale,
                pageOffsetY + (pageY - rect.top) / scale,
            );
        });

        return () => {
            live = false;
            unbind();
        };
    }, [bridge, canvasRef]);

    const canvasHeight = innerHeight;
    const canvasWidth = canvasHeight * aspect;
    const canvasTop = (innerHeight - canvasHeight) / 2;

    return <div class="w-full h-full">
        <canvas ref={canvasRef} class="absolute cr-0 hard-shadow" style={{
            top: canvasTop + "px",
            width: canvasWidth + "px",
            height: canvasHeight + "px",
            borderTopLeftRadius: "25%",
            borderBottomLeftRadius: "25%",
        }}></canvas>
    </div>;
}
