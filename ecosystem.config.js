module.exports = {
    apps: [
        {
            name: 'lenienttree-api',
            script: 'dist/server.js',
            // t3.small exposes 2 vCPUs but only 1 physical core, and traffic is
            // ~0.06 req/s. A second worker bought no throughput and cost ~90MB
            // plus a duplicate Prisma connection pool, so we pin to one.
            instances: 1,
            exec_mode: 'cluster',   // share port across workers
            env_production: {
                NODE_ENV: 'production',
                UV_THREADPOOL_SIZE: '16',  // expand libuv pool for bcrypt + S3 concurrency
            },
        },
    ],
};
