const hexMap: { [char: string]: number } = {
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
    7: 7, 8: 8, 9: 9, a: 10, b: 11, c: 12, d: 13,
    e: 14, f: 15, A: 10, B: 11, C: 12, D: 13,
    E: 14, F: 15,
};

const byteMap = (function() {
    const byteMap: string[] = [];
    for (let n = 0; n <= 0xff; ++n) {
        const hexOctet = n.toString(16).padStart(2, "0");
        byteMap.push(hexOctet);
    }
    return byteMap;
})();


export function toHex(buff: Uint8Array) {
    const hexOctets = new Array(buff.length);
    for (let i = 0; i < buff.length; ++i) {
        hexOctets[i] = byteMap[buff[i]];
    }

    return hexOctets.join("");
}

export function fromHex(hexString: string): Uint8Array {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        const a = hexMap[hexString[i * 2]];
        const b = hexMap[hexString[i * 2 + 1]];
        bytes[i] = (a << 4) | b;
    }
    return bytes;
}
