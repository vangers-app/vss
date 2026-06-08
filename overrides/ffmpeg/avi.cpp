//
// Created by caiiiycuk on 03.04.2020.
//
#include <string>
#include <memory>
#include <algorithm>
#include <cassert>
#include <chrono>
#include <cstdint>
#include <cstring>
#include <unordered_map>
#include <vector>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

constexpr int frameWidth = 340;
constexpr int frameHeight = 255;
constexpr int frameBpp = 3;

enum ImageDataRequestKind {
    RequestPreview = 0,
    RequestAnimation = 1,
};

struct ImageFrame {
   uint8_t *rgb = nullptr;
};

struct ImageData {
    std::string file;
    std::string previewFile;

    ImageFrame *previewFrame = new ImageFrame;
    ImageFrame *frames = nullptr;

    int frameCount = 0;
    int activeFrame = 0;
    double activeFrameRenderedAt = 0;

    bool previewLoadStarted = false;
    bool previewLoaded = false;
    bool previewFailed = false;

    bool animationLoadStarted = false;
    bool animationLoaded = false;
    bool animationFailed = false;
    int animationGeneration = 0;
};

struct ImageDataRequest {
    ImageData *data = nullptr;
    ImageDataRequestKind kind = RequestPreview;
    int generation = 0;
};

std::unordered_map<std::string, ImageData *> cachedImageData;
std::vector<ImageDataRequest> requests;

ImageData *selectedImageData = nullptr;
ImageData *activeImageData = nullptr;
int pendingLoads = 0;


static std::string toWebUrl(const std::string &path) {
    if (path.empty() || path.front() == '/') {
        return path;
    }
    return "/" + path;
}

static double currentTimeMs() {
#ifdef __EMSCRIPTEN__
    return emscripten_get_now();
#else
    using Clock = std::chrono::steady_clock;
    return std::chrono::duration<double, std::milli>(
        Clock::now().time_since_epoch()).count();
#endif
}

static void freeAnimationFrames(ImageData *imageData) {
    if (imageData == nullptr) {
        return;
    }

    if (imageData->frames != nullptr) {
        for (int i = 0; i < imageData->frameCount; ++i) {
            delete[] imageData->frames[i].rgb;
            imageData->frames[i].rgb = nullptr;
        }
        delete[] imageData->frames;
    }

    imageData->frames = nullptr;
    imageData->frameCount = 0;
    imageData->activeFrame = 0;
    imageData->activeFrameRenderedAt = 0;
    imageData->animationLoaded = false;
    imageData->animationLoadStarted = false;
    imageData->animationGeneration++;
}

static void copyFrameRgb(uint8_t *destination, const uint8_t *source,
                         int sourceWidth, int sourceYOffset) {
    for (int y = 0; y < frameHeight; ++y) {
        const uint8_t *sourceRow =
            source + ((sourceYOffset + y) * sourceWidth * frameBpp);
        uint8_t *destinationRow = destination + (y * frameWidth * frameBpp);
        memcpy(destinationRow, sourceRow, frameWidth * frameBpp);
    }
}

#ifdef __EMSCRIPTEN__
extern "C" void vss_avi_webp_loaded(ImageData *imageData, int kind,
                                     int generation, int width, int height,
                                     uint8_t *rgb, int rgbSize);
extern "C" void vss_avi_webp_failed(ImageData *imageData, int kind,
                                     int generation);

EM_JS(void, vss_avi_load_webp,
      (ImageData *imageData, int kind, int generation, const char *path,
       const char *fallbackPath),
      {
          const toUrl = (pathPtr) => {
              const path = UTF8ToString(pathPtr);
              if (!path) {
                  return "";
              }
              return path[0] === "/" ? path : "/" + path;
          };

          const loadBitmap = async (url, fallbackUrl) => {
              let response = await fetch(url);
              if (!response.ok && fallbackUrl && fallbackUrl !== url) {
                  response = await fetch(fallbackUrl);
              }
              if (!response.ok) {
                  throw new Error(`Failed to load ${url}: ${response.status}`);
              }
              return createImageBitmap(await response.blob());
          };

          const readRgb = (bitmap) => {
              let canvas;
              if (typeof OffscreenCanvas === "function") {
                  canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
              } else {
                  canvas = document.createElement("canvas");
                  canvas.width = bitmap.width;
                  canvas.height = bitmap.height;
              }

              const context = canvas.getContext("2d", {willReadFrequently: true});
              if (!context) {
                  throw new Error("2D canvas context is not available");
              }

              context.drawImage(bitmap, 0, 0);
              const rgba =
                  context.getImageData(0, 0, bitmap.width, bitmap.height).data;
              const rgbSize = bitmap.width * bitmap.height * 3;
              const rgbPtr = _malloc(rgbSize);
              if (!rgbPtr) {
                  throw new Error("Unable to allocate decoded WebP buffer");
              }

              const rgb = HEAPU8.subarray(rgbPtr, rgbPtr + rgbSize);
              for (let source = 0, target = 0; target < rgbSize;
                   source += 4, target += 3) {
                  rgb[target] = rgba[source];
                  rgb[target + 1] = rgba[source + 1];
                  rgb[target + 2] = rgba[source + 2];
              }

              return [rgbPtr, rgbSize];
          };

          (async () => {
              let bitmap = null;
              let rgbPtr = 0;
              try {
                  bitmap = await loadBitmap(toUrl(path), toUrl(fallbackPath));
                  const result = readRgb(bitmap);
                  rgbPtr = result[0];
                  _vss_avi_webp_loaded(imageData, kind, generation, bitmap.width,
                                       bitmap.height, rgbPtr, result[1]);
              } catch (error) {
                  console.warn("VSS AVI WebP load failed", error);
                  _vss_avi_webp_failed(imageData, kind, generation);
              } finally {
                  if (rgbPtr) {
                      _free(rgbPtr);
                  }
                  if (bitmap && bitmap.close) {
                      bitmap.close();
                  }
              }
          })();
      });
#endif

void loadTick() {
    while (pendingLoads < 3 && !requests.empty()) {
        pendingLoads++;
        ImageDataRequest request = requests.back();
        requests.pop_back();

        ImageData *imageData = request.data;
#ifdef __EMSCRIPTEN__
        if (imageData != nullptr) {
            const std::string fallbackPreview =
                request.kind == RequestPreview
                    ? toWebUrl("resource/video/empty.avi.decoded/encoded.001.webp")
                    : "";
            const std::string file =
                request.kind == RequestPreview ? imageData->previewFile
                                               : imageData->file;
            const std::string url = toWebUrl(file);
            vss_avi_load_webp(imageData, request.kind, request.generation,
                              url.c_str(), fallbackPreview.c_str());
        } else {
            pendingLoads--;
        }
#else
        pendingLoads--;
#endif
    }
}

bool initAvi() {
    return true;
}

#ifdef __EMSCRIPTEN__
extern "C" EMSCRIPTEN_KEEPALIVE void vss_avi_webp_loaded(
    ImageData *imageData, int kind, int generation, int width, int height,
    uint8_t *rgb, int rgbSize) {
    pendingLoads = std::max(0, pendingLoads - 1);

    if (imageData == nullptr || rgb == nullptr ||
        rgbSize < width * height * frameBpp || width < frameWidth ||
        height < frameHeight) {
        if (imageData != nullptr) {
            if (kind == RequestPreview) {
                imageData->previewLoadStarted = false;
                imageData->previewFailed = true;
            } else if (kind == RequestAnimation &&
                       generation == imageData->animationGeneration) {
                imageData->animationLoadStarted = false;
                imageData->animationFailed = true;
            }
        }
        loadTick();
        return;
    }

    if (kind == RequestPreview) {
        delete[] imageData->previewFrame->rgb;
        imageData->previewFrame->rgb =
            new uint8_t[frameWidth * frameHeight * frameBpp];
        copyFrameRgb(imageData->previewFrame->rgb, rgb, width, 0);
        imageData->previewLoaded = true;
        imageData->previewLoadStarted = false;
        imageData->previewFailed = false;
    } else if (kind == RequestAnimation && imageData == selectedImageData &&
               generation == imageData->animationGeneration) {
        const int frameCount = height / frameHeight;
        if (frameCount > 0) {
            freeAnimationFrames(imageData);
            imageData->animationGeneration = generation;
            imageData->frameCount = frameCount;
            imageData->frames = new ImageFrame[frameCount];
            for (int i = 0; i < frameCount; ++i) {
                imageData->frames[i].rgb =
                    new uint8_t[frameWidth * frameHeight * frameBpp];
                copyFrameRgb(imageData->frames[i].rgb, rgb, width,
                             i * frameHeight);
            }
            if (imageData->previewFrame->rgb == nullptr &&
                imageData->frames[0].rgb != nullptr) {
                imageData->previewFrame->rgb =
                    new uint8_t[frameWidth * frameHeight * frameBpp];
                memcpy(imageData->previewFrame->rgb, imageData->frames[0].rgb,
                       frameWidth * frameHeight * frameBpp);
                imageData->previewLoaded = true;
            }
            imageData->animationLoaded = true;
            imageData->animationLoadStarted = false;
            imageData->animationFailed = false;
        }
    }

    loadTick();
}

extern "C" EMSCRIPTEN_KEEPALIVE void vss_avi_webp_failed(ImageData *imageData,
                                                          int kind,
                                                          int generation) {
    pendingLoads = std::max(0, pendingLoads - 1);

    if (imageData != nullptr) {
        if (kind == RequestPreview) {
            imageData->previewLoadStarted = false;
            imageData->previewFailed = true;
        } else if (kind == RequestAnimation &&
                   generation == imageData->animationGeneration) {
            imageData->animationLoadStarted = false;
            imageData->animationFailed = true;
        }
    }

    loadTick();
}
#endif

int AVIopen(char *filename, int flags, int channel, void **avi) {
    static bool inited = initAvi();
    std::string imagePath = std::string(filename) + ".decoded";

    auto imageDataPtr = cachedImageData.find(imagePath);

    ImageData *imageData;
    if (imageDataPtr == cachedImageData.end()) {
        imageData = new ImageData();

        std::string previewFile;
        if (imagePath.find("empty.avi") != std::string::npos) {
            imageData->frames = nullptr;
            imageData->file = "";
            previewFile = "resource/video/empty.avi.decoded/encoded.001.webp";
        } else if (imagePath.find("/text/") != std::string::npos) {
            imageData->frames = nullptr;
            imageData->file = "";
            previewFile = imagePath + "/encoded.001.webp";
        } else {
            imageData->frames = nullptr;
            imageData->file = imagePath + "/encoded.webp";
            previewFile = imagePath + "/encoded.001.webp";
        }
        imageData->previewFile = previewFile;
        cachedImageData.insert(std::make_pair<>(imagePath, imageData));
    } else {
        imageData = imageDataPtr->second;
    }

    *avi = new std::string(imagePath);
    return 1;
}

void AVIplay(void *avi, int xx, int yy) {
}

void AVIstop(void *avi) {
}

void AVIclose(void *avi) {
    delete reinterpret_cast<std::string *>(avi);
}

int AVIwidth(void *avi) {
    return frameWidth;
}

int AVIheight(void *avi) {
    return frameHeight;
}

void AVIPrepareFrame(void *avi) {
    auto *imagePath = reinterpret_cast<std::string *>(avi);
    if (!imagePath) {
        return;
    }

    auto imageDataPtr = cachedImageData.find(*imagePath);
    if (imageDataPtr == cachedImageData.end()) {
        return;
    }

    ImageData *imageData = imageDataPtr->second;
    if (selectedImageData == imageData) {
        return;
    }

    // clear previous to free memory
    if (selectedImageData != nullptr) {
        freeAnimationFrames(selectedImageData);
    }

    selectedImageData = imageData;
    requests.clear();

    if (!imageData->previewLoaded && !imageData->previewLoadStarted &&
        !imageData->previewFailed && !imageData->previewFile.empty()) {
        imageData->previewLoadStarted = true;
        requests.push_back({imageData, RequestPreview, 0});
    }

    if (!imageData->animationLoaded && !imageData->animationLoadStarted &&
        !imageData->animationFailed && !imageData->file.empty()) {
        imageData->animationLoadStarted = true;
        requests.push_back(
            {imageData, RequestAnimation, imageData->animationGeneration});
    }

    loadTick();
}

void AVIDrawFrame(void *avi, int offsetX, int offsetY, int lineWidth, uint32_t* rgba, float bright) {
    bright = std::min(bright, 1.0f);

    auto *imagePath = reinterpret_cast<std::string *>(avi);
    if (!imagePath) {
        return;
    }

    auto imageDataPtr = cachedImageData.find(*imagePath);
    if (imageDataPtr == cachedImageData.end()) {
        return;
    }

    auto imageData = imageDataPtr->second;

    ImageFrame *frame;
    if (imageData->frameCount == 0) {
        frame = imageData->previewFrame;
    } else {
        auto now = currentTimeMs();
        frame = &imageData->frames[imageData->activeFrame];
        if (now - imageData->activeFrameRenderedAt > (1100 / imageData->frameCount)) {
            int nextFrame = (imageData->activeFrame + 1) % imageData->frameCount;

            ImageFrame *next = &imageData->frames[nextFrame];
            if (next->rgb != nullptr) {
                frame = next;
                imageData->activeFrame = nextFrame;
                imageData->activeFrameRenderedAt = now;
            }
        }
    }

    if (frame->rgb == nullptr) {
        return;
    }

    int width = AVIwidth(avi);
    int height = AVIheight(avi);

    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            uint8_t *pixel = (uint8_t *)(rgba + (y + offsetY) * lineWidth + x + offsetX);
            uint8_t *framePixel = frame->rgb + (y * width  + x) * 3;
#if defined(__EMSCRIPTEN__) || defined(NG_MOD)
			pixel[2] = std::max(std::min(framePixel[2] * bright, 255.0f), 0.0f);
			pixel[1] = std::max(std::min(framePixel[1] * bright, 255.0f), 0.0f);
			pixel[0] = std::max(std::min(framePixel[0] * bright, 255.0f), 0.0f);
#else
			pixel[0] = std::max(std::min(framePixel[2] * bright, 255.0f), 0.0f);
            pixel[1] = std::max(std::min(framePixel[1] * bright, 255.0f), 0.0f);
            pixel[2] = std::max(std::min(framePixel[0] * bright, 255.0f), 0.0f);
#endif
            pixel[3] = 255;
        }
    }
}
