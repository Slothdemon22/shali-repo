import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
    take: 8, 
  });

  const homeFeatures = await prisma.homeFeature.findMany({
    orderBy: { order: 'asc' },
    take: 3,
    include: { category: true },
  });

  return (
    <>
      <Navbar />

      {/* HERO SECTION */}
      <section className="hero-section">
        <img src="/images/hero_banner_1773220198541.png" alt="Luxury Pret Models in Grand Architectural Setting" className="hero-img" />
        <div className="hero-overlay">
          <h2 className="hero-logo">nishat <span className="pret">pret</span></h2>
          <a href="#" className="btn-shop-now">SHOP NOW</a>
        </div>
      </section>

      {/* THREE WAYS TO WEAR ELEGANCE - DYNAMIC */}
      <section className="elegance-section">
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

      {/* PROMOTIONAL BANNER */}
      <div className="promo-banner">
        <div className="ticker">
          <span>THE FABRIC OF PAKISTAN &nbsp; | &nbsp; NISHAT &nbsp; | &nbsp; THE FABRIC OF PAKISTAN</span>
        </div>
      </div>

      {/* POPULAR PICKS SECTION - DYNAMIC DATABASE DRIVEN */}
      <section id="popular-picks" className="popular-picks-wrapper">
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
                  <p className="product-price">{product.price}</p>
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

      {/* FOOTER */}
      <Footer />
    </>
  );
}
