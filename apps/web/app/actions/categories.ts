// 1. Target the exact database client exported variable name from your lib setup
import { prisma } from '../../lib/db';

export async function getCategoryTree() {
  try {
    // 2. Query your category tables using your operational database link
    const categories = await prisma.category.findMany({
      where: {
        parentId: null, // Fetch top-level categories first
      },
      include: {
        children: {
          include: {
            _count: {
              select: { products: true }
            }
          }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        name: 'asc', // Sorts the sidebar links alphabetically by category name
      },
    });
    
    return categories;
  } catch (error) {
    console.error('Failed to fetch category tree:', error);
    return [];
  }
}