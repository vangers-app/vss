#include "virtual_joystick.h"

#include <array>
#include <cassert>
#include <functional>
#include <iostream>
#include <memory>
#include <optional>
#include <string>
#include <unordered_map>

#include "port.h"
#include "xglobal.h"

namespace {

struct SDL_Texture_Deleter {
	void operator()(SDL_Texture *texture) {
		SDL_DestroyTexture(texture);
	}
};
using SDL_TexturePtr = std::unique_ptr<SDL_Texture, SDL_Texture_Deleter>;

struct SDL_Surface_Deleter {
	void operator()(SDL_Surface *surface) {
		SDL_FreeSurface(surface);
	}
};
using SDL_SurfacePtr = std::unique_ptr<SDL_Surface, SDL_Surface_Deleter>;

class Atlas final {
public:
	explicit Atlas(SDL_Renderer *renderer) : m_texture(load(renderer)) {}

	Atlas(const Atlas &) = delete;
	Atlas(Atlas &&) = delete;
	Atlas &operator=(Atlas &) = delete;
	Atlas &operator=(Atlas &&) = delete;

	void drawSprite(SDL_Renderer *renderer, unsigned int index, const SDL_Rect &target) {
		const auto &sprite = sprites[index];
		SDL_Rect source{ sprite.origin.x, sprite.origin.y, sprite.size, sprite.size };
		SDL_RenderCopy(renderer, m_texture.get(), &source, &target);
	}

private:
	static SDL_TexturePtr load(SDL_Renderer *renderer) {
		auto path = get_platform_path("VirtualJoystick.bmp");
		std::cout << "Atlas: loading from file=" << path << std::endl;

		SDL_SurfacePtr surface{ SDL_LoadBMP(path) };
		if (!surface) {
			ErrH.Abort("I/O Error: can not load atlas", XERR_USER, 0, nullptr);
		}

		SDL_TexturePtr texture{ SDL_CreateTextureFromSurface(renderer, surface.get()) };
		if (!texture) {
			ErrH.Abort("Error: can not create atlas texture", XERR_USER, 0, nullptr);
		}
		return texture;
	}

	struct Sprite final {
		SDL_Point origin;
		int size;
	};
	constexpr static std::array<Sprite, 11> sprites{
		Sprite{ SDL_Point{ 0, 0 }, 512 },
		Sprite{ SDL_Point{ 512, 0 }, 256 },
		Sprite{ SDL_Point{ 768, 0 }, 256 },
		Sprite{ SDL_Point{ 512, 256 }, 256 },
		Sprite{ SDL_Point{ 768, 256 }, 256 },
		Sprite{ SDL_Point{ 0, 512 }, 256 },
		Sprite{ SDL_Point{ 256, 512 }, 256 },
		Sprite{ SDL_Point{ 512, 512 }, 256 },
		Sprite{ SDL_Point{ 768, 512 }, 256 },
		Sprite{ SDL_Point{ 0, 768 }, 256 },
		Sprite{ SDL_Point{ 256, 768 }, 256 }
	};

	const SDL_TexturePtr m_texture;
};

struct TouchEvent final {
	SDL_FingerID id;
	Uint32 type;
	int x;
	int y;
};

using KeyMap = std::unordered_map<SDL_Scancode, SDL_EventType>;

struct BaseWidget {
	explicit BaseWidget(size_t id) : id(id) {}
	virtual ~BaseWidget() = default;

	virtual void adjustSize() {}
	virtual void layout(SDL_Rect) {}
	virtual void draw(SDL_Renderer *) {}
	virtual void process(const TouchEvent &, KeyMap &) {}

	bool contains(int x, int y) const {
		const auto dx = frame.x + frame.w;
		const auto dy = frame.y + frame.h;
		return x >= frame.x && y >= frame.y && x <= dx && y <= dy;
	}

	const size_t id;
	SDL_Rect frame{};
};

template<size_t N>
struct BaseContainer : public BaseWidget {
	BaseContainer(size_t id, const std::array<BaseWidget *, N> &children)
	: BaseWidget(id), children(children) {}

	~BaseContainer() override {
		for (auto child : children) {
			delete child;
		}
	}

	void draw(SDL_Renderer *renderer) override {
		for (auto child : children) {
			child->draw(renderer);
		}
	}

	void process(const TouchEvent &event, KeyMap &keyMap) override {
		for (auto child : children) {
			child->process(event, keyMap);
		}
	}

	const std::array<BaseWidget *, N> children;
};

template<size_t N>
struct VStack final : public BaseContainer<N> {
	VStack(size_t id, const std::array<BaseWidget *, N> &children) : BaseContainer<N>(id, children) {}

	void adjustSize() override {
		int width = 0;
		int height = 0;
		for (auto child : BaseContainer<N>::children) {
			if (child->frame.w == -1) {
				spacerCount += 1;
				if (child->frame.w != -1) {
					width = std::max(width, child->frame.w);
				}
				continue;
			}
			child->adjustSize();

			width = std::max(width, child->frame.w);
			height += child->frame.h + space;
		}
		BaseContainer<N>::frame.w = width;
		BaseContainer<N>::frame.h = height;
	}

	void layout(SDL_Rect frame) override {
		const auto spacerHeight = static_cast<int>((frame.h - BaseContainer<N>::frame.h) / spacerCount);
		BaseContainer<N>::frame = frame;

		int y = BaseContainer<N>::frame.y;
		for (auto child : BaseContainer<N>::children) {
			if (child->frame.w == -1) {
				child->layout(SDL_Rect{ BaseContainer<N>::frame.x, y, BaseContainer<N>::frame.w, spacerHeight });
				y += spacerHeight;
			} else {
				child->layout(SDL_Rect{ BaseContainer<N>::frame.x, y, BaseContainer<N>::frame.w, child->frame.h });
				y += child->frame.h + space;
			}
		}
	}

private:
	const static int space = 10;
	size_t spacerCount = 0;
};

template<size_t N>
struct HStack final : public BaseContainer<N> {
	HStack(size_t id, const std::array<BaseWidget *, N> &children) : BaseContainer<N>(id, children) {}

	void adjustSize() override {
		int width = 0;
		int height = 0;
		for (auto child : BaseContainer<N>::children) {
			if (child->frame.h == -1) {
				spacerCount += 1;
				if (child->frame.h != -1) {
					height = std::max(height, child->frame.h);
				}
				continue;
			}
			child->adjustSize();

			width += child->frame.w;
			height = std::max(height, child->frame.h);
		}
		BaseContainer<N>::frame.w = width;
		BaseContainer<N>::frame.h = height;
	}

	void layout(SDL_Rect frame) override {
		const auto spacerWidth = static_cast<int>((frame.w - BaseContainer<N>::frame.w) / spacerCount);
		BaseContainer<N>::frame = frame;

		int x = BaseContainer<N>::frame.x;
		for (auto child : BaseContainer<N>::children) {
			if (child->frame.h == -1) {
				child->layout(SDL_Rect{ x, BaseContainer<N>::frame.y, spacerWidth, BaseContainer<N>::frame.h });
				x += spacerWidth;
			} else {
				child->layout(SDL_Rect{ x, BaseContainer<N>::frame.y, child->frame.w, BaseContainer<N>::frame.h });
				x += child->frame.w;
			}
		}
	}

private:
	size_t spacerCount = 0;
};

struct Button final : public BaseWidget {
	Button(size_t id, float scale, SDL_Scancode scancode, Atlas &atlas, unsigned int spriteIndex)
	: BaseWidget(id), m_scancode(scancode), m_atlas(atlas), m_spriteIndex(spriteIndex) {
		frame.w = static_cast<int>(50 * scale);
		frame.h = static_cast<int>(50 * scale);
	}

	void layout(SDL_Rect frame) override {
		this->frame.x = frame.x;
		this->frame.y = frame.y;
	}

	void draw(SDL_Renderer *renderer) override {
		m_atlas.drawSprite(renderer, m_spriteIndex, frame);
	}

	void process(const TouchEvent &event, KeyMap &keyMap) override {
		if (!contains(event.x, event.y)) {
			if (event.id == m_id) {
				keyMap[m_scancode] = SDL_KEYUP;
				m_id = std::nullopt;
			}
			return;
		}

		if (event.type != SDL_FINGERUP && event.type != SDL_FINGERDOWN) {
			return;
		}

		m_id = event.id;
		keyMap[m_scancode] = event.type == SDL_FINGERUP ? SDL_KEYUP : SDL_KEYDOWN;
	}

	const SDL_Scancode m_scancode;
	Atlas &m_atlas;
	unsigned int m_spriteIndex;
	std::optional<SDL_FingerID> m_id;
};

struct MouseSwitch final : public BaseWidget {
	MouseSwitch(size_t id, float scale, Atlas &atlas, unsigned int spriteIndex1, unsigned int spriteIndex2, bool &isMouseMode)
	: BaseWidget(id), m_atlas(atlas), m_spriteIndex1(spriteIndex1), m_spriteIndex2(spriteIndex2), m_isMouseMode(isMouseMode) {
		frame.w = static_cast<int>(50 * scale);
		frame.h = static_cast<int>(50 * scale);
	}

	void layout(SDL_Rect frame) override {
		this->frame.x = frame.x;
		this->frame.y = frame.y;
	}

	void draw(SDL_Renderer *renderer) override {
		if (m_isMouseMode) {
			m_atlas.drawSprite(renderer, m_spriteIndex2, frame);
		} else {
			m_atlas.drawSprite(renderer, m_spriteIndex1, frame);
		}
	}

	void process(const TouchEvent &event, KeyMap &keyMap) override {
		if (!contains(event.x, event.y)) {
			if (event.id == m_id) {
				m_id = std::nullopt;
			}
			return;
		}

		if (event.type != SDL_FINGERUP && event.type != SDL_FINGERDOWN) {
			return;
		}

		m_id = event.id;
		if (event.type == SDL_FINGERDOWN) {
			m_isMouseMode = !m_isMouseMode;
		}
	}

	Atlas &m_atlas;
	unsigned int m_spriteIndex1;
	unsigned int m_spriteIndex2;
	bool &m_isMouseMode;
	std::optional<SDL_FingerID> m_id;
};

struct DirectionPad final : public BaseWidget {
	DirectionPad(size_t id, float scale, Atlas &atlas, unsigned int spriteIndex)
	: BaseWidget(id), m_atlas(atlas), m_spriteIndex(spriteIndex) {
		frame.w = static_cast<int>(120 * scale);
		frame.h = static_cast<int>(120 * scale);
	}

	void layout(SDL_Rect frame) override {
		this->frame.x = frame.x;
		this->frame.y = frame.y;
	}

	void draw(SDL_Renderer *renderer) override {
		m_atlas.drawSprite(renderer, m_spriteIndex, frame);
	}

	void process(const TouchEvent &event, KeyMap &keyMap) override {
		if (!contains(event.x, event.y)) {
			if (event.id == m_id) {
				keyMap[SDL_SCANCODE_LEFT] = SDL_KEYUP;
				keyMap[SDL_SCANCODE_RIGHT] = SDL_KEYUP;
				keyMap[SDL_SCANCODE_UP] = SDL_KEYUP;
				keyMap[SDL_SCANCODE_DOWN] = SDL_KEYUP;
				m_id = std::nullopt;
			}
			return;
		}

		m_id = event.id;

		const auto threshold = static_cast<int>(0.3 * frame.w);
		const auto x = event.x - (frame.x + frame.w / 2);
		const auto y = event.y - (frame.y + frame.h / 2);
		const SDL_EventType eventType = event.type == SDL_FINGERUP ? SDL_KEYUP : SDL_KEYDOWN;
		if (std::abs(x) > threshold) {
			const SDL_Scancode code = x > 0 ? SDL_SCANCODE_RIGHT : SDL_SCANCODE_LEFT;
			keyMap[code] = eventType;
		} else {
			keyMap[SDL_SCANCODE_LEFT] = SDL_KEYUP;
			keyMap[SDL_SCANCODE_RIGHT] = SDL_KEYUP;
		}

		if (std::abs(y) > threshold) {
			const SDL_Scancode code = y > 0 ? SDL_SCANCODE_DOWN : SDL_SCANCODE_UP;
			keyMap[code] = eventType;
		} else {
			keyMap[SDL_SCANCODE_UP] = SDL_KEYUP;
			keyMap[SDL_SCANCODE_DOWN] = SDL_KEYUP;
		}
	}

	Atlas &m_atlas;
	unsigned int m_spriteIndex;
	std::optional<SDL_FingerID> m_id;
};

class Screen final {
public:
	Screen(SDL_Renderer *renderer, int screenWidth, int screenHeight, SDL_Rect safeArea)
	: m_renderer(renderer), m_screenWidth(screenWidth), m_screenHeight(screenHeight),
	m_safeArea(safeArea), m_atlas(renderer) {
		const float scale = screenWidth / 800.0f;
		m_root.reset(hStack(
			vStack(
				spacer(),
				mouseSwitch(scale),
				button(scale, SDL_SCANCODE_A, 6),
				button(scale, SDL_SCANCODE_D, 5),
				directionPad(scale)
			),
			spacer(),
			vStack(
				spacer(),
				hStack(
					button(scale, SDL_SCANCODE_W, 3),
					button(scale, SDL_SCANCODE_Q, 4)
				),
				hStack(
					button(scale, SDL_SCANCODE_SPACE, 1),
					button(scale, SDL_SCANCODE_RETURN, 2)
				)
			)
		));
	}

	void draw() {
		int logicWidth = 0;
		int logicHeight = 0;
		SDL_RenderGetLogicalSize(m_renderer, &logicWidth, &logicHeight);
		SDL_RenderSetLogicalSize(m_renderer, m_screenWidth, m_screenHeight);

		if (!m_hasLayout) {
			m_root->adjustSize();
			m_root->layout(SDL_Rect{ m_safeArea.x, m_safeArea.y, m_safeArea.w, m_safeArea.h });
			m_hasLayout = true;
		}
		m_root->draw(m_renderer);

		SDL_RenderSetLogicalSize(m_renderer, logicWidth, logicHeight);
	}

	void process(const SDL_TouchFingerEvent &event) {
		const auto x = static_cast<int>(event.x * m_screenWidth);
		const auto y = static_cast<int>(event.y * m_screenHeight);
		m_root->process(TouchEvent{ event.fingerId, event.type, x, y }, m_keyMap);
	}

	void apply(const std::function<void (SDL_Event)> &f) {
		if (m_isMouseMode) {
			Sint32 mouseX = 0;
			Sint32 mouseY = 0;
			bool isLeftButtonDown = false;
			bool isRightButtonDown = false;

			for (auto [scancode, eventType] : m_keyMap) {
				if (eventType != SDL_KEYDOWN) {
					continue;
				}

				switch (scancode) {
					case SDL_SCANCODE_RIGHT:
						mouseX = 5;
						break;

					case SDL_SCANCODE_LEFT:
						mouseX = -5;
						break;

					case SDL_SCANCODE_DOWN:
						mouseY = 5;
						break;

					case SDL_SCANCODE_UP:
						mouseY = -5;
						break;

					case SDL_SCANCODE_SPACE:
						isLeftButtonDown = true;
						break;

					case SDL_SCANCODE_RETURN:
						isRightButtonDown = true;
						break;

					default:
						break;
				}
			}

			if (mouseX != 0 || mouseY != 0) {
				m_mouseX += mouseX;
				m_mouseY += mouseY;

				SDL_Event event;
				event.type = SDL_MOUSEMOTION;
				event.motion.x = m_mouseX;
				event.motion.y = m_mouseY;
				f(event);
			}

			if (isLeftButtonDown) {
				SDL_Event event;
				event.type = SDL_MOUSEBUTTONDOWN;
				event.button.button = SDL_BUTTON_LEFT;
				f(event);
			}

			if (isRightButtonDown) {
				SDL_Event event;
				event.type = SDL_MOUSEBUTTONDOWN;
				event.button.button = SDL_BUTTON_RIGHT;
				f(event);
			}

			return;
		}

		for (auto [scancode, eventType] : m_keyMap) {
			SDL_Event event;
			event.type = eventType;
			event.key.type = eventType;
			event.key.state = eventType == SDL_KEYUP ? SDL_RELEASED : SDL_PRESSED;
			event.key.keysym.scancode = scancode;
			f(event);
		}

		auto i = m_keyMap.begin();
		while (i != m_keyMap.end()) {
			if (i->second == SDL_KEYUP) {
				i = m_keyMap.erase(i);
			} else {
				i++;
			}
		}
	}

	bool isKeyPressed(int code) {
		if (m_isMouseMode) {
			return false;
		}

		auto p = m_keyMap.find(static_cast<SDL_Scancode>(code));
		return p != m_keyMap.end() && p->second == SDL_KEYDOWN;
	}

private:
	size_t getNextIndex() {
		return m_lastIndex++;
	}

	template<typename... T>
	BaseWidget *vStack(T... children) {
		return new VStack<sizeof...(T)>{ getNextIndex(), {children...} };
	}

	template<typename... T>
	BaseWidget *hStack(T... children) {
		return new HStack<sizeof...(T)>{ getNextIndex(), {children...} };
	}

	BaseWidget *button(float scale, SDL_Scancode scancode, unsigned int spriteIndex) {
		return new Button{ getNextIndex(), scale, scancode, m_atlas, spriteIndex };
	}

	BaseWidget *directionPad(float scale) {
		return new DirectionPad{ getNextIndex(), scale, m_atlas, 0 };
	}

	BaseWidget *mouseSwitch(float scale) {
		return new MouseSwitch{ getNextIndex(), scale, m_atlas, 9, 10, m_isMouseMode };
	}

	BaseWidget *spacer() {
		const auto widget = new BaseWidget{ getNextIndex() };
		widget->frame = SDL_Rect{ 0, 0, -1, -1 };
		return widget;
	}

	SDL_Renderer *m_renderer;
	int m_screenWidth;
	int m_screenHeight;
	SDL_Rect m_safeArea;
	Atlas m_atlas;
	size_t m_lastIndex = 0;
	std::unique_ptr<BaseWidget> m_root;
	bool m_hasLayout = false;
	KeyMap m_keyMap;

	bool m_isMouseMode = false;
	Sint32 m_mouseX = 0;
	Sint32 m_mouseY = 0;
};

}

struct VirtualJoystick::Context final {
	Context(SDL_Renderer *renderer, int screenWidth, int screenHeight, SDL_Rect safeArea)
	: screen(renderer, screenWidth, screenHeight, safeArea) {}

	Screen screen;
};

VirtualJoystick::VirtualJoystick() {}

VirtualJoystick::~VirtualJoystick() {}

VirtualJoystick &VirtualJoystick::get() {
	static VirtualJoystick joystick;
	return joystick;
}

void VirtualJoystick::setup(SDL_Renderer *renderer, int screenWidth, int screenHeight, SDL_Rect safeArea) {
	m_context = std::make_unique<Context>(renderer, screenWidth, screenHeight, safeArea);
}

void VirtualJoystick::process(const SDL_TouchFingerEvent &event) {
	assert(m_context != nullptr);
	m_context->screen.process(event);
}

void VirtualJoystick::apply(const std::function<void (SDL_Event)> &f) {
	assert(m_context != nullptr);
	m_context->screen.apply(f);
}

bool VirtualJoystick::isKeyPressed(int code) {
	assert(m_context != nullptr);
	return m_context->screen.isKeyPressed(code);
}

void VirtualJoystick::draw() {
	assert(m_context != nullptr);
	m_context->screen.draw();
}
