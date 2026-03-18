import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  try {
    const products = await prisma.product.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${siteUrl}/product/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticUrls, ...productUrls];
  } catch {
    // Return static fallback if DB is unavailable.
    return staticUrls;
  }
}
