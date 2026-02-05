/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'uprez.dpitcock.dev',
                pathname: '/properties/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3030',
                pathname: '/properties/**',
            },
        ],
    },
}

module.exports = nextConfig
