
#ifndef __XGLOBAL_H
#define __XGLOBAL_H


#ifdef _WIN32
#include <windows.h>
#include <process.h>
#endif

#include <SDL3/SDL.h>
#include <ctype.h>
#include <memory>
#include <stdio.h>
#include <ctype.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <time.h>
#include <memory>

#include "xcompat.h"

// __WORDSIZE is deliberately left undefined.
// It used to be defined here as __WORDSIZE = 32 whenever __LP64__ was absent,
// which is wrong twice over: the spaces make the macro expand to a bare
// "= 32" that duk_config.h then evaluates inside #if, and MSVC does not
// define __LP64__, so an x64 build would claim 32-bit pointers.
// duk_config.h is the only reader and it has a documented fallback for the
// neither-32-nor-64 case.

#ifdef WIN32
#define snprintf sprintf_s
#endif

#define _CONV_BUFFER_LEN	63

#include "port.h"
#include "xtcore.h"
//#include "xconsole.h"
//#include "xkey.h"
#include "xerrhand.h"
#include "xbuffer.h"
#include "xstream.h"
#include "xutl.h"
#include "xcpuid.h"
#include "xmsgbuf.h"
#include "xzip.h"
#include "xt_list.h"
#ifdef __cplusplus
extern "C"
{
#endif
#include "iniparser/iniparser.h"
#ifdef __cplusplus
}
#endif
#endif

