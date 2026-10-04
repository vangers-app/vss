# Minimal config package for toml11 under Emscripten.
#
# The project normally gets toml11 through vcpkg, which supplies a config
# package. vcpkg is not used for a wasm build, so this stands in. Vendoring it
# also avoids the vcpkg config's arch check: that one refuses wasm32 because
# it was generated for 64-bit and tests CMAKE_SIZEOF_VOID_P against "8".
#
# toml11 is header-only, so there is nothing to link - just the include path.

if(NOT TARGET toml11::toml11)
  add_library(toml11::toml11 INTERFACE IMPORTED)
  set_target_properties(toml11::toml11 PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES "${CMAKE_CURRENT_LIST_DIR}/include"
  )
endif()

set(toml11_VERSION "4.4.0")
set(toml11_FOUND TRUE)
