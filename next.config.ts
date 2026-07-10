import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  headers: async () => [
    {
      // Global security headers
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
      ],
    },
    // Only apply static asset caching in production to prevent breaking HMR in development
    ...(isProd
      ? [
          {
            source: "/zevra-logo.webp",
            headers: [
              {
                key: "Cache-Control",
                value: "public, max-age=31536000, immutable",
              },
            ],
          },
          {
            source: "/(.*)\\.(webp|png|jpg|jpeg|svg|ico|avif)",
            headers: [
              {
                key: "Cache-Control",
                value: "public, max-age=86400, stale-while-revalidate=604800",
              },
            ],
          },
        ]
      : []),
  ],
};

export default nextConfig;
