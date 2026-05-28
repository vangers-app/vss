include_directories(
	"${PROJECT_SOURCE_DIR}/lib/renderer/src"
	"${PROJECT_SOURCE_DIR}/lib/xtool"
	"${PROJECT_SOURCE_DIR}/lib/xgraph"
)

IF(NOT EMSCRIPTEN)
	include_directories("${PROJECT_SOURCE_DIR}/src/vss/duktape-2.7.0")
ENDIF()

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
	actint/layout.h
)


SET(vss_SRCS
		vss/sys-experimental.cpp)

IF(EMSCRIPTEN)
	LIST(APPEND vss_SRCS
		vss/sys-browser.cpp)
ELSE()
	LIST(APPEND vss_SRCS
		vss/sys.cpp
		vss/sys-modules.cpp
		vss/sys-bridge.cpp
		vss/sys-quant.cpp
		vss/duktape-2.7.0/duktape.c
		vss/duktape-2.7.0/extras/console/duk_console.c
		vss/duktape-2.7.0/extras/module-node/duk_module_node.c)
ENDIF()

if (ANDROID)
	ADD_LIBRARY(vangers STATIC ${vangers_SRCS} ${vss_SRCS}
		$<TARGET_OBJECTS:xtool>
		$<TARGET_OBJECTS:xgraph>
		$<TARGET_OBJECTS:xsound>
		$<TARGET_OBJECTS:renderer>
		$<TARGET_OBJECTS:glad>
	)
else()
	ADD_EXECUTABLE(vangers ${vangers_SRCS} ${vss_SRCS}
		$<TARGET_OBJECTS:xtool>
		$<TARGET_OBJECTS:xgraph>
		$<TARGET_OBJECTS:xsound>
	)

	IF(WIN32)
		SET(WIN_LIB
			wsock32
   			dbghelp
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
		renderer
		xtool
		xgraph
		xsound
	)
	IF(EMSCRIPTEN)
		target_link_options(vangers PRIVATE
			"SHELL:--preload-file ${PROJECT_SOURCE_DIR}/vange-rs/res@/res/"
			"-sMIN_WEBGL_VERSION=2"
			"-sMAX_WEBGL_VERSION=2"
			"-sFULL_ES3=1"
			"-sASYNCIFY=1"
			"-sINVOKE_RUN=0"
			"-sEXPORT_ES6=1"
			"-sNO_EXIT_RUNTIME=1"
			"-sFORCE_FILESYSTEM=1"
			"-sEXPORTED_FUNCTIONS=['_main','_malloc','_free','_vss_bridge_sendEvent','_vss_bridge_getLineT','_vss_bridge_getLineTSize','_vss_bridge_renderLine','_vss_bridge_hasShopItem','_vss_bridge_getShopItemInternalId','_vss_bridge_getShopItemType','_vss_bridge_getShopItemMechosName','_vss_bridge_toggleShopAvi','FS','GL']"
			"-sEXPORTED_RUNTIME_METHODS=['FS_createPath','FS_createDataFile','FS_cwd','FS_chdir','FS_writeFile','UTF8ToString','lengthBytesUTF8','stringToUTF8','callMain','run','OPFS']"
			"-sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=$OPFS"
			"-sINITIAL_MEMORY=512MB"
			"-sALLOW_MEMORY_GROWTH=1"
			"-sABORTING_MALLOC=0"
        	"-sERROR_ON_UNDEFINED_SYMBOLS=1"
			"-sGL_ENABLE_GET_PROC_ADDRESS=1"
			"-sGL_EXTENSIONS_IN_PREFIXED_FORMAT=0"
			"-sGL_SUPPORT_AUTOMATIC_ENABLE_EXTENSIONS=1"
			"-fwasm-exceptions"
			# "-sSAFE_HEAP=2"
			# "-sASSERTIONS=1"
			# "-O0"
			# "--profiling-funcs"
			"--js-library" "${PROJECT_SOURCE_DIR}/lib/libopfs.js"
		)
		set_target_properties(vangers PROPERTIES
			RUNTIME_OUTPUT_DIRECTORY "${PROJECT_SOURCE_DIR}/app/src"
			SUFFIX ".mjs")
		add_custom_command(TARGET vangers POST_BUILD
			COMMAND ${CMAKE_COMMAND} -E make_directory "${PROJECT_SOURCE_DIR}/app/public"
			COMMAND ${CMAKE_COMMAND} -E rename "$<TARGET_FILE_DIR:vangers>/vangers.data" "${PROJECT_SOURCE_DIR}/app/public/vangers.data")
	ENDIF(EMSCRIPTEN)
endif(ANDROID)
