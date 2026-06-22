import { prisma } from '../config/database';

export class HomepageService {
    async getHomepageData() {
        const [banners, community, testimonials] = await Promise.all([
            prisma.heroSlide.findMany({ orderBy: { order: 'asc' } }),
            prisma.communityShowcaseImage.findMany({ orderBy: { order: 'asc' } }),
            prisma.testimonial.findMany({ orderBy: { order: 'asc' } }),
        ]);

        let sections = await prisma.homepageSection.findMany({ orderBy: { order: 'asc' } });
        if (sections.length === 0) {
            await prisma.homepageSection.createMany({
                data: [
                    { key: 'hackathons', title: 'Upcoming Hackathons', order: 1 },
                    { key: 'ideathons', title: 'Upcoming Ideathons', order: 2 },
                    { key: 'webinars', title: 'Upcoming Webinars', order: 3 },
                    { key: 'events', title: 'Upcoming Events', order: 4 },
                ],
            });
            sections = await prisma.homepageSection.findMany({ orderBy: { order: 'asc' } });
        }

        return { banners, community, testimonials, sections };
    }

    // --- Banners ---
    async addBannerSlide(imageUrl: string) {
        const maxSlide = await prisma.heroSlide.findFirst({
            orderBy: { order: 'desc' },
        });
        const order = maxSlide ? maxSlide.order + 1 : 1;

        return prisma.heroSlide.create({
            data: { imageUrl, order },
        });
    }

    async updateBannerSlideOrder(id: string, order: number) {
        return prisma.heroSlide.update({
            where: { id },
            data: { order },
        });
    }

    async deleteBannerSlide(id: string) {
        return prisma.heroSlide.delete({
            where: { id },
        });
    }

    // --- Community Showcase ---
    async addCommunityImage(imageUrl: string) {
        const maxImage = await prisma.communityShowcaseImage.findFirst({
            orderBy: { order: 'desc' },
        });
        const order = maxImage ? maxImage.order + 1 : 1;

        return prisma.communityShowcaseImage.create({
            data: { imageUrl, order },
        });
    }

    async updateCommunityImageOrder(id: string, order: number) {
        return prisma.communityShowcaseImage.update({
            where: { id },
            data: { order },
        });
    }

    async deleteCommunityImage(id: string) {
        return prisma.communityShowcaseImage.delete({
            where: { id },
        });
    }

    // --- Testimonials ---
    async addTestimonial(data: {
        name: string;
        role: string;
        quote: string;
        avatarUrl?: string | null;
        badge?: string | null;
        link?: string | null;
        order?: number;
    }) {
        let order = data.order;
        if (order === undefined) {
            const maxTestimonial = await prisma.testimonial.findFirst({
                orderBy: { order: 'desc' },
            });
            order = maxTestimonial ? maxTestimonial.order + 1 : 1;
        }

        return prisma.testimonial.create({
            data: { ...data, order },
        });
    }

    async updateTestimonial(
        id: string,
        data: {
            name?: string;
            role?: string;
            quote?: string;
            avatarUrl?: string | null;
            badge?: string | null;
            link?: string | null;
            order?: number;
        }
    ) {
        return prisma.testimonial.update({
            where: { id },
            data,
        });
    }

    async deleteTestimonial(id: string) {
        return prisma.testimonial.delete({
            where: { id },
        });
    }

    async updateSectionsOrder(sections: { id: string; order: number }[]) {
        const updates = sections.map((s) =>
            prisma.homepageSection.update({
                where: { id: s.id },
                data: { order: s.order },
            })
        );
        await prisma.$transaction(updates);
        return prisma.homepageSection.findMany({ orderBy: { order: 'asc' } });
    }
}

export const homepageService = new HomepageService();
