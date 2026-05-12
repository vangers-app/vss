import { render } from 'preact'
import Vangers from "./vangers.mjs";
import { useEffect, useRef } from 'preact/hooks';
import { installVssBrowser } from "./vss-browser";


function App() {
    const canvas = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (canvas.current) {
            const Module: any = {
                canvas: canvas.current,
                onRuntimeInitialized: () => {
                    console.log("Runtime initialized");
                    installVssBrowser(Module);
                    Module.callMain(["-vss", "/addon"]);
                }
            };
            Vangers(Module);
        }
    }, [canvas]);
    return <div>
        <canvas id="canvas" ref={canvas} width={800} height={600}></canvas>
    </div>
}

render(<App />, document.getElementById('app')!)
