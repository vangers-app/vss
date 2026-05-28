//
// Created by caiiiycuk on 16.05.2022.
//

#ifndef VANGERS_SYS_H
#define VANGERS_SYS_H

#include <memory>
#include <string>
#include <vector>

#include "quant-names.h"

#ifndef EMSCRIPTEN
#include <duktape.h>
#endif

namespace vss {

#ifndef EMSCRIPTEN
using ScriptContext = duk_context;
#else
using ScriptContext = void;
#endif

class Context {
 public:
#ifndef EMSCRIPTEN
  duk_context* ctx;
#endif
  Context();
  ~Context();
  Context& operator=(const Context&) = delete;
  Context(const Context&) = delete;
};

class QuantResult {
  friend class QuantBuilder;

 public:
  explicit QuantResult(std::shared_ptr<Context>& context);
  ~QuantResult();
  bool isNotHandled();
  bool isPreventDefault();
  int getInt(const char* name, int defaultValue);
  bool getBool(const char* name, bool defaultValue);
  const char* getString(const char* name, const char* defaultValue);
#ifdef __EMSCRIPTEN__
  const char* getStringAsync(const char* name, const char* defaultValue);
#endif

 private:
  std::shared_ptr<Context> context;
  ScriptContext* ctx;
#ifdef EMSCRIPTEN
  int resultId;
  std::string stringValue;
#endif
  bool notHandled;
  bool preventDefault;
};

class QuantBuilder {
 public:
  QuantBuilder(std::shared_ptr<Context>& context, const char* eventName);
  QuantBuilder& prop(const char* name, void* value, int size);
  QuantBuilder& prop(const char* name, int value);
  QuantBuilder& prop(const char* name, bool value);
  QuantBuilder& prop(const char* name, const char* value);
  QuantResult send();

 private:
  std::shared_ptr<Context> context;
  ScriptContext* ctx;
#ifdef EMSCRIPTEN
  int quantId;
#endif
  bool valid;
};

class Sys {
 public:
  Sys& operator=(const Sys&) = delete;
  Sys(const Sys&) = delete;

  void initScripts(const char* folder,
                   void (*init)(std::shared_ptr<Context>&) = nullptr);
  std::string getScriptsFolder();

  QuantBuilder quant(const char* eventName);

 private:
  Sys();
  ~Sys();
  friend Sys& sys();

  std::string scriptsFolder;
  std::shared_ptr<Context> context;
};

Sys& sys();
}  // namespace vss

// @caiiiycuk: to use without including <vangers/sys.h>
extern void sys_initScripts(const char* folder);
extern bool sys_readyQuant();
extern void sys_tickQuant();
extern void sys_runtimeObjectQuant(int runtimeObjectId);
extern void sys_scaledRendererQuant(int enabled);
extern void sys_frameQuant(void* frame, int width, int height, int bpp);
extern "C" const char* sys_fileOpenQuant(const char* file, unsigned flags);

#endif  // VANGERS_SYS_H
