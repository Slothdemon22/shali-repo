import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomePageAnimations from '@/components/HomePageAnimations';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Explore the latest luxury pret, ready to wear, unstitched outfits and popular picks at Fatimas Collection.',
  alternates: {
    canonical: '/',
  },
};

export default async function Home({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const selectedCategoryId = category ? parseInt(category) : null;

  // Fetch actual data using Prisma
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'asc' },
  });
  
  const products = await prisma.product.findMany({
    where: selectedCategoryId ? { categoryId: selectedCategoryId } : {},
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  const homeFeatures = await prisma.homeFeature.findMany({
    orderBy: { order: 'asc' },
    take: 3,
    include: { category: true },
  });

  const heroImageSetting = await prisma.siteSettings.findUnique({
    where: { key: 'hero_image_url' },
  });
  const heroImage = heroImageSetting?.value || '/images/hero_banner_1773220198541.png';
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Popular Picks',
    itemListElement: products.map((product: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}/product/${product.id}`,
      name: product.name,
    })),
  };

  return (
    <>
      <Navbar />

      {/* HERO SECTION */}
      <section className="hero-section premium-hero">
        <div className="hero-luxury-glow" />
        <img src={heroImage} alt="Luxury Pret Models in Grand Architectural Setting" className="hero-img" />
        <div className="hero-overlay">
          <p className="hero-kicker">NEW LUXURY DROP 2026</p>
          <h1 className="hero-logo">Fatimas <span className="pret">Collection</span></h1>
          <p className="hero-subtitle">Timeless silhouettes, rich fabrics, and elevated craftsmanship for every occasion.</p>
          <div className="hero-cta-row">
            <Link href="/#popular-picks" className="btn-shop-now">SHOP NOW</Link>
            <Link href="/#elegance-ways" className="btn-shop-now light">EXPLORE STYLES</Link>
          </div>
          <div className="hero-scroll-indicator">SCROLL TO DISCOVER</div>
        </div>
      </section>

      {/* THREE WAYS TO WEAR ELEGANCE - DYNAMIC */}
      <section id="elegance-ways" className="elegance-section premium-section">
        <div className="elegance-header-container">
          <h3 className="elegance-header"><span>THREE WAYS TO WEAR ELEGANCE</span></h3>
        </div>
        <div className="elegance-grid">
          {homeFeatures.map((feature: any) => (
            <div className="elegance-item" key={feature.id}>
              <img src={feature.image} alt={feature.title} />
              <div className="elegance-content">
                <h4>{feature.title}</h4>
                <Link
                  href={feature.categoryId ? `/?category=${feature.categoryId}#popular-picks` : '/#popular-picks'}
                  className="btn-link"
                >
                  SHOP NOW
                </Link>
              </div>
            </div>
          ))}
          {/* Fallback if no features */}
          {homeFeatures.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', gridColumn: '1 / -1' }}>
              Add some featured collections in the admin dashboard!
            </div>
          )}
        </div>
      </section>



      {/* POPULAR PICKS SECTION - DYNAMIC DATABASE DRIVEN */}
      <section id="popular-picks" className="popular-picks-wrapper premium-section">
        <div className="popular-picks-header">
          <p className="subtitle">DISCOVER OUR MOST-POPULAR PICKS</p>
          <ul className="popular-categories">
            <li>
              <Link href="/" scroll={false} className={!selectedCategoryId ? "active" : ""}>
                ALL
              </Link>
            </li>
            {categories.length > 0 ? (
              categories.map((cat: any) => (
                <li key={cat.id}>
                  <Link href={`?category=${cat.id}`} scroll={false} className={selectedCategoryId === cat.id ? "active" : ""}>
                    {cat.name}
                  </Link>
                </li>
              ))
            ) : (
              <li><a href="#" className="active">NO CATEGORIES YET</a></li>
            )}
          </ul>
        </div>
        <div className="popular-grid">
          {products.length > 0 ? (
            products.map((product: any) => (
              <Link href={`/product/${product.id}`} className="popular-card" key={product.id}>
                <div className="img-wrapper">
                  <img src={product.image} alt={product.name} />
                </div>
                <div className="popular-info">
                  <p className="product-title">{product.name}</p>
                  <p className="product-category">{product.category?.name}</p>
                  {product.badge && <span className="badge-new">{product.badge}</span>}
                  <div className="product-price-row">
                    {product.discountPrice ? (
                      <>
                        <span className="product-price-original">{product.price}</span>
                        <span className="product-price product-price-discounted">{product.discountPrice}</span>
                      </>
                    ) : (
                      <span className="product-price">{product.price}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666' }}>
              No products found in the database. Add some from the admin dashboard!
            </div>
          )}
        </div>
      </section>

      {/* FLEXIBLE CONTENT AREA */}
      <section className="flexible-area">
        <div className="content">
          <h2>ELEVATING EVERYDAY STYLE</h2>
          <p>Explore our curated collections designed for the modern individual.</p>
        </div>
      </section>

      <HomePageAnimations />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      {/* FOOTER */}
      <Footer />
    </>
  );
}
