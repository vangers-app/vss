#include <EGL/egl.h>
#include <cstdarg>
#include <cstddef>
#include <cstdint>
#include <fcntl.h>
#include <sys/stat.h>
#include <unistd.h>

#undef fstat64
#undef lseek64
#undef lstat64
#undef open64
#undef stat64

/*
struct rv_emscripten_legacy_stat64 {
	uint32_t st_dev;
	int32_t __st_dev_padding;
	int32_t __st_ino_truncated;
	uint32_t st_mode;
	uint32_t st_nlink;
	uint32_t st_uid;
	uint32_t st_gid;
	uint32_t st_rdev;
	int32_t __st_rdev_padding;
	int64_t st_size;
	int32_t st_blksize;
	int32_t st_blocks;
	int32_t st_atime_sec;
	int32_t st_atime_nsec;
	int32_t st_mtime_sec;
	int32_t st_mtime_nsec;
	int32_t st_ctime_sec;
	int32_t st_ctime_nsec;
	uint64_t st_ino;
};

static_assert(offsetof(rv_emscripten_legacy_stat64, st_mode) == 12);
static_assert(offsetof(rv_emscripten_legacy_stat64, st_size) == 40);
static_assert(offsetof(rv_emscripten_legacy_stat64, st_ino) == 80);
static_assert(sizeof(rv_emscripten_legacy_stat64) == 88);

static void rv_copy_legacy_stat64(rv_emscripten_legacy_stat64* dst, const struct stat& src)
{
	dst->st_dev = src.st_dev;
	dst->__st_dev_padding = 0;
	dst->__st_ino_truncated = src.st_ino;
	dst->st_mode = src.st_mode;
	dst->st_nlink = src.st_nlink;
	dst->st_uid = src.st_uid;
	dst->st_gid = src.st_gid;
	dst->st_rdev = src.st_rdev;
	dst->__st_rdev_padding = 0;
	dst->st_size = src.st_size;
	dst->st_blksize = src.st_blksize;
	dst->st_blocks = src.st_blocks;
	dst->st_atime_sec = src.st_atim.tv_sec;
	dst->st_atime_nsec = src.st_atim.tv_nsec;
	dst->st_mtime_sec = src.st_mtim.tv_sec;
	dst->st_mtime_nsec = src.st_mtim.tv_nsec;
	dst->st_ctime_sec = src.st_ctim.tv_sec;
	dst->st_ctime_nsec = src.st_ctim.tv_nsec;
	dst->st_ino = src.st_ino;
}

extern "C" int open64(const char* path, int flags, ...)
{
	if(flags & O_CREAT){
		va_list args;
		va_start(args, flags);
		mode_t mode = va_arg(args, int);
		va_end(args);
		return open(path, flags, mode);
	}else{
		return open(path, flags);
	}
}

extern "C" int stat64(const char* path, rv_emscripten_legacy_stat64* buf)
{
	struct stat src;
	if(stat(path, &src) == 0){
		rv_copy_legacy_stat64(buf, src);
		return 0;
	}else{
		return -1;
	}
}

extern "C" int lstat64(const char* path, rv_emscripten_legacy_stat64* buf)
{
	struct stat src;
	if(lstat(path, &src) == 0){
		rv_copy_legacy_stat64(buf, src);
		return 0;
	}else{
		return -1;
	}
}

extern "C" int fstat64(int fd, rv_emscripten_legacy_stat64* buf)
{
	struct stat src;
	if(fstat(fd, &src) == 0){
		rv_copy_legacy_stat64(buf, src);
		return 0;
	}else{
		return -1;
	}
}
*/

// extern "C" int open64(const char* path, int flags, ...)
// {
// 	if(flags & O_CREAT){
// 		va_list args;
// 		va_start(args, flags);
// 		mode_t mode = va_arg(args, int);
// 		va_end(args);
// 		return open(path, flags, mode);
// 	}else{
// 		return open(path, flags);
// 	}
// }

// extern "C" int stat64(const char* path, struct stat* buf)
// {
// 	return stat(path, buf);
// }

// extern "C" int lstat64(const char* path, struct stat* buf)
// {
// 	return lstat(path, buf);
// }

// extern "C" int fstat64(int fd, struct stat* buf)
// {
// 	return fstat(fd, buf);
// }
// extern "C" off_t lseek64(int fd, off_t offset, int whence)
// {
// 	return lseek(fd, offset, whence);
// }

extern "C" EGLSurface eglCreatePbufferSurface(EGLDisplay, EGLConfig, const EGLint*)
{
	return EGL_NO_SURFACE;
}

extern "C" EGLDisplay eglGetPlatformDisplay(EGLenum, void*, const EGLAttrib*)
{
	return EGL_NO_DISPLAY;
}
