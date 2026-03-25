#include "port.h"
#include <iostream>
#include <algorithm>

#if defined(__APPLE__) && defined(MOBILE)
#include <array>
#include <filesystem>
#include <string_view>

#include "xglobal.h"
#endif

char *strupr(char *string) {
      char *s;

      if (string) {
            for (s = string; *s; ++s)
                  *s = toupper(*s);
      }
      return string;
} 

/**
	
 * C++ version char* style "itoa":
	
 */
	
char* port_itoa( int value, char* result, int base ) {
	// check that the base if valid
	if (base < 2 || base > 16) {
		*result = 0;
		return result;
	}

	char* out = result;
	int quotient = value;
	
	do {
		*out = "0123456789abcdef"[ std::abs( quotient % base ) ];
		++out;
		quotient /= base;
	
	} while ( quotient );
	
	// Only apply negative sign for base 10
	if ( value < 0 && base == 10)
		*out++ = '-';
	
	std::reverse( result, out );
	*out = 0;
	return result;
}

char* port_ltoa( long value, char* result, int base ) {
	// check that the base if valid
	if (base < 2 || base > 16) {
		*result = 0;
		return result; 
		}
	
	char* out = result;
	long quotient = value;
	
	do {
		*out = "0123456789abcdef"[ std::abs( quotient % base ) ];
		++out;
		quotient /= base;
	} while ( quotient );
	
	// Only apply negative sign for base 10
	if ( value < 0 && base == 10)
		*out++ = '-';

	std::reverse( result, out );
	*out = 0;
	return result;
}

char* port_ultoa( unsigned long value, char* result, int base ) {
	// check that the base if valid
	if (base < 2 || base > 16) {
		*result = 0;
		return result;
	}
	
	char* out = result;
	unsigned long quotient = value;
	
	do {
		*out = "0123456789abcdef"[ quotient % base ];
		++out;
		quotient /= base;
	} while ( quotient );
	
	std::reverse( result, out );
	*out = 0;
	return result;
}

#if defined(__APPLE__) && defined(MOBILE)
namespace {

const std::string &get_game_data_path() {
	static std::string game_data_path;

	if (game_data_path.empty()) {
		char *path = SDL_GetBasePath();
		game_data_path += path;
		game_data_path += "data/";
		SDL_free(path);
	}

	return game_data_path;
}

const std::string &get_documents_path() {
	static std::string documents_path;

	if (documents_path.empty()) {
		char *path = SDL_GetPrefPath("com", "vangers");
		documents_path += path;
		SDL_free(path);
	}

	return documents_path;
}

constexpr std::array<std::string_view, 3> local_file_prefix{
	std::string_view{ "options.dat" },
	std::string_view{ "controls.dat" },
	std::string_view{ "savegame/" }
};

bool is_local_path(std::string_view path) {
	const auto p =std::find_if(local_file_prefix.begin(), local_file_prefix.end(), [path](const auto &prefix) {
		return path.find(prefix) == 0;
	});
	return p != local_file_prefix.end();
}

}

const char *get_platform_path(const char *path) {
	static std::string result_path;

	if (is_local_path(std::string_view{ path })) {
		const auto target_path = std::filesystem::path{ get_documents_path() } / path;
		if (!std::filesystem::exists(target_path)) {
			std::cout << "Local file does not exists: " << target_path << std::endl;
			const auto source_path = std::filesystem::path{ get_game_data_path() } / path;
			if (std::filesystem::exists(source_path)) {
				std::cout << "Coping game file: " << source_path << std::endl;
				if (!std::filesystem::copy_file(source_path, target_path)) {
					ErrH.Abort("I/O Error: can not copy game file", XERR_USER, 0, nullptr);
				}
			}
		}
		result_path = target_path.u8string();
	} else {
		result_path = get_game_data_path() + path;
	}

	return result_path.c_str();
}

void create_directory_if_not_exists(const char *name) {
	const auto path = std::filesystem::path(get_documents_path()) / name;
	if (std::filesystem::is_directory(path)) {
		return;
	}

	std::filesystem::create_directory(path);
}

#endif
