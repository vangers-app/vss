include_directories(BEFORE
	"${PROJECT_SOURCE_DIR}/lib/xtool"
	"${PROJECT_SOURCE_DIR}/lib/xgraph"
	"${PROJECT_SOURCE_DIR}/lib/renderer/src"
)

SET(xsound_SRCS
	xsound.cpp
	ogg_stream.cpp
)

if(FFMPEG)
	list(APPEND xsound_SRCS avi.cpp)
else()
	list(APPEND xsound_SRCS "${PROJECT_SOURCE_DIR}/overrides/ffmpeg/avi.cpp")
endif()

ADD_LIBRARY(xsound STATIC ${xsound_SRCS})
TARGET_LINK_LIBRARIES(xsound PRIVATE
	${FFMPEG_LIBRARIES}
	${OGG_LIBRARY}
	${VORBIS_LIBRARY}
	${VORBISFILE_LIBRARY}
)

TARGET_LINK_LIBRARIES(xsound PUBLIC Clunk::Clunk SDL3::SDL3)
