# clunk is a host-provided dependency, not a target-platform one, so the
# cross-compiling find_* root restriction (CMAKE_FIND_ROOT_PATH) must not
# apply: it points at the emscripten sysroot and would hide ${CLUNK_ROOT}.
FIND_PATH(CLUNK_INCLUDE_DIR
  NAMES
    clunk/clunk.h
  HINTS
    ${CLUNK_ROOT}
    /usr/local
    /opt/local
    /mingw
  PATH_SUFFIXES include
  NO_CMAKE_FIND_ROOT_PATH
)

FIND_LIBRARY(CLUNK_LIBRARY
  NAMES
    clunk
  HINTS
    ${CLUNK_ROOT}/lib
    ${CLUNK_ROOT}/bin
    /usr/local/lib
    /opt/local/lib
    /mingw/lib
    /mingw/bin
  NO_CMAKE_FIND_ROOT_PATH
)
IF(CLUNK_INCLUDE_DIR AND CLUNK_LIBRARY)
   SET(CLUNK_FOUND TRUE)
ENDIF(CLUNK_INCLUDE_DIR AND CLUNK_LIBRARY)

IF(CLUNK_FOUND)
  IF(NOT TARGET Clunk::Clunk)
    # Emscripten ships SDL3 as a port that the root CMakeLists pulls in with
    # -sUSE_SDL=3, so there is no SDL3::SDL3 target to name here. Asking for it
    # would fail the generate step with "target not found".
    IF(EMSCRIPTEN)
      SET(CLUNK_LINK_LIBRARIES "${CLUNK_LIBRARY}")
    ELSE()
      SET(CLUNK_LINK_LIBRARIES "${CLUNK_LIBRARY};SDL3::SDL3")
    ENDIF()
    ADD_LIBRARY(Clunk::Clunk INTERFACE IMPORTED)
    SET_TARGET_PROPERTIES(Clunk::Clunk PROPERTIES
      INTERFACE_INCLUDE_DIRECTORIES "${CLUNK_INCLUDE_DIR}"
      INTERFACE_LINK_LIBRARIES "${CLUNK_LINK_LIBRARIES}"
    )
  ENDIF()
  IF(NOT CLUNK_FIND_QUIETLY)
    MESSAGE(STATUS "Found clunk: ${CLUNK_LIBRARY} ${CLUNK_INCLUDE_DIR}")
  ENDIF(NOT CLUNK_FIND_QUIETLY)
ELSE(CLUNK_FOUND)
  IF(CLUNK_FIND_REQUIRED)
    MESSAGE(FATAL_ERROR "Could not find clunk")
  ENDIF(CLUNK_FIND_REQUIRED)
ENDIF(CLUNK_FOUND)
