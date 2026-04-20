/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    const internalApiBase = process.env.INTERNAL_API_URL ?? "http://backend:3001";

    return [
      {
        source: "/api/:path*",
        destination: `${internalApiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
