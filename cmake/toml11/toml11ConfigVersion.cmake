# Version file for the vendored toml11 package.
#
# The project requests the range 4.4...<4.5, which CMake expresses through the
# PACKAGE_FIND_VERSION_MIN_* variables rather than PACKAGE_FIND_VERSION, so both
# forms have to be handled. The upstream write_basic_package_version_file()
# template covers this; the copy in external/ cannot be used because it was
# generated for a 64-bit host.

set(PACKAGE_VERSION "4.4.0")

if(PACKAGE_FIND_VERSION_RANGE)
  if(NOT PACKAGE_FIND_VERSION_MIN_MAJOR STREQUAL PACKAGE_FIND_VERSION_MAX_MAJOR
     OR NOT PACKAGE_FIND_VERSION_MIN_MINOR STREQUAL PACKAGE_FIND_VERSION_MAX_MINOR)
    set(PACKAGE_VERSION_COMPATIBLE FALSE)
  elseif(PACKAGE_VERSION VERSION_LESS PACKAGE_FIND_VERSION_MIN)
    set(PACKAGE_VERSION_COMPATIBLE FALSE)
  elseif(PACKAGE_FIND_VERSION_RANGE_MAX STREQUAL "EXCLUDE"
         AND NOT PACKAGE_VERSION VERSION_LESS PACKAGE_FIND_VERSION_MAX)
    set(PACKAGE_VERSION_COMPATIBLE FALSE)
  else()
    set(PACKAGE_VERSION_COMPATIBLE TRUE)
  endif()
else()
  string(REGEX REPLACE "^([0-9]+).*" "\\1" _toml11_major "${PACKAGE_VERSION}")
  if(PACKAGE_VERSION VERSION_LESS PACKAGE_FIND_VERSION)
    set(PACKAGE_VERSION_COMPATIBLE FALSE)
  elseif(NOT _toml11_major STREQUAL PACKAGE_FIND_VERSION_MAJOR)
    set(PACKAGE_VERSION_COMPATIBLE FALSE)
  else()
    set(PACKAGE_VERSION_COMPATIBLE TRUE)
  endif()
  if(PACKAGE_FIND_VERSION STREQUAL PACKAGE_VERSION)
    set(PACKAGE_VERSION_EXACT TRUE)
  endif()
endif()

# Deliberately no CMAKE_SIZEOF_VOID_P check: toml11 is header-only, so this
# package is architecture independent. The vcpkg-generated version file does
# check, which is why it rejects wasm32.
