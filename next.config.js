/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "unickacademy.pl",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
}
module.exports = nextConfig
