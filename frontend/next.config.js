const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3456',
  },
    allowedDevOrigins: ['192.168.1.19'],
};

export default nextConfig;
