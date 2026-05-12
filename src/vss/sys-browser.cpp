//
// Created by caiiiycuk on 16.05.2022.
//

#include "sys.h"

using namespace vss;

Context::Context() {}

Context::~Context() {}

Sys::Sys() : context(nullptr) {}

Sys::~Sys() {}

void Sys::initScripts(const char* folder,
                      void (*init)(std::shared_ptr<Context>&)) {
  scriptsFolder = folder;
  if (folder[0] == '\0') {
    context = std::shared_ptr<Context>(nullptr);
  } else {
    context = std::make_shared<Context>();
    if (init) {
      init(context);
    }
  }
}

std::string Sys::getScriptsFolder() { return scriptsFolder; }

QuantBuilder Sys::quant(const char* eventName) {
  return QuantBuilder(context, eventName);
}

Sys& vss::sys() {
  static Sys sys;
  return sys;
}

QuantResult::QuantResult(std::shared_ptr<Context>& context)
    : context(context), ctx(nullptr), notHandled(true), preventDefault(false) {}

QuantResult::~QuantResult() {}

bool QuantResult::isNotHandled() { return notHandled; }

bool QuantResult::isPreventDefault() { return preventDefault; }

int QuantResult::getInt(const char* name, int defaultValue) {
  return defaultValue;
}

bool QuantResult::getBool(const char* name, bool defaultValue) {
  return defaultValue;
}

const char* QuantResult::getString(const char* name, const char* defaultValue) {
  return defaultValue;
}

QuantBuilder::QuantBuilder(std::shared_ptr<Context>& context,
                           const char* eventName)
    : context(context), ctx(nullptr), valid(false) {}

QuantBuilder& QuantBuilder::prop(const char* name, void* value, int size) {
  return *this;
}

QuantBuilder& QuantBuilder::prop(const char* name, int value) { return *this; }

QuantBuilder& QuantBuilder::prop(const char* name, bool value) { return *this; }

QuantBuilder& QuantBuilder::prop(const char* name, const char* value) {
  return *this;
}

QuantResult QuantBuilder::send() { return QuantResult(context); }

void sys_initScripts(const char* folder) { sys().initScripts(folder); }

bool sys_readyQuant() {
  auto result = sys().quant(READY_QUANT).send();
  return !result.isPreventDefault();
}

void sys_tickQuant() { sys().quant(TICK_QUANT).send(); }

void sys_scaledRendererQuant(bool enabled) {
  static bool current = false;
  if (current == enabled) {
    return;
  }
  current = enabled;

  sys().quant(SCALED_RENDERER_QUANT).prop("enabled", enabled).send();
}

void sys_runtimeObjectQuant(int runtimeObjectId) {
  static int currentRuntimeObjectId = -1;
  if (currentRuntimeObjectId == runtimeObjectId) {
    return;
  }
  currentRuntimeObjectId = runtimeObjectId;

  sys()
      .quant(RUNTIME_OBJECT_QUANT)
      .prop("runtimeObjectId", runtimeObjectId)
      .send();
}

void sys_frameQuant(void* frame, int width, int height, int bpp) {
  sys()
      .quant(FRAME_QUANT)
      .prop("frame", frame, width * height * bpp)
      .prop("width", width)
      .prop("height", height)
      .prop("bpp", bpp)
      .send();
}

extern "C" const char* sys_fileOpenQuant(const char* file, unsigned flags) {
  auto result = sys()
                    .quant(FILE_OPEN_QUANT)
                    .prop("file", file)
                    .prop("flags", (int)flags)
                    .send();

  return result.getString("file", file);
}
