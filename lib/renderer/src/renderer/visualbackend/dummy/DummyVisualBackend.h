//
// Created by nikita on 30.11.2021.
//

#ifndef VANGERS_DUMMYRENDERER_H
#define VANGERS_DUMMYRENDERER_H

#include "../AbstractVisualBackend.h"

namespace renderer::visualbackend::dummy {
	class DummyVisualBackend: public AbstractVisualBackend{
	public:
		void map_create(const MapDescription& map_description) override;

		void map_destroy() override;

		void map_request_update(const Rect& rect) override;

		void render(const Rect& viewport) override;

		void camera_set_projection(const CameraProjection &camera_projection) override;

		void camera_set_transform(const Transform &transform) override;

		void map_update_palette(uint32_t *palette, int32_t palette_size) override;

		void set_screen_resolution(int32_t width, int32_t height) override;

		void destroy() override;
	};

}


#endif //VANGERS_DUMMYRENDERER_H
