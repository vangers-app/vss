#pragma once

#include <functional>
#include <memory>
#include <vector>

#include <SDL.h>

class VirtualJoystick final {
	struct Context;
	std::unique_ptr<Context> m_context;

	VirtualJoystick();
	~VirtualJoystick();

public:
	static VirtualJoystick &get();

	void setup(SDL_Renderer *renderer, int screenWidth, int screenHeight, SDL_Rect safeArea);
	void process(const SDL_TouchFingerEvent &event);
	void apply(const std::function<void (SDL_Event)> &f);
	bool isKeyPressed(int code);
	void draw();
};
