IF(NOT DEFINED GAME_DATA_PATH)
    MESSAGE(FATAL_ERROR "GAME_DATA_PATH is not set")
endif(NOT DEFINED GAME_DATA_PATH)

INCLUDE_DIRECTORIES(
	"${PROJECT_SOURCE_DIR}/lib/xtool"
	"${PROJECT_SOURCE_DIR}/lib/xgraph"
	"${PROJECT_SOURCE_DIR}/src/vss/duktape-2.7.0"
)

IF(FFMPEG)
	include_directories("${PROJECT_SOURCE_DIR}/lib/xsound")
ELSE()
	include_directories(
		"${PROJECT_SOURCE_DIR}/overrides/ffmpeg"
		"${PROJECT_SOURCE_DIR}/lib/xsound"
	)
ENDIF()

SET(vangers_SRCS
	3d/3d_math.cpp
	3d/3dgraph.cpp
	3d/3dobject.cpp
	3d/dynamics.cpp
	3d/optimize.cpp
	actint/aci_scr.cpp
	actint/actint.cpp
	actint/actintml.cpp
	actint/ascr_fnc.cpp
	actint/ascript.cpp
	actint/chtree.cpp
	actint/sscript.cpp
	backg.cpp
	dast/poly3d.cpp
	iscreen/controls.cpp
	iscreen/hfont.cpp
	iscreen/i_chat.cpp
	iscreen/iextern.cpp
	iscreen/ikeys.cpp
	iscreen/imap_fnc.cpp
	iscreen/iml.cpp
	iscreen/iscr_fnc.cpp
	iscreen/iscreen.cpp
	iscreen/iscript.cpp
	iscreen/ivmap.cpp
	iscreen/script.cpp
	iscreen/smooth.cpp
	network.cpp
	palette.cpp
	particle/bmp2scr.cpp
	particle/deform.cpp
	particle/df.cpp
	particle/light.cpp
	particle/particle.cpp
	particle/partmap.cpp
	particle/pmaptype.cpp
	rle.cpp
	road.cpp
	sound/music.cpp
	sound/sound.cpp
	#sqint/sqibody.cpp #FOR surmap
	#sqint/sqicore.cpp #FOR surmap
	terra/compress.cpp
	terra/huff1.cpp
	terra/land.cpp
	terra/perpslop.cpp
	terra/siderend.cpp #ASM
	terra/slopskip.cpp
	terra/splay.cpp
	terra/vmap.cpp #ASM
	units/effect.cpp
	units/hobj.cpp
	units/items.cpp
	units/mechos.cpp
	units/moveland.cpp
	units/sensor.cpp
	units/track.cpp
	uvs/diagen.cpp
	uvs/screen.cpp
	uvs/univang.cpp
	xjoystick.cpp
	xsocket.cpp
	zmod_client.cpp
	${WINDOWS_RES}
	actint/layout.h)

SET(vss_SRCS
		vss/sys.cpp
		vss/sys-modules.cpp
		vss/sys-bridge.cpp
		vss/sys-quant.cpp
		vss/sys-experimental.cpp
		vss/duktape-2.7.0/duktape.c
		vss/duktape-2.7.0/extras/console/duk_console.c
		vss/duktape-2.7.0/extras/module-node/duk_module_node.c vss/sys-experimental.cpp)

IF(ANDROID)
	ADD_LIBRARY(vangers STATIC ${vangers_SRCS} ${vss_SRCS}
		$<TARGET_OBJECTS:xtool>
		$<TARGET_OBJECTS:xgraph>
		$<TARGET_OBJECTS:xsound>
	)
ELSEIF(APPLE)
	FIND_PACKAGE(Iconv REQUIRED)

	SET(vangers_SRCS ${vangers_SRCS}
		"${CMAKE_CURRENT_SOURCE_DIR}/../../SDL/src/main/uikit/SDL_uikit_main.c"
	)

	SET(RESOURCE_FILES
		"${CMAKE_CURRENT_SOURCE_DIR}/../../Apple/LaunchScreen.storyboard"
	)

	ADD_EXECUTABLE(vangers ${vangers_SRCS} ${vss_SRCS}
		$<TARGET_OBJECTS:xtool>
		$<TARGET_OBJECTS:xgraph>
		$<TARGET_OBJECTS:xsound>
		${RESOURCE_FILES}
	)

	SET_TARGET_PROPERTIES(vangers PROPERTIES
		MACOSX_BUNDLE TRUE
		MACOSX_BUNDLE_INFO_PLIST "${PROJECT_SOURCE_DIR}/../Apple/Info.plist.in"
		RESOURCE "${RESOURCE_FILES}"
	)

	ADD_CUSTOM_COMMAND(TARGET vangers POST_BUILD
		COMMAND ${CMAKE_COMMAND} -E copy_directory
		"${GAME_DATA_PATH}"
		"$<TARGET_FILE_DIR:${PROJECT_NAME}>/data"
	)

	ADD_CUSTOM_COMMAND(TARGET vangers POST_BUILD
		COMMAND ${CMAKE_COMMAND} -E copy
		"${PROJECT_SOURCE_DIR}/../Apple/VirtualJoystick.bmp"
		"$<TARGET_FILE_DIR:${PROJECT_NAME}>/data/VirtualJoystick.bmp"
	)

	TARGET_LINK_LIBRARIES(vangers PRIVATE
		${SDL2_LIBRARY}
		${OGG_LIBRARY}
		${VORBIS_LIBRARY}
		${VORBISFILE_LIBRARY}
		${CLUNK_LIBRARY}
		${SDL2_NET_LIBRARY}
		${FFMPEG_LIBRARIES}
		${ZLIB_LIBRARIES}
		${Iconv_LIBRARY}
		"-framework AVFAudio"
		"-framework Foundation"
		"-framework UIKit"
		"-framework QuartzCore"
		"-framework CoreAudio"
		"-framework AudioToolbox"
		"-framework CoreHaptics"
		"-framework CoreGraphics"
		"-framework GameController"
		"-framework Metal"
		"-framework CoreBluetooth"
		"-framework CoreMotion"
		"-framework CoreMedia"
		"-framework CoreVideo"
		"-framework Security"
		"-framework VideoToolbox"
	)
ELSE()
	ADD_EXECUTABLE(vangers ${vangers_SRCS} ${vss_SRCS}
		$<TARGET_OBJECTS:xtool>
		$<TARGET_OBJECTS:xgraph>
		$<TARGET_OBJECTS:xsound>
	)

	IF(WIN32)
		SET(WIN_LIB
			wsock32
			#-mwindows
			#-Wl,-subsystem,windows
		)
	ENDIF(WIN32)

	TARGET_LINK_LIBRARIES(vangers
		${SDL2_LIBRARY}
		${OGG_LIBRARY}
		${VORBIS_LIBRARY}
		${VORBISFILE_LIBRARY}
		${CLUNK_LIBRARY}
		${SDL2_NET_LIBRARY}
		${FFMPEG_LIBRARIES}
		${ZLIB_LIBRARIES}
		${OPENGL_LIBRARIES}
		${WIN_LIB}
		${STEAM_LIBS}
	)
ENDIF(ANDROID)
