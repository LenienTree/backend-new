import 'dotenv/config';
import app from './app';
import { config } from './config/config';
import { prisma } from './config/database';
import { initEmailSystem } from './modules/email';

const startServer = async () => {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Initialize automated email notification system
        await initEmailSystem().catch((err) => {
            console.error('🔥 Failed to initialize email system:', err);
        });

        const address = await app.listen({ port: config.port, host: '0.0.0.0' });
        console.log(`
╔═══════════════════════════════════════════╗
║       🌳  LenientTree API Server          ║
╠═══════════════════════════════════════════╣
║  Mode     : ${config.env.padEnd(30)}║
║  Port     : ${String(config.port).padEnd(30)}║
║  URL      : ${address.padEnd(31)}║
╚═══════════════════════════════════════════╝
      `);

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
            await app.close();
            await prisma.$disconnect();
            console.log('✅ Database disconnected. Server closed.');
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Unhandled async rejection — log only, do NOT shut down.
        // Calling shutdown() here kills the server mid-request on any transient error
        // (DB cold-start, network blip, etc.), causing 502s and broken JSON responses.
        process.on('unhandledRejection', (reason) => {
            console.error('⚠️  Unhandled Rejection (non-fatal):', reason);
        });

        // Uncaught synchronous exception — this IS fatal, shut down cleanly.
        process.on('uncaughtException', (error) => {
            console.error('🔥 Uncaught Exception (fatal):', error);
            shutdown('uncaughtException');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
};

startServer();
