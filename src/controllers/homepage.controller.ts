import { FastifyRequest, FastifyReply } from 'fastify';
import { homepageService } from '../services/homepage.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

export class HomepageController {

    // ─── Public ───────────────────────────────────────────────────────────────

    /** GET /api/homepage — returns all homepage sections, banners, community, testimonials */
    getHomepageData = async (_request: FastifyRequest, reply: FastifyReply) => {
        const data = await homepageService.getHomepageData();
        sendSuccess(reply, data);
    };

    // ─── Banners ──────────────────────────────────────────────────────────────

    /** POST /api/homepage/banners — upload a banner image */
    uploadBanner = async (request: FastifyRequest, reply: FastifyReply) => {
        const fileData = await request.file();
        if (!fileData) throw new Error('No file uploaded');
        const buffer = await fileData.toBuffer();
        const result = await homepageService.uploadBanner(buffer, fileData.mimetype);
        sendCreated(reply, result, 'Banner uploaded');
    };

    /** PUT /api/homepage/banners/:id — update banner display order */
    updateBannerOrder = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const { order } = request.body as { order: number };
        const result = await homepageService.updateBannerOrder(id, order);
        sendSuccess(reply, result, 'Banner order updated');
    };

    /** DELETE /api/homepage/banners/:id */
    deleteBanner = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        await homepageService.deleteBanner(id);
        sendSuccess(reply, null, 'Banner deleted');
    };

    // ─── Community Images ─────────────────────────────────────────────────────

    /** POST /api/homepage/community — upload a community image */
    uploadCommunityImage = async (request: FastifyRequest, reply: FastifyReply) => {
        const fileData = await request.file();
        if (!fileData) throw new Error('No file uploaded');
        const buffer = await fileData.toBuffer();
        const result = await homepageService.uploadCommunityImage(buffer, fileData.mimetype);
        sendCreated(reply, result, 'Community image uploaded');
    };

    /** PUT /api/homepage/community/:id — update community image order */
    updateCommunityImageOrder = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const { order } = request.body as { order: number };
        const result = await homepageService.updateCommunityImageOrder(id, order);
        sendSuccess(reply, result, 'Community image order updated');
    };

    /** DELETE /api/homepage/community/:id */
    deleteCommunityImage = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        await homepageService.deleteCommunityImage(id);
        sendSuccess(reply, null, 'Community image deleted');
    };

    // ─── Testimonials ─────────────────────────────────────────────────────────

    /** POST /api/homepage/testimonials/avatar — upload avatar, returns URL */
    uploadTestimonialAvatar = async (request: FastifyRequest, reply: FastifyReply) => {
        const fileData = await request.file();
        if (!fileData) throw new Error('No file uploaded');
        const buffer = await fileData.toBuffer();
        const result = await homepageService.uploadTestimonialAvatar(buffer, fileData.mimetype);
        sendSuccess(reply, result, 'Avatar uploaded');
    };

    /** POST /api/homepage/testimonials — add a testimonial */
    addTestimonial = async (request: FastifyRequest, reply: FastifyReply) => {
        const result = await homepageService.addTestimonial(request.body as any);
        sendCreated(reply, result, 'Testimonial added');
    };

    /** PUT /api/homepage/testimonials/:id */
    updateTestimonial = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const result = await homepageService.updateTestimonial(id, request.body as any);
        sendSuccess(reply, result, 'Testimonial updated');
    };

    /** DELETE /api/homepage/testimonials/:id */
    deleteTestimonial = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        await homepageService.deleteTestimonial(id);
        sendSuccess(reply, null, 'Testimonial deleted');
    };

    // ─── Sections ─────────────────────────────────────────────────────────────

    /** PUT /api/homepage/sections/order — reorder sections */
    updateSectionsOrder = async (request: FastifyRequest, reply: FastifyReply) => {
        const { sections } = request.body as { sections: { id: string; order: number }[] };
        const result = await homepageService.updateSectionsOrder(sections);
        sendSuccess(reply, result, 'Sections order updated');
    };
}

export const homepageController = new HomepageController();
