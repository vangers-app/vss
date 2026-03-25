#ifndef __PORT_H
#define __PORT_H

/**
	
 * C++ version char* style "itoa":
	
 */
	
char* port_itoa( int value, char* result, int base );

char* port_ltoa( long value, char* result, int base );

char* port_ultoa( unsigned long value, char* result, int base );

#if defined(__unix__) || defined(__APPLE__)
char *strupr(char *string);
#endif

#if defined(__APPLE__) && defined(MOBILE)
#ifdef __cplusplus
extern "C" {
#endif

const char *get_platform_path(const char *path);
void create_directory_if_not_exists(const char *name);

#ifdef __cplusplus
}
#endif

#endif

#endif
