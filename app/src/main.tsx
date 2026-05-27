import { render } from 'preact'
import Vangers from "./vangers.mjs";
import { useEffect, useRef, useState } from 'preact/hooks';
import { installVssBrowser } from "./vss-browser";
import { Frame } from "./ui/frame";
import "./mobile-browser";
import "./index.css";

import { opfsList } from "./opfs-worker";
import { find_steam_install } from './compat';

function App() {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        (async () => {
            // const list = await opfsList("/vss");
            // console.log(list);
            console.log(await find_steam_install());
        })();
    }, []);

    if (!ready) {
        return null;
    }

    return <Game />
}

function Game() {
    const canvas = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (canvas.current) {
            const Module: any = {
                canvas: canvas.current,
                onRuntimeInitialized: () => {
                    console.log("Runtime initialized");
                    installVssBrowser(Module);
                    // Module.callMain(["-vss", "/addon"]);
                    Module.callMain([]);
                }
            };
            Vangers(Module);
        }
    }, [canvas]);

    return <div class="game-root">
        <canvas id="canvas" ref={canvas} width={800} height={600}></canvas>
        <Frame />
    </div>
}

render(<App />, document.getElementById('app')!)
