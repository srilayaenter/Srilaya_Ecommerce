import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://srilaya.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/checkout", "/cart", "/account", "/wishlist", "/invoice"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
