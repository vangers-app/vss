#include <EGL/egl.h>
#include <emscripten/emscripten.h>

extern "C" EGLSurface eglCreatePbufferSurface(EGLDisplay, EGLConfig, const EGLint*)
{
	return EGL_NO_SURFACE;
}

extern "C" EGLSurface eglCreatePlatformWindowSurface(EGLDisplay, EGLConfig, void*, const EGLAttrib*)
{
	return EGL_NO_SURFACE;
}

extern "C" EGLDisplay eglGetPlatformDisplay(EGLenum, void*, const EGLAttrib*)
{
	return EGL_NO_DISPLAY;
}

extern "C" double now()
{
	return emscripten_get_now();
}
