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

		ModelHandle model_create(const char* name, void* model) override;

		void model_destroy(ModelHandle model_handle) override;

		ModelInstanceHandle model_instance_create(ModelHandle model_handle, uint8_t color_id) override;

		void model_instance_destroy(ModelInstanceHandle model_instance_handle) override;

		void model_instance_set_transform(ModelInstanceHandle model_instance_handle, const Transform& transform) override;

		void model_instance_set_visible(ModelInstanceHandle model_instance_handle, bool visible) override;

		void destroy() override;
	};

}


#endif //VANGERS_DUMMYRENDERER_H
