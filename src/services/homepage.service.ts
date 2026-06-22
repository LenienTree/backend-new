import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { uploadToS3 } from '../utils/upload';

// Default sections to seed if the table is empty
const DEFAULT_SECTIONS = [
    { key: 'Hackathon',  label: 'Hackathons',  order: 1 },
    { key: 'Ideathon',   label: 'Ideathons',   order: 2 },
    { key: 'Webinar',    label: 'Webinars',    order: 3 },
    { key: 'Conclave',   label: 'Conclaves',   order: 4 },
    { key: 'Other',      label: 'Other Events', order: 5 },
];

export class HomepageService {

    // ─── Public: Get all homepage data ────────────────────────────────────────

    async getHomepageData() {
        // Auto-seed default sections if none exist
        const sectionCount = await prisma.homepageSection.count();
        if (sectionCount === 0) {
            await prisma.homepageSection.createMany({ data: DEFAULT_SECTIONS });
        }

        const [banners, community, testimonials, sections] = await Promise.all([
            prisma.homepageBanner.findMany({
                where: { isActive: true },
                orderBy: { order: 'asc' },
            }),
            prisma.homepageCommunityImage.findMany({
                where: { isActive: true },
                orderBy: { order: 'asc' },
            }),
            prisma.homepageTestimonial.findMany({
                where: { isActive: true },
                orderBy: { order: 'asc' },
            }),
            prisma.homepageSection.findMany({
                orderBy: { order: 'asc' },
            }),
        ]);

        return { banners, community, testimonials, sections };
    }

    // ─── Banners ──────────────────────────────────────────────────────────────

    async uploadBanner(buffer: Buffer, mimetype: string) {
        const result = await uploadToS3(buffer, 'homepage/banners', undefined, mimetype);

        // Determine next order value
        const last = await prisma.homepageBanner.findFirst({ orderBy: { order: 'desc' } });
        const nextOrder = (last?.order ?? 0) + 1;

        return prisma.homepageBanner.create({
            data: { imageUrl: result.secure_url, order: nextOrder },
        });
    }

    async updateBannerOrder(id: string, order: number) {
        const banner = await prisma.homepageBanner.findUnique({ where: { id } });
        if (!banner) throw new AppError('Banner not found.', 404);
        return prisma.homepageBanner.update({ where: { id }, data: { order } });
    }

    async deleteBanner(id: string) {
        const banner = await prisma.homepageBanner.findUnique({ where: { id } });
        if (!banner) throw new AppError('Banner not found.', 404);
        return prisma.homepageBanner.delete({ where: { id } });
    }

    // ─── Community Images ─────────────────────────────────────────────────────

    async uploadCommunityImage(buffer: Buffer, mimetype: string) {
        const result = await uploadToS3(buffer, 'homepage/community', undefined, mimetype);

        const last = await prisma.homepageCommunityImage.findFirst({ orderBy: { order: 'desc' } });
        const nextOrder = (last?.order ?? 0) + 1;

        return prisma.homepageCommunityImage.create({
            data: { imageUrl: result.secure_url, order: nextOrder },
        });
    }

    async updateCommunityImageOrder(id: string, order: number) {
        const img = await prisma.homepageCommunityImage.findUnique({ where: { id } });
        if (!img) throw new AppError('Community image not found.', 404);
        return prisma.homepageCommunityImage.update({ where: { id }, data: { order } });
    }

    async deleteCommunityImage(id: string) {
        const img = await prisma.homepageCommunityImage.findUnique({ where: { id } });
        if (!img) throw new AppError('Community image not found.', 404);
        return prisma.homepageCommunityImage.delete({ where: { id } });
    }

    // ─── Testimonials ─────────────────────────────────────────────────────────

    async uploadTestimonialAvatar(buffer: Buffer, mimetype: string) {
        const result = await uploadToS3(buffer, 'homepage/avatars', undefined, mimetype);
        return { avatarUrl: result.secure_url };
    }

    async addTestimonial(data: {
        name: string;
        role?: string;
        college?: string;
        text: string;
        avatarUrl?: string;
        rating?: number;
    }) {
        const last = await prisma.homepageTestimonial.findFirst({ orderBy: { order: 'desc' } });
        const nextOrder = (last?.order ?? 0) + 1;

        return prisma.homepageTestimonial.create({
            data: { ...data, order: nextOrder },
        });
    }

    async updateTestimonial(id: string, data: Partial<{
        name: string;
        role: string;
        college: string;
        text: string;
        avatarUrl: string;
        rating: number;
        isActive: boolean;
    }>) {
        const testimonial = await prisma.homepageTestimonial.findUnique({ where: { id } });
        if (!testimonial) throw new AppError('Testimonial not found.', 404);
        return prisma.homepageTestimonial.update({ where: { id }, data });
    }

    async deleteTestimonial(id: string) {
        const testimonial = await prisma.homepageTestimonial.findUnique({ where: { id } });
        if (!testimonial) throw new AppError('Testimonial not found.', 404);
        return prisma.homepageTestimonial.delete({ where: { id } });
    }

    // ─── Sections ─────────────────────────────────────────────────────────────

    async updateSectionsOrder(sections: { id: string; order: number }[]) {
        const updates = sections.map(({ id, order }) =>
            prisma.homepageSection.update({ where: { id }, data: { order } })
        );
        await prisma.$transaction(updates);
        return prisma.homepageSection.findMany({ orderBy: { order: 'asc' } });
    }
}

export const homepageService = new HomepageService();
