import ui from "./ui";
import vss, { FileOpenFlags } from "./vss";

// find . -type f -printf '"%h/%f",\n'|sort
const files = [
    "02 - main menu theme/Cb14 - Вангеры нашего времени.ogg",
    "02 - main menu theme/Forsaken Music - Vangers (Main theme OST guitar cover)-dHDc_cozLN0.ogg",
    "02 - main menu theme/Guitar Pro 5.0 - Вангеры - Главная Тема.ogg",
    "03 - fostral/Andrey KranK Kuzmin, Victor Ruber Krasnokutsky - Fostral (After Years Edition).ogg",
    "03 - fostral/Forsaken Music - Fostral (Vangers OST cover).ogg",
    "03 - fostral/Gektor - Fostral Theme (Cover).ogg",
    "03 - fostral/KD-Music - Fostral Theme RMX bu RubeR - Perimeter OST.ogg",
    "04 - glorx/Andrey KranK Kuzmin, Victor Ruber Krasnokutsky - Glorx (After Years Edition).ogg",
    "04 - glorx/Forsaken Music - Glorx (Vangers, game cover).ogg",
    "04 - glorx/Vangers - Glorx Glory (Metal Cover by Fulgenesis).ogg",
    "05 - necross/Forsaken Music - Necross (Vangers OST metal cover)-JJLlqWnSy04.ogg",
    "05 - necross/Madamar - Crazy Necross.ogg",
    "05 - necross/Vangers - Necross (After Years Edition)-3QfYnHrn-kU.ogg",
    "05 - necross/Андрей ''KranK'' Кузьмин & Виктор ''Ruber'' Краснокутский - Безумство Некросса.ogg",
    "06 - xplo/Forsaken Music - Xplo (Vangers OST guitar cover)-jWjfhl4YFuI.ogg",
    "08 - death theme/The Cat Concerto - Death Theme Piano Cover (Vangers OST).ogg",
    "08 - death theme/Vangers - Death (is not the End) (After Years Edition)-Ywi7q0RccuE.ogg",
    "09 - ending theme/Forsaken Music - VANGERS FOREVER (guitar cover)-RVJ7Ip-BqXI.ogg",
    "09 - ending theme/Madamar - Vangers Forever.ogg",
    "09 - ending theme/Wolfframe - Vangers 4ever (remix).ogg",
    "10 - second ending theme/Forsaken Music - Vangers End (ending theme metal cover)-upubSDJ__Q0.ogg",
];

const pattern = /track(.*)\.ogg/;
export function init() {
    const mapping: { [id: string]: string[] } = {};
    for (const next of files) {
        const id = next.substring(0, 2);
        if (!mapping[id]) {
            mapping[id] = [];
        }
        mapping[id].push(next);
    }

    const assets = vss.getScriptsFolder() + "/../mods/music/";

    vss.addQuantListener("file_open", (payload) => {
        if (!ui.enabled("vss-music")) {
            return;
        }

        const { file, flags } = payload;
        if ((flags & FileOpenFlags.XS_IN) === 0) {
            return;
        }

        const match = pattern.exec(file);
        if (match !== null) {
            const id = match[1];
            const files = mapping[id];

            if (!files) {
                return;
            }

            const seed = Math.floor(Math.random() * (files.length * 2 + 1));
            if (seed >= files.length * 2) {
                ui.log("playing: orignal track");
                return;
            }

            const index = seed % files.length;
            ui.log("playing: " + files[index]);

            return {
                file: assets + files[index],
            };
        }
    });
}
