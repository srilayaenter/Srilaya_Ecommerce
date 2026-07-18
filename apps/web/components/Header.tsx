import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import HeaderClient from "./HeaderClient";

const getCategories = unstable_cache(
  () => prisma.category.findMany({
    where:   { parentId: null, products: { some: {} } },
    orderBy: { name: "asc" },
    select:  { name: true, slug: true },
  }),
  ["header-categories"],
  { revalidate: 3600, tags: ["categories"] }
);

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
