export function renderCellStyle(pageWidth: number, pageHeight: number, cellCount: number, scale: number) {
    const cellSizeInPx = Math.floor(Math.min(pageWidth / cellCount, pageHeight / cellCount)) * scale;
    let css = "";

    for (let cell = -1; cell < cellCount; ++cell) {
        css += `
.cl-${cell + 1} {
    left: ${(cell + 1) * cellSizeInPx}px;
}
.cl-${cell + 1}\\.5 {
    left: ${(cell + 1.5) * cellSizeInPx}px;
}
.cr-${cell + 1} {
    right: ${(cell + 1) * cellSizeInPx}px;
}
.cr-${cell + 1}\\.5 {
    right: ${(cell + 1.5) * cellSizeInPx}px;
}
.ct-${cell + 1} {
    top: ${(cell + 1) * cellSizeInPx}px;
}
.ct-${cell + 1}\\.5 {
    top: ${(cell + 1.5) * cellSizeInPx}px;
}
.cb-${cell + 1} {
    bottom: ${(cell + 1) * cellSizeInPx}px;
}
.cb-${cell + 1}\\.5 {
    bottom: ${(cell + 1.5) * cellSizeInPx}px;
}
.cw-${cell + 1} {
    width: ${(cell + 1) * cellSizeInPx}px;
}
.ch-${cell + 1} {
    height: ${(cell + 1) * cellSizeInPx}px;
}
            `;
    }

    css += `
.cw-0\\.5 {
    width: ${cellSizeInPx * 0.5}px;
}
.ch-0\\.5 {
    height: ${cellSizeInPx * 0.5}px;
}
.cw-0\\.8 {
    width: ${cellSizeInPx * 0.8}px;
}
.ch-0\\.8 {
    height: ${cellSizeInPx * 0.8}px;
}
.cw-1\\.5 {
    width: ${cellSizeInPx * 1.5}px;
}
.ch-1\\.5 {
    height: ${cellSizeInPx * 1.5}px;
}
.cw-1\\.8 {
    width: ${cellSizeInPx * 1.8}px;
}
.ch-1\\.8 {
    height: ${cellSizeInPx * 1.8}px;
}
`;

    return { css, cellSizeInPx };
}

export function installCellStyle(style: HTMLStyleElement | null, css: string) {
    const head = document.head || document.getElementsByTagName("head")[0];
    if (style !== null) {
        head.removeChild(style);
    }

    const nextStyle = document.createElement("style");
    nextStyle.type = "text/css";
    nextStyle.appendChild(document.createTextNode(css));
    head.appendChild(nextStyle);
    return nextStyle;
}
