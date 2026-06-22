import { FastifyReply } from 'fastify';
import { AuthRequest } from '../types';
import { homepageService } from '../services/homepage.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { uploadToS3 } from '../utils/upload';

export class HomepageController {
    getHomepageData = async (request: AuthRequest, reply: FastifyReply) => {
        const data = await homepageService.getHomepageData();
        sendSuccess(reply, data);
    };

    // --- Banners ---
    addBannerSlide = async (request: AuthRequest, reply: FastifyReply) => {
        const fileData = await request.file();
        if (!fileData) throw new Error('No file uploaded');

        const buffer = await fileData.toBuffer();
        const result = await uploadToS3(buffer, 'banners', undefined, fileData.mimetype);

        const slide = await homepageService.addBannerSlide(result.secure_url);
        sendCreated(reply, slide, 'Banner slide added');
    };

    updateBannerSlideOrder = async (request: AuthRequest, reply: FastifyReply) => {
        const { order } = request.body as { order: number };
        const slide = await homepageService.updateBannerSlideOrder(
            (request.params as any).id as string,
            order
        );
        sendSuccess(reply, slide, 'Banner order updated');
    };

    deleteBannerSlide = async (request: AuthRequest, reply: FastifyReply) => {
        await homepageService.deleteBannerSlide((request.params as any).id as string);
        sendSuccess(reply, null, 'Banner slide deleted');
    };

    // --- Community Showcase ---
    addCommunityImage = async (request: AuthRequest, reply: FastifyReply) => {
        const fileData = await request.file();
        if (!fileData) throw new Error('No file uploaded');

        const buffer = await fileData.toBuffer();
        const result = await uploadToS3(buffer, 'gallery', undefined, fileData.mimetype);

        const image = await homepageService.addCommunityImage(result.secure_url);
        sendCreated(reply, image, 'Community showcase image added');
    };

    updateCommunityImageOrder = async (request: AuthRequest, reply: FastifyReply) => {
        const { order } = request.body as { order: number };
        const image = await homepageService.updateCommunityImageOrder(
            (request.params as any).id as string,
            order
        );
        sendSuccess(reply, image, 'Community image order updated');
    };

    deleteCommunityImage = async (request: AuthRequest, reply: FastifyReply) => {
        await homepageService.deleteCommunityImage((request.params as any).id as string);
        sendSuccess(reply, null, 'Community image deleted');
    };

    // --- Testimonials ---
    uploadTestimonialAvatar = async (request: AuthRequest, reply: FastifyReply) => {
        const fileData = await request.file();
        if (!fileData) throw new Error('No file uploaded');

        const buffer = await fileData.toBuffer();
        const result = await uploadToS3(buffer, 'avatars', undefined, fileData.mimetype);
        sendSuccess(reply, { avatarUrl: result.secure_url }, 'Avatar uploaded');
    };

    addTestimonial = async (request: AuthRequest, reply: FastifyReply) => {
        const testimonial = await homepageService.addTestimonial(request.body as any);
        sendCreated(reply, testimonial, 'Testimonial added');
    };

    updateTestimonial = async (request: AuthRequest, reply: FastifyReply) => {
        const testimonial = await homepageService.updateTestimonial(
            (request.params as any).id as string,
            request.body as any
        );
        sendSuccess(reply, testimonial, 'Testimonial updated');
    };

    deleteTestimonial = async (request: AuthRequest, reply: FastifyReply) => {
        await homepageService.deleteTestimonial((request.params as any).id as string);
        sendSuccess(reply, null, 'Testimonial deleted');
    };

    updateSectionsOrder = async (request: AuthRequest, reply: FastifyReply) => {
        const { sections } = request.body as { sections: { id: string; order: number }[] };
        const updated = await homepageService.updateSectionsOrder(sections);
        sendSuccess(reply, updated, 'Homepage sections order updated');
    };
}

export const homepageController = new HomepageController();
