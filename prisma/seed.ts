/**
 * LenientTree — Prisma Seed Script
 * Run with: npm run prisma:seed
 */

import {
    PrismaClient,
    Role,
    EventCategory,
    EventMode,
    EventStatus,
    ApprovalMode,
    PrizeType,
    RegistrationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const hashPassword = async (p: string) => bcrypt.hash(p, 10);

/** Wake Neon endpoint — retries up to maxAttempts times with 4 s gaps. */
async function connectWithRetry(maxAttempts = 8): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await prisma.$queryRaw`SELECT 1`;
            console.log("  ✓ Database connected");
            return;
        } catch (e: any) {
            const isP1001 =
                e?.code === "P1001" || (e?.message ?? "").includes("P1001");
            if (isP1001 && attempt < maxAttempts) {
                console.log(
                    `  ⏳ DB waking up (attempt ${attempt}/${maxAttempts}) — retrying in 4 s…`
                );
                await new Promise((r) => setTimeout(r, 4000));
            } else {
                throw e;
            }
        }
    }
}

async function main() {
    console.log("🌱 Starting seed…");

    // Wake the Neon endpoint first
    await connectWithRetry();

    /* ── 1. CLEAN ────────────────────────────────────────────────────────────── */
    await prisma.certificate.deleteMany();
    await prisma.bookmark.deleteMany();
    await prisma.registration.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.fAQ.deleteMany();
    await prisma.event.deleteMany();
    await prisma.userSkill.deleteMany();
    await prisma.socialLink.deleteMany();
    await prisma.galleryImage.deleteMany();
    await prisma.user.deleteMany();
    console.log("  ✓ Cleared existing data");

    /* ── 2. USERS ─────────────────────────────────────────────────────────────── */
    const password = await hashPassword("Password123");

    const admin = await prisma.user.create({
        data: {
            name: "Super Admin",
            email: "admin@lenienttree.com",
            passwordHash: password,
            role: Role.ADMIN,
            isOrganizer: true,
            college: "LT University",
            graduationYear: 2020,
            bio: "Platform administrator for LenientTree.",
            isEmailVerified: true,
        },
    });

    const org1 = await prisma.user.create({
        data: {
            name: "Arjun Sharma",
            email: "arjun@organizer.com",
            passwordHash: password,
            role: Role.USER,
            isOrganizer: true,
            college: "IIT Madras",
            graduationYear: 2022,
            bio: "Tech event organizer and hackathon enthusiast.",
            isEmailVerified: true,
            socialLinks: {
                create: {
                    linkedin: "https://linkedin.com/in/arjunsharma",
                    github: "https://github.com/arjunsharma",
                },
            },
            skills: {
                create: [
                    { skill: "React" },
                    { skill: "Node.js" },
                    { skill: "Event Management" },
                ],
            },
        },
    });

    const org2 = await prisma.user.create({
        data: {
            name: "Priya Nair",
            email: "priya@organizer.com",
            passwordHash: password,
            role: Role.USER,
            isOrganizer: true,
            college: "NIT Trichy",
            graduationYear: 2021,
            bio: "Passionate about building communities through events.",
            isEmailVerified: true,
            socialLinks: {
                create: {
                    linkedin: "https://linkedin.com/in/priyanair",
                    instagram: "https://instagram.com/priya.events",
                },
            },
            skills: {
                create: [
                    { skill: "Marketing" },
                    { skill: "Community Building" },
                    { skill: "Design" },
                ],
            },
        },
    });

    const org3 = await prisma.user.create({
        data: {
            name: "Ravi Kumar",
            email: "ravi@organizer.com",
            passwordHash: password,
            role: Role.USER,
            isOrganizer: true,
            college: "VIT Vellore",
            graduationYear: 2023,
            bio: "Webinar and conclave organizer.",
            isEmailVerified: true,
        },
    });

    const u1 = await prisma.user.create({
        data: {
            name: "Ananya Krishnan",
            email: "ananya@student.com",
            passwordHash: password,
            role: Role.USER,
            college: "SRM Institute",
            graduationYear: 2026,
            bio: "Full-stack dev, loves hackathons.",
            isEmailVerified: true,
            skills: { create: [{ skill: "Python" }, { skill: "Machine Learning" }] },
            socialLinks: {
                create: {
                    github: "https://github.com/ananya",
                    linkedin: "https://linkedin.com/in/ananya",
                },
            },
        },
    });

    const u2 = await prisma.user.create({
        data: {
            name: "Rohan Mehta",
            email: "rohan@student.com",
            passwordHash: password,
            role: Role.USER,
            college: "BITS Pilani",
            graduationYear: 2025,
            bio: "Designer & developer hybrid.",
            isEmailVerified: true,
            skills: {
                create: [
                    { skill: "Figma" },
                    { skill: "JavaScript" },
                    { skill: "UI/UX" },
                ],
            },
        },
    });

    const u3 = await prisma.user.create({
        data: {
            name: "Sneha Joshi",
            email: "sneha@student.com",
            passwordHash: password,
            role: Role.USER,
            college: "Manipal University",
            graduationYear: 2027,
            bio: "Competitive programmer and open-source contributor.",
            isEmailVerified: true,
            skills: { create: [{ skill: "C++" }, { skill: "Algorithms" }] },
        },
    });

    const u4 = await prisma.user.create({
        data: {
            name: "Vikram Singh",
            email: "vikram@student.com",
            passwordHash: password,
            role: Role.USER,
            college: "Delhi University",
            graduationYear: 2026,
            isEmailVerified: true,
        },
    });

    const u5 = await prisma.user.create({
        data: {
            name: "Meera Patel",
            email: "meera@student.com",
            passwordHash: password,
            role: Role.USER,
            college: "Pune University",
            graduationYear: 2025,
            isEmailVerified: true,
            skills: { create: [{ skill: "Data Science" }, { skill: "SQL" }] },
        },
    });

    console.log(
        "  ✓ Created 9 users (1 admin + 3 organizers + 5 participants)"
    );

    /* ── 3. EVENTS ──────────────────────────────────────────────────────────────── */
    const event1 = await prisma.event.create({
        data: {
            title: "LenientHack 2026",
            subtitle: "Build. Break. Innovate.",
            category: EventCategory.Hackathon,
            organizerId: org1.id,
            mode: EventMode.ONLINE,
            startDate: new Date("2026-04-15T09:00:00Z"),
            endDate: new Date("2026-04-17T18:00:00Z"),
            registrationDeadline: new Date("2026-04-10T23:59:59Z"),
            description:
                "LenientHack 2026 is a 48-hour online hackathon open to all engineering students across India.\n\nBuild impactful products, win cash prizes, and get recognized by top tech companies.\n\nTopics: AI/ML, Web3, HealthTech, EdTech, FinTech.\nTeam size: 2–4 members.",
            prizeType: PrizeType.CASH,
            prizeAmount: 100000,
            maxParticipants: 500,
            approvalMode: ApprovalMode.AUTO,
            status: EventStatus.APPROVED,
            isPaid: false,
            isFeatured: true,
            primaryColor: "#00ff88",
            secondaryColor: "#0a1f1f",
            accentColor: "#f43f5e",
            customFormFields: [
                { label: "GitHub Profile URL", type: "text", required: true },
                { label: "Team Name", type: "text", required: true },
                {
                    label: "Problem Statement Interest",
                    type: "select",
                    required: false,
                    options: ["AI/ML", "Web3", "HealthTech", "EdTech", "FinTech"],
                },
            ],
        },
    });

    const event2 = await prisma.event.create({
        data: {
            title: "NextGen Ideathon 2026",
            subtitle: "Ideas that change the world",
            category: EventCategory.Ideathon,
            organizerId: org2.id,
            mode: EventMode.OFFLINE,
            venueName: "Innovation Hub, IIT Madras Research Park",
            address:
                "IIT Madras Research Park, Kanagam Road, Taramani, Chennai - 600113",
            startDate: new Date("2026-05-01T10:00:00Z"),
            endDate: new Date("2026-05-02T17:00:00Z"),
            registrationDeadline: new Date("2026-04-25T23:59:59Z"),
            description:
                "NextGen Ideathon is an offline idea competition where students present their startup ideas to a panel of VCs and industry experts.\n\nShortlisted ideas get incubation support worth ₹5 lakh.\n\nDomain: Sustainability, Healthcare, Smart Cities.\nOpen to all undergraduates.",
            prizeType: PrizeType.CASH,
            prizeAmount: 50000,
            maxParticipants: 200,
            approvalMode: ApprovalMode.MANUAL,
            status: EventStatus.APPROVED,
            isPaid: false,
            isFeatured: true,
            primaryColor: "#6366f1",
            secondaryColor: "#1e293b",
            accentColor: "#f59e0b",
        },
    });

    const event3 = await prisma.event.create({
        data: {
            title: "CyberSec Conclave 2026",
            subtitle: "Ethical Hacking & Pen-Testing Deep Dive",
            category: EventCategory.Conclave,
            organizerId: org3.id,
            mode: EventMode.ONLINE,
            startDate: new Date("2026-04-20T14:00:00Z"),
            endDate: new Date("2026-04-20T18:00:00Z"),
            registrationDeadline: new Date("2026-04-18T23:59:59Z"),
            description:
                "A 4-hour online conclave featuring cybersecurity experts from CERT-In, HackerOne, and DRDO.\n\nTopics: Penetration Testing, Social Engineering, OWASP Top 10, CTF challenges.\nCertificate of participation provided to all.",
            prizeType: PrizeType.MERCH,
            maxParticipants: 1000,
            approvalMode: ApprovalMode.AUTO,
            status: EventStatus.APPROVED,
            isPaid: false,
            isFeatured: false,
        },
    });

    const event4 = await prisma.event.create({
        data: {
            title: "AI in Healthcare Webinar",
            subtitle: "How ML is transforming medicine",
            category: EventCategory.Webinar,
            organizerId: org1.id,
            mode: EventMode.ONLINE,
            startDate: new Date("2026-03-25T16:00:00Z"),
            endDate: new Date("2026-03-25T18:00:00Z"),
            registrationDeadline: new Date("2026-03-24T23:59:59Z"),
            description:
                "Join leading AI researchers and healthcare professionals discussing how machine learning is revolutionizing diagnostics, drug discovery, and patient care.\n\nSpeakers from AIIMS, Apollo Hospitals, and Microsoft Research.\nQ&A session included.",
            prizeType: PrizeType.NONE,
            maxParticipants: 2000,
            approvalMode: ApprovalMode.AUTO,
            status: EventStatus.APPROVED,
            isPaid: false,
            isFeatured: false,
        },
    });

    const event5 = await prisma.event.create({
        data: {
            title: "CodeClash Championship",
            subtitle: "Battle of the Best Coders",
            category: EventCategory.Hackathon,
            organizerId: org2.id,
            mode: EventMode.OFFLINE,
            venueName: "Birla Institute of Technology, Pilani",
            address: "Vidya Vihar, Pilani, Rajasthan - 333031",
            startDate: new Date("2026-06-10T09:00:00Z"),
            endDate: new Date("2026-06-11T20:00:00Z"),
            registrationDeadline: new Date("2026-06-01T23:59:59Z"),
            description:
                "CodeClash is a 30-hour competitive programming championship held at BITS Pilani campus.\n\nTeams of 2 face off in algorithmic problem-solving rounds judged in real-time.\n\nLanguages: C++, Python, Java.\nAccommodation provided for outstation teams.",
            prizeType: PrizeType.CASH,
            prizeAmount: 75000,
            maxParticipants: 300,
            approvalMode: ApprovalMode.MANUAL,
            status: EventStatus.APPROVED,
            isPaid: false,
            isFeatured: true,
            primaryColor: "#ec4899",
            secondaryColor: "#111827",
            accentColor: "#10b981",
        },
    });

    console.log("  ✓ Created 5 events");

    /* ── 4. FAQs ─────────────────────────────────────────────────────────────── */
    await prisma.fAQ.createMany({
        data: [
            { eventId: event1.id, question: "Who can participate?", answer: "All engineering students (UG/PG) from any college in India can participate. No prior hackathon experience needed!", order: 1 },
            { eventId: event1.id, question: "What is the team size?", answer: "Teams of 2 to 4 members are allowed. Solo participation is not permitted.", order: 2 },
            { eventId: event1.id, question: "Is it free to register?", answer: "Yes! LenientHack 2026 is completely free to register and participate.", order: 3 },
            { eventId: event1.id, question: "Will we get a certificate?", answer: "Yes, all participants who submit their project will receive a certificate. Winners get special achievement certificates.", order: 4 },
            { eventId: event1.id, question: "What should I build?", answer: "Anything — web app, mobile app, AI/ML model, blockchain dApp, or hardware hack — as long as it aligns with one of our themes.", order: 5 },

            { eventId: event2.id, question: "Do I need a working prototype?", answer: "No prototype required. However, having a demo increases your chances in the final round.", order: 1 },
            { eventId: event2.id, question: "Is travel reimbursement available?", answer: "Travel reimbursement is provided for teams shortlisted to the final round.", order: 2 },
            { eventId: event2.id, question: "What should the presentation include?", answer: "Problem statement, solution, target market, business model, and impact metrics. 10 minutes + 5 minutes Q&A.", order: 3 },

            { eventId: event3.id, question: "Do I need prior cybersecurity experience?", answer: "No! The sessions are designed for beginners to intermediate learners. Basic networking knowledge is helpful.", order: 1 },
            { eventId: event3.id, question: "Is this a live or recorded event?", answer: "It is a live event. Recordings will NOT be shared after the event.", order: 2 },

            { eventId: event4.id, question: "Will the recording be available?", answer: "Yes, a recording will be shared with all registered participants within 48 hours after the webinar.", order: 1 },
            { eventId: event4.id, question: "How do I get the meeting link?", answer: "The Zoom link will be emailed to you 24 hours before the event starts.", order: 2 },

            { eventId: event5.id, question: "Can I participate from outside India?", answer: "This is an offline event at BITS Pilani campus. International participants are welcome but must arrange their own travel.", order: 1 },
            { eventId: event5.id, question: "Where can I stay?", answer: "Accommodation in BITS Pilani hostels will be arranged for outstation participants on first-come-first-served basis.", order: 2 },
            { eventId: event5.id, question: "What languages are allowed?", answer: "C++, Python, and Java only. Submissions will be judged on a competitive programming judge platform.", order: 3 },
        ],
    });

    console.log("  ✓ Created FAQs");

    /* ── 5. ANNOUNCEMENTS ─────────────────────────────────────────────────────── */
    await prisma.announcement.createMany({
        data: [
            { eventId: event1.id, createdBy: org1.id, title: "Registration Now Open! 🎉", content: "Registrations for LenientHack 2026 are officially open! Early registration closes on April 5th. Register now to secure your spot.", publishDate: new Date("2026-03-01T10:00:00Z") },
            { eventId: event1.id, createdBy: org1.id, title: "Problem Statements Released 📋", content: "The 5 problem statements for LenientHack 2026 have been released! Each team must choose one domain before the event starts.", publishDate: new Date("2026-03-15T10:00:00Z") },
            { eventId: event1.id, createdBy: org1.id, title: "Mentors Joining Us! 🚀", content: "We have 20+ experienced mentors from Google, Microsoft, and Razorpay joining during the hackathon. Use their expertise to build something great!", publishDate: new Date("2026-03-20T10:00:00Z") },

            { eventId: event2.id, createdBy: org2.id, title: "Judges Announced 🏆", content: "Our panel: 3 venture capitalists, 2 startup founders, and 1 government innovation officer. Prepare to impress!", publishDate: new Date("2026-03-10T10:00:00Z") },
            { eventId: event2.id, createdBy: org2.id, title: "Workshop on Pitch Decks", content: "Free workshop on March 30th on creating compelling pitch decks. Check your email for the invite link.", publishDate: new Date("2026-03-12T10:00:00Z") },

            { eventId: event3.id, createdBy: org3.id, title: "Speaker Lineup Revealed! 🔐", content: "Speakers: Rajesh Kumar (CERT-In), Anita Singh (HackerOne Top 50), and Dr. Mehta (DRDO). An incredible session awaits!", publishDate: new Date("2026-03-05T10:00:00Z") },

            { eventId: event4.id, createdBy: org1.id, title: "1000+ Already Registered!", content: "Over 1000 participants registered in 3 days! Haven't registered yet? Do it now before we hit our limit.", publishDate: new Date("2026-03-08T10:00:00Z") },

            { eventId: event5.id, createdBy: org2.id, title: "Accommodation Portal Open", content: "The accommodation booking portal is now live. Book your hostel room before May 31st. First come, first served!", publishDate: new Date("2026-03-07T10:00:00Z") },
        ],
    });

    console.log("  ✓ Created announcements");

    /* ── 6. REGISTRATIONS ────────────────────────────────────────────────────── */
    await prisma.registration.create({
        data: { eventId: event1.id, userId: u1.id, status: RegistrationStatus.APPROVED, formData: { "GitHub Profile URL": "https://github.com/ananya", "Team Name": "ByteBuilders", "Problem Statement Interest": "AI/ML" } },
    });
    await prisma.registration.create({
        data: { eventId: event1.id, userId: u2.id, status: RegistrationStatus.APPROVED, formData: { "GitHub Profile URL": "https://github.com/rohan", "Team Name": "ByteBuilders", "Problem Statement Interest": "Web3" } },
    });
    await prisma.registration.create({
        data: { eventId: event1.id, userId: u3.id, status: RegistrationStatus.PENDING, formData: { "GitHub Profile URL": "https://github.com/sneha", "Team Name": "CodeCraft" } },
    });
    await prisma.registration.create({ data: { eventId: event2.id, userId: u1.id, status: RegistrationStatus.APPROVED } });
    await prisma.registration.create({ data: { eventId: event2.id, userId: u4.id, status: RegistrationStatus.PENDING } });
    await prisma.registration.create({ data: { eventId: event4.id, userId: u2.id, status: RegistrationStatus.APPROVED } });
    await prisma.registration.create({ data: { eventId: event4.id, userId: u3.id, status: RegistrationStatus.APPROVED } });
    await prisma.registration.create({ data: { eventId: event4.id, userId: u5.id, status: RegistrationStatus.APPROVED } });
    await prisma.registration.create({ data: { eventId: event3.id, userId: u4.id, status: RegistrationStatus.APPROVED } });
    await prisma.registration.create({ data: { eventId: event3.id, userId: u5.id, status: RegistrationStatus.APPROVED } });
    await prisma.registration.create({ data: { eventId: event5.id, userId: u1.id, status: RegistrationStatus.PENDING } });

    console.log("  ✓ Created 11 registrations");

    /* ── 7. BOOKMARKS ────────────────────────────────────────────────────────── */
    await prisma.bookmark.createMany({
        data: [
            { userId: u1.id, eventId: event3.id },
            { userId: u1.id, eventId: event5.id },
            { userId: u2.id, eventId: event1.id },
            { userId: u2.id, eventId: event5.id },
            { userId: u3.id, eventId: event2.id },
            { userId: u3.id, eventId: event4.id },
            { userId: u4.id, eventId: event1.id },
            { userId: u5.id, eventId: event2.id },
            { userId: u5.id, eventId: event5.id },
        ],
    });

    console.log("  ✓ Created 9 bookmarks");

    /* ── 8. CERTIFICATES ─────────────────────────────────────────────────────── */
    await prisma.certificate.createMany({
        data: [
            { userId: u2.id, eventId: event4.id, certificateUrl: "https://lenienttree.com/certs/ai-webinar-rohan.pdf", issuedAt: new Date("2026-03-25T20:00:00Z") },
            { userId: u3.id, eventId: event4.id, certificateUrl: "https://lenienttree.com/certs/ai-webinar-sneha.pdf", issuedAt: new Date("2026-03-25T20:00:00Z") },
            { userId: u5.id, eventId: event4.id, certificateUrl: "https://lenienttree.com/certs/ai-webinar-meera.pdf", issuedAt: new Date("2026-03-25T20:00:00Z") },
        ],
    });

    console.log("  ✓ Created 3 certificates");

    /* ── Done ─────────────────────────────────────────────────────────────────── */
    console.log("\n✅ Seed complete!");
    console.log("   👤 Users:         9");
    console.log("   🎉 Events:        5");
    console.log("   ❓ FAQs:         15");
    console.log("   📢 Announcements: 8");
    console.log("   📝 Registrations: 11");
    console.log("   🔖 Bookmarks:     9");
    console.log("   🏅 Certificates:  3");
    console.log("\n   🔑 All user passwords: Password123");
    console.log("   📧 Quick login:");
    console.log("      Participant →  ananya@student.com");
    console.log("      Organizer   →  arjun@organizer.com");
    console.log("      Admin       →  admin@lenienttree.com");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
