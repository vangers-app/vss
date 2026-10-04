/* ---------------------------- INCLUDE SECTION ----------------------------- */

#ifdef EMSCRIPTEN
#include <emscripten.h>
#endif

#include "../xgraph/xgraph.h"
#include "lang.h"
#include "renderer/visualbackend/VisualBackendContext.h"
#include "xglobal.h"
#include "xt_list.h"

extern void sys_initScripts(const char* folder);
extern bool sys_readyQuant();
extern void sys_tickQuant();
extern void sys_runtimeObjectQuant(int runtimeObjectId);

#include <SDL3/SDL_main.h>

#if defined(__unix__) || defined(__linux__) || defined(__APPLE__)
#include <locale.h>
#endif

int __internal_argc;
char **__internal_argv;

/* ----------------------------- STRUCT SECTION ----------------------------- */

struct xtMsgHandlerObject
{
	int ID;

	void (*Handler)(SDL_Event*);

	void* list;
	xtMsgHandlerObject* next;
	xtMsgHandlerObject* prev;

	xtMsgHandlerObject(void (*p)(SDL_Event*),int id);
};

/* ----------------------------- EXTERN SECTION ----------------------------- */
/* --------------------------- PROTOTYPE SECTION ---------------------------- */

void xtSetExit(void);
//int xtNeedExit(void);

int xtCallXKey(SDL_Event* m);
void xtSysQuant(void);

void xtAddSysObj(XList* lstPtr,void (*fPtr)(void),int id);
void xtDeleteSysObj(XList* lstPtr,int id);
void xtDeactivateSysObj(XList* lstPtr,int id);

void xtReadConsoleInput(void);

void xtRegisterSysMsgFnc(void (*fPtr)(SDL_Event*),int id);
void xtRegisterSysFinitFnc(void (*fPtr)(void),int id);
void xtUnRegisterSysFinitFnc(int id);
void xtDeactivateSysFinitFnc(int id);
void xtSysFinit(void);

// void xtPostMessage(HANDLE hWnd,int msg,int wp,int lp);
int xtDispatchMessage(SDL_Event *msg);
static void xtEventQuant(void);
static void xtProcessMessageBuffer(void);

/* --------------------------- DEFINITION SECTION --------------------------- */

//#define _RTO_LOG_

typedef void (*XFNC)();

#define XT_DEFAULT_TABLE_SIZE	32

XRuntimeObject** XRObjTable = NULL;
unsigned int XRObjTableSize = 0;

XRuntimeObject* XRObjFirst = NULL;
XRuntimeObject* XRObjLast = NULL;

const char* XToolClassName = "XToolClass";
const char* XToolWndName = "XToolWindow";

void* XAppHinst = NULL;
void* XGR_hWnd = NULL;

void* hXConOutput = NULL;
void* hXConInput = NULL;

int XAppMode = 0;

void (*press_handler)(SDL_Event* m);
void (*unpress_handler)(SDL_Event* m);

XList XSysQuantLst;
XList XSysFinitLst;
xtList<xtMsgHandlerObject> XSysHandlerLst;

double XTCORE_FRAME_DELTA = 0;
double XTCORE_FRAME_NORMAL = 0;

#ifdef _RTO_LOG_
XStream xtRTO_Log;
#endif

int xtSysQuantDisabled = 0;
static int xtFrameCount = 0;
static bool xtExitRequested = false;
static void (*xtAudioPauseHandler)(bool) = nullptr;
extern bool XGR_FULL_SCREEN;

int SkipIntro = 0;

bool autoconnect = false;
char *autoconnectHost;
unsigned short  autoconnectPort = 2197;
bool autoconnectJoinGame = false;
int  autoconnectGameID;

XRuntimeObject* XObj = nullptr;
int xtLoopId = 0;
int xtLoopPrevID = 0;
int xtLoopClockCnt = 0;
int xtLoopClockCntGlobal = 0;
int xtLoopResumeAt = 0;
bool xtLoopObjectStarted = false;

int getCurRtoId() {
	return XObj == nullptr ? 0 : XObj->ID;
}

int xtGetFrameCount(void) {
	return xtFrameCount;
}

void xtSetAudioPauseHandler(void (*handler)(bool)) {
	xtAudioPauseHandler = handler;
}

static void xtLoopStateInit();
static bool xtLoopStateAlive();
static bool xtLoopStep();
#ifdef EMSCRIPTEN
void em_normal_loop();
#endif

int main(int argc, char *argv[]) {
	int id, prevID;
	Uint64 clockDelta, clockCnt, clockNow, clockCntGlobal, clockNowGlobal;
	__internal_argc = argc;
	__internal_argv = argv;

#ifdef _WIN32
	std::cout << "Load backtrace" << std::endl;
	LoadLibraryA("backtrace.dll");
	std::cout << "Set priority class" << std::endl;
	SetPriorityClass(GetCurrentProcess(), HIGH_PRIORITY_CLASS);
#endif

	for (int i = 1; i < argc; i++) {
		std::string cmd_key = argv[i];
		if (cmd_key == "-vss") {
			// Initialises the vss context before anything else touches it. Without
			// this, Sys::context stays null, every QuantBuilder is invalid, and no
			// quant - including file_open - ever reaches the JavaScript side.
			i++;
			if (argc > i) {
				sys_initScripts(argv[i]);
			} else {
				std::cout << "Invalid parameter usage: '-vss <file>' expected" << std::endl;
			}
		} else if (cmd_key == "-fullscreen") {
			XGR_FULL_SCREEN = true;
		} else if (cmd_key == "-skipintro") {
			SkipIntro = 1;
		} else if (cmd_key == "-russian") {
			setLang(RUSSIAN);
		} else if (cmd_key == "-server") {
			if (argc > i) {
				sys_initScripts(argv[i]);
			} else {
				std::cout << "Invalid parameter usage: '-vss <file>' expected" << std::endl;
			}
		} else if (cmd_key == "-fullscreen") {
			XGR_FULL_SCREEN = true;
        } else if (cmd_key == "-russian") {
            setLang(RUSSIAN);
        } else if (cmd_key == "-server") {
			i++;
			if (argc > i) {
                autoconnect = true;
                autoconnectHost = argv[i];
            } else {
                std::cout << "Invalid parameter usage: '-server hostname' expected" << std::endl;
            }
        } else if (cmd_key == "-port") {
			i++;
			if (argc > i) {
                autoconnectPort = (unsigned short)strtol(argv[i], NULL, 0);
            } else {
                std::cout << "Invalid parameter usage: '-port value' expected" << std::endl;
            }
        } else if (cmd_key == "-game") {
			i++;
			if (argc > i) {
                std::string value = argv[i];
                autoconnectJoinGame = true;
                if (value == "new") {
                    autoconnectGameID = 0;
                } else if (value == "any") {
                    autoconnectGameID = -1;
                } else {
                    autoconnectGameID = (int)strtol(argv[i], NULL, 0);
                }
            } else {
                std::cout << "Invalid parameter usage: '-game [id|new|any]' expected" << std::endl;
            }
		} else if (cmd_key == "--compile-iscreen") {
			if (i + 2 < argc) {
				i += 2;
			} else {
				std::cout << "Invalid parameter usage: '--compile-iscreen source output' expected"
						  << std::endl;
			}
        } else {
            std::cout << "Unknown parameter: '" << cmd_key << "'" << std::endl;
        }
    }

#if defined(__unix__) || defined(__linux__) || defined(__APPLE__)
	std::cout<<"Set locale. ";
	char* res = setlocale(LC_NUMERIC, "POSIX");
	std::cout<<"Result:"<<res<<std::endl;
#endif
	//Set handlers to null
	press_handler = NULL;
	unpress_handler = NULL;

	XMsgBuf = new XMessageBuffer;

	initclock();
	xtLoopPrevID = 0;
	#ifdef _WIN32
		set_signal_handler();
	#endif
	xtLoopId = xtInitApplication();

	if (!sys_readyQuant()) {
		xtDoneApplication();
		xtSysFinit();
		return 0;
	}

	XObj = xtGetRuntimeObject(xtLoopId);
	sys_runtimeObjectQuant(XObj->ID);
#ifdef _RTO_LOG_
	xtRTO_Log.open("xt_rto_w.log", XS_OUT);
#endif

	xtLoopStateInit();

#ifdef EMSCRIPTEN
	// Hand the loop to the browser instead of running it here: inline it would
	// block the only thread the page has, so nothing would ever paint.
	emscripten_set_main_loop(em_normal_loop, 0, true);
#else
	while (xtLoopStateAlive()) {
		xtLoopStep();
	}
#endif

	xtDoneApplication();
	xtSysFinit();
	SDL_Quit();

#ifdef _RTO_LOG_
	xtRTO_Log.close();
#endif
	return 0;
}

#ifdef EMSCRIPTEN
void em_normal_loop() {
	// Advance one RTO step. xtLoopStep returns false once the runtime table is
	// empty, which is the only way out of the loop.
	if (!xtLoopStep()) {
		emscripten_cancel_main_loop();
	}
}
#endif
// State carried between frames. Emscripten calls the loop callback once per
// animation frame rather than once per whole loop, so the locals that used
// to live in main() have to outlive a single call.
static int xtLoopStepId = 0;
static int xtLoopStepPrevID = 0;
static Uint64 xtLoopStepClockCnt = 0;
static Uint64 xtLoopStepClockCntGlobal = 0;
#ifdef EMSCRIPTEN
// The browser drives us from requestAnimationFrame, which runs faster than the
// RTO timers ask for, and it cannot be blocked. Both waits the native build
// does with SDL_Delay are therefore expressed by leaving xtLoopStep and letting
// the next animation frame resume it.
static Uint64 xtLoopStepDeadline = 0;   // clock at which the next Quant is due
static bool xtLoopStepRunning = false;  // Init done, inner loop still unfinished
#endif
static void xtLoopStateInit() {
	xtLoopStepId = 0;
	xtLoopStepPrevID = 0;
	xtLoopStepClockCnt = clocki();
	xtLoopStepClockCntGlobal = xtLoopStepClockCnt;
#ifdef EMSCRIPTEN
	xtLoopStepDeadline = 0;
	xtLoopStepRunning = false;
#endif
}

static bool xtLoopStateAlive() { return XObj != nullptr; }

// Advances the game by one RTO step: run the current object until it asks to
// switch, then perform the switch. Returns false once the table is empty.
static bool xtLoopStep() {
	int id, prevID;
	Uint64 clockDelta, clockNow, clockNowGlobal;

	if (!XObj) {
		return false;
	}

#ifdef EMSCRIPTEN
	// SDL_Delay used to block out the remainder of the frame, which is what paced
	// this loop to XObj->Timer. Blocking is not available on the browser, so pace
	// by refusing the step instead: the Quant is skipped until the interval has
	// elapsed. Returning true keeps the loop alive and leaves every game
	// variable untouched.
	//
	// The schedule is a deadline rather than "wait since the last Quant", and it
	// accumulates from the previous deadline instead of from the clock. A frame
	// boundary lands on a multiple of ~16.7ms, so re-arming the wait from the
	// instant a Quant happened to run carries that rounding error forward every
	// frame and the period drifts long: at Timer=50ms a Quant landing 2ms into a
	// frame waited for the one at 64ms, turning 20fps into 15.6fps. Advancing by
	// exactly Timer each time absorbs the rounding instead and settles on the
	// frame count that Timer really asks for.
	//
	// The guard also has to keep applying while a step is suspended: the inner
	// loop below yields to the browser instead of sleeping, and without this a
	// resumed step would run its Quants once per frame.
	//
	// Skipping without touching xtLoopStepClockCntGlobal matters as much as the
	// skip itself: XTCORE_FRAME_DELTA is measured from the previous executed
	// Quant to this one, so the skipped time stays inside the delta and
	// XTCORE_FRAME_NORMAL keeps the ~1.0 that the whole world physics is
	// normalised against.
	if (XObj->Timer) {
		const Uint64 now = clocki();
		if (xtLoopStepDeadline == 0) {
			// First step of an RTO: due immediately, as the native build is.
			xtLoopStepDeadline = now;
		} else if (now < xtLoopStepDeadline) {
			return true;
		}
	}
#endif

#ifdef EMSCRIPTEN
	// Resuming a suspended inner loop must not restart it: Init already ran, and
	// the time the yield spent waiting belongs in the delta the next Quant
	// measures, so only the per-Quant clock is rebased here - exactly what the
	// SDL_Delay branch did by re-reading the clock after it returned.
	if (!xtLoopStepRunning) {
		XObj->Init(xtLoopStepPrevID);
		xtLoopStepPrevID = xtLoopStepId;
		xtLoopStepClockCnt = clocki();
		xtLoopStepClockCntGlobal = xtLoopStepClockCnt;
		xtLoopStepRunning = true;
		id = 0;
	} else {
		id = xtLoopStepId;
		xtLoopStepClockCnt = clocki();
	}
#else
	XObj->Init(xtLoopStepPrevID);
	xtLoopStepPrevID = xtLoopStepId;
	id = 0;
	xtLoopStepClockCnt = clocki();
	xtLoopStepClockCntGlobal = xtLoopStepClockCnt;
#endif

	while (!id) {
		if (XObj->Timer) {
			const Uint64 frameTime = static_cast<Uint64>(XObj->Timer);
			id = XObj->Quant();
			clockNow = clockNowGlobal = clocki();
			clockDelta = clockNow - xtLoopStepClockCnt;
			XTCORE_FRAME_DELTA = (clockNowGlobal - xtLoopStepClockCntGlobal) / 1000.0;
			XTCORE_FRAME_NORMAL = XTCORE_FRAME_DELTA / 0.050; // 20FPS
			xtLoopStepClockCntGlobal = clockNowGlobal;
#ifdef EMSCRIPTEN
			// Arm the resume point one Timer from where this Quant started, which
			// is what the native SDL_Delay(Timer - clockDelta) below amounts to.
			// Measuring from clockNow instead would add the Quant's own duration
			// twice, and then the deadline always lands past the next animation
			// frame: the loop settles into running a Quant every other frame and
			// stays there, at half rate.
			if (clockDelta < frameTime) {
				xtLoopStepDeadline = clockNow + (frameTime - clockDelta);
			}
#endif
			// std::cout<<"XTCORE_FRAME_DELTA:"<<XTCORE_FRAME_DELTA
			// 		 <<" XTCORE_FRAME_NORMAL:"<<XTCORE_FRAME_NORMAL
			// 		 <<" clockDelta:"<<clockDelta<<std::endl;

			if (clockDelta < frameTime) {
				// std::cout<<"clockDelta:"<<clockDelta<<" Timer:"<<XObj->Timer<<std::endl;
				// Neither branch sleeps under Emscripten: the browser already
				// paces us through emscripten_set_main_loop, and blocking here
				// would stop the loop from ever reaching the next frame.
#ifdef EMSCRIPTEN
				// Spin here and Quants would run as fast as the browser calls
				// us, which is what made the menus and escapes race ahead. The
				// wait is taken at the bottom of the loop instead, after the
				// events and the flip below; the guard at the top of xtLoopStep
				// is what enforces the interval.
#else
				SDL_Delay(static_cast<Uint32>(frameTime - clockDelta));
#endif
			} else {
				std::cout << "Strange deltas clockDelta:" << clockDelta
						  << " Timer:" << XObj->Timer << std::endl;
				if (clockDelta > 300) {
					// something wrong and for preventing abnormal physics set something neutral
					XTCORE_FRAME_NORMAL = 1.0;
				}
			}
			xtLoopStepClockCnt = clocki();
		} else {
			id = XObj->Quant();
		}

		if (!xtSysQuantDisabled)
			xtEventQuant();
		XGR_Flip();
		if (xtExitRequested)
			id = XT_TERMINATE_ID;
#ifdef EMSCRIPTEN
		// Same point SDL_Delay used to resume at: one whole Quant, events
		// pumped and screen flipped. Hand the rest of the interval to the
		// browser and continue in the next animation frame; xtLoopStepRunning
		// keeps that call from re-running Init.
		if (!id) {
			xtLoopStepId = id;
			return true;
		}
#endif
	}

	XObj->Finit();
#ifdef _RTO_LOG_
	xtRTO_Log < "\r\nChange RTO: " <= XObj->ID < " -> " <= id < " frame -> " <= xtFrameCount;
#endif
	XObj = xtGetRuntimeObject(id);
	if (XObj)
		sys_runtimeObjectQuant(XObj->ID);
#ifdef EMSCRIPTEN
	xtLoopStepDeadline = 0;
	xtLoopStepRunning = false;
#endif
	xtLoopStepId = id;
	return XObj != nullptr;
}

void xtCreateRuntimeObjectTable(int len)
{
	int i;
	if(!len) len = XT_DEFAULT_TABLE_SIZE;
	XRObjTableSize = len;
	XRObjTable = new XRuntimeObject*[len];

	for(i = 0; i < len; i ++){
		XRObjTable[i] = NULL;
	}
}

XRuntimeObject* xtGetRuntimeObject(unsigned int id)
{
	if(id == XT_TERMINATE_ID)
		return NULL;
	if(!XRObjTable || !XRObjTableSize || id < 1 || id > XRObjTableSize)
		ErrH.Abort("XTool system error...");
	return XRObjTable[id - 1];
}

void xtRegisterRuntimeObject(XRuntimeObject* p)
{
	if(!XRObjFirst){
		XRObjFirst = XRObjLast = p;
	}
	else {
		XRObjLast -> next = p;
		XRObjLast = p;
	}
	XRObjTable[p -> ID - 1] = p;
}

int xtCallXKey(SDL_Event *m) {
	switch (m->type) {
	case SDL_EVENT_KEY_DOWN:
		if (press_handler) {
			(*press_handler)(m);
		}
		break;
	case SDL_EVENT_KEY_UP:
		if (unpress_handler) {
			(*unpress_handler)(m);
		}
		break;
	case SDL_EVENT_TEXT_INPUT:
		if (press_handler) {
			(*press_handler)(m);
		}
		break;
	case SDL_EVENT_GAMEPAD_BUTTON_DOWN:
		// std::cout<<"CONTROLLERBUTTONDOWN"<<std::endl;
		if (press_handler) {
			(*press_handler)(m);
		}
		break;
	case SDL_EVENT_GAMEPAD_BUTTON_UP:
		// std::cout<<"CONTROLLERBUTTONUP"<<std::endl;
		if (unpress_handler) {
			(*unpress_handler)(m);
		}
		break;
	case SDL_EVENT_MOUSE_WHEEL:
		if (press_handler) {
			(*press_handler)(m);
		}
		break;
	}
	return 1;
}

XList::XList(void) {
	ClearList();
}

XList::~XList(void)
{
}

void XList::AddElement(XListElement* p)
{
	if(!fPtr){
		fPtr = lPtr = p;
		p -> prev = p;
		p -> next = NULL;
	}
	else {
		lPtr -> next = p;
		p -> prev = lPtr;
		p -> next = NULL;
		lPtr = p;
		fPtr -> prev = p;
	}
	ListSize ++;
}

void XList::RemoveElement(XListElement* p)
{
	XListElement* pPtr,*nPtr;

	ListSize --;

	if(ListSize){
		pPtr = p -> prev;
		nPtr = p -> next;

		pPtr -> next = nPtr;
		if(nPtr) nPtr -> prev = pPtr;

		if(p == fPtr) fPtr = nPtr;
		if(p == lPtr) lPtr = pPtr;

		lPtr -> next = NULL;
		fPtr -> prev = lPtr;
	}
	else
		ClearList();
}

void xtRegisterSysQuant(void (*qPtr)(void),int id)
{
	xtAddSysObj(&XSysQuantLst,qPtr,id);
}

void xtUnRegisterSysQuant(int id)
{
	xtDeleteSysObj(&XSysQuantLst,id);
}

void xtRegisterSysFinitFnc(void (*fPtr)(void),int id)
{
	xtAddSysObj(&XSysFinitLst,fPtr,id);
}

void xtDeactivateSysFinitFnc(int id)
{
	xtDeactivateSysObj(&XSysFinitLst,id);
}

void xtUnRegisterSysFinitFnc(int id)
{
	xtDeleteSysObj(&XSysFinitLst,id);
}

void xtDeleteSysObj(XList* lstPtr,int id)
{
	XSysObject* p = (XSysObject*)lstPtr -> fPtr;
	while(p){
		if(p -> ID == id){
			lstPtr -> RemoveElement((XListElement*)p);
			delete p;
			return;
		}
		p = (XSysObject*)p -> next;
	}
}

void xtDeactivateSysObj(XList* lstPtr,int id)
{
	XSysObject* p = (XSysObject*)lstPtr -> fPtr;

	while(p){
		if(p -> ID == id)
			p -> flags |= XSYS_OBJ_INACTIVE;
		p = (XSysObject*)p -> next;
	}
}

void xtAddSysObj(XList* lstPtr,void (*fPtr)(void),int id)
{
	XSysObject* p = (XSysObject*)lstPtr -> fPtr;

	while(p){
		if(p -> ID == id) return;
		p = (XSysObject*)p -> next;
	}

	p = new XSysObject;
	p -> ID = id;
	p -> QuantPtr = (void*)fPtr;

	lstPtr -> AddElement((XListElement*)p);
}

void xtSysQuant(void)
{
	XSysObject* p = (XSysObject*)XSysQuantLst.fPtr;
	while(p){
		(*(XFNC)(p -> QuantPtr))();
		p = (XSysObject*)p -> next;
	}
}

void xtSysFinit(void)
{
	int i,sz = XSysFinitLst.ListSize;
	XSysObject* p = (XSysObject*)XSysFinitLst.lPtr;
	for(i = 0; i < sz; i ++){
		if(!(p -> flags & XSYS_OBJ_INACTIVE))
			(*(XFNC)(p -> QuantPtr))();
		p = (XSysObject*)p -> prev;
	}
}

/*int xtIsActive(void)
{
//	return (WAIT_OBJECT_0 == WaitForSingleObject(hXActiveWndEvent,0)) ? 1 : 0;
};*/

/*int xtNeedExit()
{
//	return (WAIT_OBJECT_0 == WaitForSingleObject(hXNeedExitEvent, 0)) ? 1 : 0;
};*/

void xtSetExit() {
	std::cout << "Exit!" << std::endl;
	xtExitRequested = true;
};


extern int Pause;
int xtDispatchMessage(SDL_Event* msg)
{
	int ret = 0;

	xtMsgHandlerObject* p = XSysHandlerLst.first();
	while(p){
		(*p -> Handler)(msg);
		p = p -> next;
	}

	ret += xtCallXKey(msg);
	 switch (msg->type) {
		 case SDL_EVENT_QUIT:
			 xtSetExit();
			 break;
		 case SDL_EVENT_WINDOW_SHOWN:
		 case SDL_EVENT_WINDOW_RESTORED:
		 case SDL_EVENT_WINDOW_FOCUS_GAINED:
			 if (xtAudioPauseHandler)
				 xtAudioPauseHandler(false);
			 break;
		 case SDL_EVENT_WINDOW_HIDDEN:
		 case SDL_EVENT_WINDOW_FOCUS_LOST:
			 if (xtAudioPauseHandler)
				 xtAudioPauseHandler(true);
			 break;
		 case SDL_EVENT_WINDOW_RESIZED:
			 XGR_Obj.RealX = msg->window.data1;
			 XGR_Obj.RealY = msg->window.data2;
			 if (XGR_Obj.compositor != nullptr) {
				 XGR_Obj.compositor->set_viewport({ 0, 0, XGR_Obj.RealX, XGR_Obj.RealY });
			 }
			 if (renderer::visualbackend::VisualBackendContext::has_renderer()) {
				renderer::visualbackend::VisualBackendContext::backend()->set_screen_resolution(XGR_Obj.RealX, XGR_Obj.RealY);
			 }
			 break;
	 case SDL_EVENT_USER:
		 switch (msg->user.code) {
		 case CursorAnimationEvent:
			 doCursorAnimation();
		 }
		 break;
	 }
	 return ret;
}

void xtClearMessageQueue(void) {
	SDL_Event event;
	while (SDL_PollEvent(&event)) {
		switch (event.type) {
		case SDL_EVENT_KEY_DOWN:
		case SDL_EVENT_MOUSE_BUTTON_DOWN:
		case SDL_EVENT_GAMEPAD_BUTTON_DOWN:
		case SDL_EVENT_MOUSE_MOTION:
		case SDL_EVENT_MOUSE_BUTTON_UP:
		case SDL_EVENT_KEY_UP:
		case SDL_EVENT_GAMEPAD_BUTTON_UP:
			XMsgBuf->put(&event);
			break;
		default:
			xtDispatchMessage(&event);
			break;
		}
	}
}

static void xtProcessMessageBuffer(void) {
	 SDL_Event event;
	 while (XMsgBuf->get(&event))
		 xtDispatchMessage(&event);
}

static void xtEventQuant(void) {
	 xtFrameCount++;
	 xtSysQuant();
	 xtClearMessageQueue();
	 xtProcessMessageBuffer();
}


xtMsgHandlerObject::xtMsgHandlerObject(void (*p)(SDL_Event *), int id) {
	list = NULL;
	ID = id;

	Handler = p;
}

void xtRegisterSysMsgFnc(void (*fPtr)(SDL_Event *), int id) {
	xtMsgHandlerObject *p = new xtMsgHandlerObject(fPtr, id);
	XSysHandlerLst.append(p);
}

void win32_break(char *error, char *msg) {
	std::cout << "--------------------------------\n";
	std::cout << error << "\n";
	std::cout << msg << "\n";
	std::cout << "--------------------------------\n";
}

void *xtGet_hInstance(void) {
	return XAppHinst;
}

void *xtGet_hWnd(void) {
	return XGR_hWnd;
}

void xtSet_hWnd(void *hWnd) {
	XGR_hWnd = hWnd;
}

void xtSysQuantDisable(int v) {
	xtSysQuantDisabled = v;
}

void set_key_handlers(void (*pH)(SDL_Event *), void (*upH)(SDL_Event *)) {
	press_handler = pH;
	unpress_handler = upH;
}
