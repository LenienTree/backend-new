import { FastifyInstance } from 'fastify';
import { homepageController } from '../controllers/homepage.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

export default async function homepageRoutes(fastify: FastifyInstance) {
    // ── Public ────────────────────────────────────────────────────────────────

    // GET /api/homepage
    fastify.get('/', homepageController.getHomepageData);

    // ── Admin-only: Banners ───────────────────────────────────────────────────

    // POST /api/homepage/banners
    fastify.post('/banners', {
        preHandler: [authenticate, authorize('ADMIN')],
        handler: homepageController.uploadBanner,
    });

    // PUT /api/homepage/banners/:id
    fastify.put('/banners/:id', {
        preHandler: [authenticate, authorize('ADMIN')],
        handler: homepageController.updateBannerOrder,
    });

    // DELETE /api/homepage/banners/:id
    fastify.delete('/banners/:id', {
        preHandler: [authenticate, authorize('ADMIN')],
        handler: homepageController.deleteBanner,
    });

    // ── Admin-only: Community Images ──────────────────────────────────────────

    // POST /api/homepage/community
    fastify.post('/community', {
        preHandler: [authenticate, authorize('ADMIN')],
        handler: homepageController.uploadCommunityImage,
    });

    // PUT /api/homepage/community/:id
    fastify.put('/community/:id', {
        preHandler: [authenticate, authorize('ADMIN')],
        handler: homepageController.updateCommunityImageOrder,
    });

    // DELETE /api/homepage/community/:id
    fastify.delete('/community/:id', {
        preHandler: [authenticate, authorize('ADMIN')],
        handler: homepageController.deleteCommunityImage,
    });

    // ── Admin-only: Testimonials ──────────────────────────────────────────────

    // POST /api/homepage/testimonials/avatar  (must come before /:id to avoid route conflict)
    fastify.post('/testimonials/avatar', {
        preHandler: [authenticate, authorize('ADMIN')],
        handler: homepageController.uploadTestimonialAvatar,
    });

    // POST /api/homepage/testimonials
    fastify.post('/testimonials', {
        preHandler: [authenticate, authorize('ADMIN')],
        handler: homepageController.addTestimonial,
    });

    // PUT /api/homepage/testimonials/:id
    fastify.put('/testimonials/:id', {
        preHandler: [authenticate, authorize('ADMIN')],
        handler: homepageController.updateTestimonial,
    });

    // DELETE /api/homepage/testimonials/:id
    fastify.delete('/testimonials/:id', {
        preHandler: [authenticate, authorize('ADMIN')],
        handler: homepageController.deleteTestimonial,
    });

    // ── Admin-only: Sections ──────────────────────────────────────────────────

    // PUT /api/homepage/sections/order
    fastify.put('/sections/order', {
        preHandler: [authenticate, authorize('ADMIN')],
        handler: homepageController.updateSectionsOrder,
    });
}
