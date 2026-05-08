#include "html5.h"

#include <SDL.h>

#ifdef EMSCRIPTEN
#include <emscripten.h>
#endif

bool html::emSleep() {
#ifdef EMSCRIPTEN
	emscripten_sleep(4);
#else
	SDL_Delay(4);
#endif
	return true;
}
