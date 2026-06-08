module.exports = {
    apps: [
        {
            name: 'lenienttree-api',
            script: 'dist/server.js',
            instances: 'max',       // one worker per CPU core
            exec_mode: 'cluster',   // share port across workers
            env_production: {
                NODE_ENV: 'production',
                UV_THREADPOOL_SIZE: '16',  // expand libuv pool for bcrypt + S3 concurrency
            },
        },
    ],
};
