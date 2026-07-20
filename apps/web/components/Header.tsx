import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import HeaderClient from "./HeaderClient";

// Static fallback used when the DB is unavailable or slow on cold Lambda starts.
const FALLBACK_CATEGORIES = [
  { name: "Millets",       slug: "millets" },
  { name: "Millet Flakes", slug: "millet-flakes" },
  { name: "Millet Rice",   slug: "millet-rice" },
  { name: "Millet Flour",  slug: "millet-flour" },
  { name: "Millet Rava",   slug: "millet-rava" },
  { name: "Laddu",         slug: "laddu" },
  { name: "Sweeteners",    slug: "sweeteners" },
];

const fetchCategories = unstable_cache(
  () => prisma.category.findMany({
    where:   { parentId: null, products: { some: {} } },
    orderBy: { name: "asc" },
    select:  { name: true, slug: true },
  }),
  ["header-categories"],
  { revalidate: 3600, tags: ["categories"] }
);

async function getCategories() {
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("header-categories-timeout")), 5000)
    );
    return await Promise.race([fetchCategories(), timeout]);
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export default async function Header() {
  const dbCategories = await getCategories();

  // Build category links from DB, then append static "Recipes" blog link
  const categoryLinks = [
    ...dbCategories.map(c => ({ name: c.name, href: `/category/${c.slug}` })),
    { name: "Recipes", href: "/recipes" },
    { name: "Blog", href: "/blog" },
  ];

  return <HeaderClient categoryLinks={categoryLinks} />;
}
