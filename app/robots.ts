import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/chat/", "/auth/"],
      },
    ],
    sitemap: "https://zevra.app/sitemap.xml",
  };
}
