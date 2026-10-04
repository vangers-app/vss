#ifndef _XSOCKET_H
#define _XSOCKET_H

#include <string>

#ifdef EMSCRIPTEN
// Emscripten has no SDL3_net port (only the older sdl2_net one), and there are
// no BSD sockets in a browser anyway - the JavaScript side talks over
// WebSockets through the vss bridge. Forward declare the single type we need so
// the rest of this header, and every caller that takes an XSocket reference,
// still compiles; xsocket.cpp supplies do-nothing bodies.
struct NET_StreamSocket;
#else
#include <SDL3_net/SDL_net.h>
#endif

int XSocketInit(int ErrHUsed = 1);
void XSocketFinit();

extern std::string XSocketLocalHostAddress;
extern std::string XSocketLocalHostExternalAddress;

class XSocket {
	int ErrHUsed;
	NET_StreamSocket *streamSocket;
	std::string remoteAddress;
	int remotePort;

  public:
	XSocket();
	~XSocket();

	XSocket(const XSocket &) = delete;
	XSocket &operator=(const XSocket &) = delete;
	XSocket(XSocket &&donor) noexcept;
	XSocket &operator=(XSocket &&donor) noexcept;

	int open(int IP, int port);
	int open(const char *name, int port);
	void close();

	int send(const char *buffer, int size);
	int send_if_ready(const char *buffer, int size);
	int flush(int ms_time);
	int receive(char *buffer, int size_of_buffer, int ms_time = 0);

	const std::string &address() const {
		return remoteAddress;
	}
	int port() const {
		return remotePort;
	}
	bool is_open() const {
		return streamSocket != nullptr;
	}

	explicit operator bool() const {
		return is_open();
	}
	bool operator!() const {
		return !static_cast<bool>(*this);
	}

  private:
	int tcp_open(const char *name, int port);
};

#endif
