import { state } from "./state";
import { menuFrame, pauseFrame, mapFrame, shopFrame } from "./frame-info";
import ui from "./ui";
import vss from "./vss";

export function init() {
    const menuFrameData = new Uint8Array(menuFrame.width * menuFrame.height * 4);
    const pauseFrameData = new Uint8Array(pauseFrame.width * pauseFrame.height * 4);
    const mapFrameData = new Uint8Array(mapFrame.width * mapFrame.height * 4);
    const shopFrameData = new Uint8Array(shopFrame.width * shopFrame.height * 4);

    function getRgbaData(frame: Uint8Array,
                         frameWidth: number,
                         startX: number,
                         startY: number,
                         width: number,
                         height: number,
                         rgbaData: Uint8Array) {
        ui.lockFrames();
        vss.getRgbaData(frame, frameWidth, startX, startY, width, height, rgbaData);
        ui.unlockFrames();
    };

    ui.registerFramesData(menuFrameData, pauseFrameData, mapFrameData, shopFrameData);

    vss.addQuantListener("frame", (payload) => {
        if (state().uiType === "menu") {
            const { frame, width, height } = payload;
            { // menu
                const clipWidth = menuFrame.width;
                const clipHeight = menuFrame.height;
                getRgbaData(frame, width,
                    width - clipWidth, menuFrame.top, clipWidth, clipHeight,
                    menuFrameData);
            }

            { // map
                const clipWidth = mapFrame.width;
                const clipHeight = mapFrame.height;
                getRgbaData(frame, width,
                    width - clipWidth, height - clipHeight - mapFrame.bottom, clipWidth, clipHeight,
                    mapFrameData);
            }
        } else if (state().uiType === "shop") {
            const { frame, width } = payload;
            const clipWidth = shopFrame.width;
            const clipHeight = shopFrame.height;
            getRgbaData(frame, width,
                shopFrame.left, shopFrame.top, clipWidth, clipHeight,
                shopFrameData);
        } else if (state().uiType === "pause") {
            const { frame, width, height } = payload;
            const clipWidth = pauseFrame.width;
            const clipHeight = pauseFrame.height;
            const clipLeft = (width - clipWidth) / 2;
            const clipTop = (height - clipHeight) / 2;
            getRgbaData(frame, width,
                clipLeft, clipTop, clipWidth, clipHeight,
                pauseFrameData);
        }
    });
}
