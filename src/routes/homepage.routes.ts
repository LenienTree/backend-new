import { FastifyInstance } from 'fastify';
import { homepageController } from '../controllers/homepage.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { testimonialSchema, updateOrderSchema, updateSectionsOrderSchema } from '../validators/homepage.validator';

export default async function homepageRoutes(fastify: FastifyInstance) {
    // ── Public ────────────────────────────────────────────────────────────────────
    
    // GET /api/homepage
    fastify.get('/', homepageController.getHomepageData);

    // ── Admin-Only ────────────────────────────────────────────────────────────────
    fastify.register(async (adminScope) => {
        adminScope.addHook('preHandler', authenticate);
        adminScope.addHook('preHandler', authorize('ADMIN'));

        // POST /api/homepage/banners
        adminScope.post('/banners', homepageController.addBannerSlide);

        // PUT /api/homepage/banners/:id
        adminScope.put('/banners/:id', {
            preHandler: validate(updateOrderSchema),
            handler: homepageController.updateBannerSlideOrder
        });

        // DELETE /api/homepage/banners/:id
        adminScope.delete('/banners/:id', homepageController.deleteBannerSlide);

        // POST /api/homepage/community
        adminScope.post('/community', homepageController.addCommunityImage);

        // PUT /api/homepage/community/:id
        adminScope.put('/community/:id', {
            preHandler: validate(updateOrderSchema),
            handler: homepageController.updateCommunityImageOrder
        });

        // DELETE /api/homepage/community/:id
        adminScope.delete('/community/:id', homepageController.deleteCommunityImage);

        // POST /api/homepage/testimonials/avatar
        adminScope.post('/testimonials/avatar', homepageController.uploadTestimonialAvatar);

        // POST /api/homepage/testimonials
        adminScope.post('/testimonials', {
            preHandler: validate(testimonialSchema),
            handler: homepageController.addTestimonial
        });

        // PUT /api/homepage/testimonials/:id
        adminScope.put('/testimonials/:id', {
            preHandler: validate(testimonialSchema.partial()),
            handler: homepageController.updateTestimonial
        });

        // DELETE /api/homepage/testimonials/:id
        adminScope.delete('/testimonials/:id', homepageController.deleteTestimonial);

        // PUT /api/homepage/sections/order
        adminScope.put('/sections/order', {
            preHandler: validate(updateSectionsOrderSchema),
            handler: homepageController.updateSectionsOrder
        });
    });
}
