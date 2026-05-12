//
// Created by caiiiycuk on 16.05.2022.
//

#include "sys.h"

#include <emscripten.h>

#include <cstdlib>

#include "xgraph.h"

// clang-format off
#include "../common.h"

#include "../actint/item_api.h"
#include "../iscreen/iscreen.h"
#include "../actint/actint.h"
#include "../actint/a_consts.h"
#include "../3d/3d_math.h"
#include "../terra/vmap.h"
// clang-format on

using namespace vss;

extern actIntDispatcher* aScrDisp;
extern void aciHandleCameraEvent(int code, int data);
extern void aciChangeAviIndex(void);
extern void aciInitShopAvi(void);
extern iListElement* iShopItem;
extern int iEvLineID;
extern void LINE_render(int y);

extern "C" void vss_bridge_sendEvent(int code, int data) {
  if (code == EV_VSS_CAMERA_ROT_EVENT) {
    aciHandleCameraEvent(BMENU_ITEM_ROT, data);
  } else if (code == EV_VSS_CAMERA_ZOOM_EVENT) {
    aciHandleCameraEvent(BMENU_ITEM_ZOOM, data);
  } else if (code == EV_VSS_CAMERA_PERSP_EVENT) {
    aciHandleCameraEvent(BMENU_ITEM_PERSP, data);
  } else if (aScrDisp) {
    aScrDisp->send_event(code, data);
  }
}

extern "C" unsigned char* vss_bridge_getLineT(int line) {
  return vMap->lineT[line];
}

extern "C" int vss_bridge_getLineTSize() { return map_size_x * 2; }

extern "C" void vss_bridge_renderLine(int line) { LINE_render(line); }

extern "C" int vss_bridge_hasShopItem() {
  return iShopItem && (iEvLineID == MECHOS_MODE || iEvLineID == MECHOS_LIST_MODE);
}

extern "C" int vss_bridge_getShopItemInternalId() {
  if (vss_bridge_hasShopItem()) {
    return ((invMatrix*)iShopItem)->internalID;
  }
  return 0;
}

extern "C" int vss_bridge_getShopItemType() {
  if (vss_bridge_hasShopItem()) {
    return ((invMatrix*)iShopItem)->type;
  }
  return 0;
}

extern "C" const char* vss_bridge_getShopItemMechosName() {
  if (vss_bridge_hasShopItem()) {
    return ((invMatrix*)iShopItem)->mech_name;
  }
  return "";
}

extern "C" void vss_bridge_toggleShopAvi() {
  aciChangeAviIndex();
  aciInitShopAvi();
}

EM_JS(int, vss_browser_init_scripts, (const char* folder), {
  if (globalThis.__vssBrowser && globalThis.__vssBrowser.initScripts) {
    return globalThis.__vssBrowser.initScripts(UTF8ToString(folder)) === false
               ? 0
               : 1;
  }
  return 0;
});

EM_JS(int, vss_browser_quant_begin, (const char* name), {
  if (globalThis.__vssBrowser && globalThis.__vssBrowser.beginQuant) {
    return globalThis.__vssBrowser.beginQuant(UTF8ToString(name)) || 0;
  }
  return 0;
});

EM_JS(void, vss_browser_quant_prop_int,
      (int id, const char* name, int value), {
        if (globalThis.__vssBrowser && globalThis.__vssBrowser.setProp) {
          globalThis.__vssBrowser.setProp(id, UTF8ToString(name), value);
        }
      });

EM_JS(void, vss_browser_quant_prop_bool,
      (int id, const char* name, int value), {
        if (globalThis.__vssBrowser && globalThis.__vssBrowser.setProp) {
          globalThis.__vssBrowser.setProp(id, UTF8ToString(name), value != 0);
        }
      });

EM_JS(void, vss_browser_quant_prop_string,
      (int id, const char* name, const char* value), {
        if (globalThis.__vssBrowser && globalThis.__vssBrowser.setProp) {
          globalThis.__vssBrowser.setProp(id, UTF8ToString(name),
                                          UTF8ToString(value));
        }
      });

EM_JS(void, vss_browser_quant_prop_buffer,
      (int id, const char* name, void* value, int size), {
        if (globalThis.__vssBrowser && globalThis.__vssBrowser.setProp) {
          globalThis.__vssBrowser.setProp(
              id, UTF8ToString(name), HEAPU8.subarray(value, value + size));
        }
      });

EM_JS(int, vss_browser_quant_send, (int id), {
  if (globalThis.__vssBrowser && globalThis.__vssBrowser.sendQuant) {
    return globalThis.__vssBrowser.sendQuant(id) || 0;
  }
  return 0;
});

EM_JS(int, vss_browser_result_handled, (int id), {
  if (globalThis.__vssBrowser && globalThis.__vssBrowser.isResultHandled) {
    return globalThis.__vssBrowser.isResultHandled(id) ? 1 : 0;
  }
  return 0;
});

EM_JS(int, vss_browser_result_prevent_default, (int id), {
  if (globalThis.__vssBrowser && globalThis.__vssBrowser.isPreventDefault) {
    return globalThis.__vssBrowser.isPreventDefault(id) ? 1 : 0;
  }
  return 0;
});

EM_JS(int, vss_browser_result_get_int,
      (int id, const char* name, int defaultValue), {
        if (globalThis.__vssBrowser && globalThis.__vssBrowser.getInt) {
          return globalThis.__vssBrowser.getInt(id, UTF8ToString(name),
                                                defaultValue);
        }
        return defaultValue;
      });

EM_JS(int, vss_browser_result_get_bool,
      (int id, const char* name, int defaultValue), {
        if (globalThis.__vssBrowser && globalThis.__vssBrowser.getBool) {
          return globalThis.__vssBrowser.getBool(id, UTF8ToString(name),
                                                 defaultValue != 0)
                     ? 1
                     : 0;
        }
        return defaultValue;
      });

EM_JS(char*, vss_browser_result_get_string,
      (int id, const char* name, const char* defaultValue), {
        var value = UTF8ToString(defaultValue);
        if (globalThis.__vssBrowser && globalThis.__vssBrowser.getString) {
          value =
              globalThis.__vssBrowser.getString(id, UTF8ToString(name), value);
        }
        var size = lengthBytesUTF8(value) + 1;
        var result = _malloc(size);
        stringToUTF8(value, result, size);
        return result;
      });

EM_JS(void, vss_browser_result_release, (int id), {
  if (globalThis.__vssBrowser && globalThis.__vssBrowser.releaseResult) {
    globalThis.__vssBrowser.releaseResult(id);
  }
});

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
    if (!vss_browser_init_scripts(folder)) {
      context = std::shared_ptr<Context>(nullptr);
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
    : context(context),
      ctx(nullptr),
      resultId(0),
      notHandled(true),
      preventDefault(false) {}

QuantResult::~QuantResult() {
  if (resultId != 0) {
    vss_browser_result_release(resultId);
  }
}

bool QuantResult::isNotHandled() { return notHandled; }

bool QuantResult::isPreventDefault() { return preventDefault; }

int QuantResult::getInt(const char* name, int defaultValue) {
  if (!notHandled) {
    return vss_browser_result_get_int(resultId, name, defaultValue);
  }
  return defaultValue;
}

bool QuantResult::getBool(const char* name, bool defaultValue) {
  if (!notHandled) {
    return vss_browser_result_get_bool(resultId, name, defaultValue) != 0;
  }
  return defaultValue;
}

const char* QuantResult::getString(const char* name, const char* defaultValue) {
  if (notHandled) {
    return defaultValue;
  }
  auto value = vss_browser_result_get_string(resultId, name, defaultValue);
  stringValue = value;
  free(value);
  return stringValue.c_str();
}

QuantBuilder::QuantBuilder(std::shared_ptr<Context>& context,
                           const char* eventName)
    : context(context), ctx(nullptr), quantId(0), valid(context != nullptr) {
  if (valid) {
    quantId = vss_browser_quant_begin(eventName);
    valid = quantId != 0;
  }
}

QuantBuilder& QuantBuilder::prop(const char* name, void* value, int size) {
  if (valid) {
    vss_browser_quant_prop_buffer(quantId, name, value, size);
  }
  return *this;
}

QuantBuilder& QuantBuilder::prop(const char* name, int value) {
  if (valid) {
    vss_browser_quant_prop_int(quantId, name, value);
  }
  return *this;
}

QuantBuilder& QuantBuilder::prop(const char* name, bool value) {
  if (valid) {
    vss_browser_quant_prop_bool(quantId, name, value);
  }
  return *this;
}

QuantBuilder& QuantBuilder::prop(const char* name, const char* value) {
  if (valid) {
    vss_browser_quant_prop_string(quantId, name, value);
  }
  return *this;
}

QuantResult QuantBuilder::send() {
  auto result = QuantResult(context);
  if (valid) {
    result.resultId = vss_browser_quant_send(quantId);
    result.notHandled = !vss_browser_result_handled(result.resultId);
    result.preventDefault =
        vss_browser_result_prevent_default(result.resultId) != 0;
  }
  return result;
}

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
  static std::string resultFile;
  auto result = sys()
                    .quant(FILE_OPEN_QUANT)
                    .prop("file", file)
                    .prop("flags", (int)flags)
                    .send();

  resultFile = result.getString("file", file);
  return resultFile.c_str();
}
