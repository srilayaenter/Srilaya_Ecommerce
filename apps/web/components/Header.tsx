import { prisma } from "@/lib/db";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const dbCategories = await prisma.category.findMany({
    where:   { parentId: null, products: { some: { active: true } } },
    orderBy: { name: "asc" },
    select:  { name: true, slug: true },
  });

  // Build category links from DB, then append static "Recipes" blog link
  const categoryLinks = [
    ...dbCategories.map(c => ({ name: c.name, href: `/category/${c.slug}` })),
    { name: "Recipes", href: "/blog" },
  ];

  return <HeaderClient categoryLinks={categoryLinks} />;
}
