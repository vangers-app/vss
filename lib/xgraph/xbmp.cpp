//
// Created by caiiiycuk on 25.06.2021.
//

#include <fstream>

#include <renderer/compositor/sdl_ext/SDL_extensions.h>

#include "xbmp.h"

extern "C" const char* sys_fileOpenQuant(const char* file, unsigned flags);

using namespace renderer::compositor;

Texture BMP_CreateTexture(const char *file, AbstractCompositor *renderer) {
	return sdl_ext::texture_load_bmp(
		*renderer,
		sys_fileOpenQuant(file, 1 /* XS_IN */),
		TextureType::RGBA32,
		BlendMode::Alpha
	);
}
