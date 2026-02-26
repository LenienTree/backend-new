import 'dotenv/config';
import app from './app';
import { config } from './config/config';
import { prisma } from './config/database';

const startServer = async () => {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        const server = app.listen(config.port, () => {
            console.log(`
╔═══════════════════════════════════════════╗
║       🌳  LenientTree API Server          ║
╠═══════════════════════════════════════════╣
║  Mode     : ${config.env.padEnd(30)}║
║  Port     : ${String(config.port).padEnd(30)}║
║  URL      : http://localhost:${String(config.port).padEnd(14)}║
╚═══════════════════════════════════════════╝
      `);
        });

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                await prisma.$disconnect();
                console.log('✅ Database disconnected. Server closed.');
                process.exit(0);
            });
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Unhandled errors
        process.on('unhandledRejection', (reason, promise) => {
            console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
            shutdown('unhandledRejection');
        });

        process.on('uncaughtException', (error) => {
            console.error('🔥 Uncaught Exception:', error);
            shutdown('uncaughtException');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
};

startServer();
