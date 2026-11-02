import { readCustomProp, writeCustomProp } from "./inventory/storage";

export type RenderQuality = "high" | "normal" | "low";

export type RenderSettings = {
    use3d: boolean;
    quality: RenderQuality;
};

export function readRenderSettings(): RenderSettings {
    const quality = readCustomProp("render.quality");
    return {
        use3d: readCustomProp("render.3d") === "1",
        quality: quality === "high" || quality === "low" ? quality : "normal",
    };
}

export function writeRenderSettings(settings: RenderSettings) {
    writeCustomProp("render.3d", settings.use3d ? "1" : "0");
    writeCustomProp("render.quality", settings.quality);
}

// Copies of vange-rs/res/ffi/render-compat.ron that differ only in shadow map
// size and ray-march steps. shadow.size = 0 disables shadows entirely.
function renderPreset(shadowSize: number, raySteps: number): string {
    return `(
	allow_tearing: false,
	light: (
		pos: (1, 0, 1, 0),
		color: (1, 1, 1),
		shadow: (
			size: ${shadowSize},
			terrain: RayTraced,
		),
	),
	fog: (
		color: (0.1, 0.2, 0.3),
		depth: 50,
	),
	terrain: RayTraced,
	ray_steps: ${raySteps},
	water: (),
)
`;
}

export const RENDER_PRESETS: Record<RenderQuality, string> = {
    high: renderPreset(1024, 128),
    normal: renderPreset(512, 64),
    low: renderPreset(0, 64),
};
