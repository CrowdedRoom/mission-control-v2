/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow connections from any host (local network access)
  allowedDevOrigins: ['*'],
  // Alternatively use this for Next.js 15+
  // experimental: {
  //   allowedDevOrigins: ['*'],
  // },
};

export default nextConfig;
