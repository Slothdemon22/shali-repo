import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import AddToCartButton from '@/components/AddToCartButton';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: idStr } = await params;
  const id = parseInt(idStr);

  if (!Number.isFinite(id)) {
    return {
      title: 'Product',
      robots: { index: false, follow: false },
    };
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) {
    return {
      title: 'Product Not Found',
      robots: { index: false, follow: false },
    };
  }

  const description =
    product.description ||
    `${product.name} in ${product.category?.name || 'premium collection'} at ${product.price}.`;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/product/${product.id}`,
    },
    openGraph: {
      type: 'website',
      url: `${siteUrl}/product/${product.id}`,
      title: `${product.name} | Fatimas Collection`,
      description,
      images: product.image
        ? [{ url: product.image, alt: product.name }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Fatimas Collection`,
      description,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) {
    return (
      <>
        <Navbar />
        <div style={{ padding: '100px 20px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Product Not Found</h2>
          <p>The collection item you are looking for is no longer available.</p>
          <Link href="/" className="btn-primary" style={{ display: 'inline-block', marginTop: '20px' }}>Return Home</Link>
        </div>
      </>
    );
  }

  // Fetch related products
  const allData = await prisma.product.findMany({
    take: 50,
    include: { category: true }
  });
  
  const otherCats = allData.filter((p: any) => p.categoryId !== product.categoryId && p.id !== id);
  const sameCat = allData.filter((p: any) => p.categoryId === product.categoryId && p.id !== id);
  const combined = [...otherCats, ...sameCat].sort(() => 0.5 - Math.random());
  const relatedProducts = combined.slice(0, 4);

  const allImages = [product.image, ...(product.gallery || [])];

  return (
    <>
      <Navbar />
      <div className="product-details-container">
        {/* Breadcrumb */}
        <div className="product-breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href={`/?category=${product.categoryId}`}>{product.category?.name}</Link>
          <span>/</span>
          <span className="current">{product.name}</span>
        </div>

        <div className="product-details-main">
          {/* Left: Scrolling Gallery */}
          <div className="product-gallery-scroll">
            {allImages.map((img, index) => (
              <div key={index} className="gallery-image-wrapper">
                <img src={img} alt={`${product.name} - View ${index + 1}`} />
              </div>
            ))}
          </div>

          {/* Right: Sticky Details Panel */}
          <div className="product-info-sticky">
            <div className="product-info-content">
              <h1 className="product-title">{product.name}</h1>
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
              
              {product.sku && <p className="product-sku">SKU: {product.sku}</p>}
              


              {/* Client Component for size selection + add to cart */}
              <AddToCartButton
                productId={product.id}
                productName={product.name}
                productPrice={product.discountPrice || product.price}
                productImage={product.image}
                availableSizes={product.sizes}
              />

              {/* Product Details */}
              <div className="product-tabs">
                <div className="tab-content">
                  <div className="tab-pane">
                    <p><strong>Product Detail:</strong></p>
                    <p>{product.description || 'Premium quality attire from Fatimas Collection.'}</p>
                    <ul>
                      <li><strong>Fabric:</strong> {product.fabric || 'Premium Cambric'}</li>
                      <li><strong>Color:</strong> {product.color || 'As shown'}</li>
                      <li><strong>Style:</strong> {product.category?.name}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* "You May Also Like" Section */}
        <section className="also-like-section">
          <h2 className="section-title">YOU MAY ALSO LIKE</h2>
          <div className="also-like-grid">
            {relatedProducts.map((p: any) => (
              <Link href={`/product/${p.id}`} key={p.id} className="related-product-card" scroll={true}>
                <div className="img-holder">
                  <img src={p.image} alt={p.name} />
                </div>
                <div className="info">
                  <h3>{p.name}</h3>
                  {p.discountPrice ? (
                    <div className="product-price-row" style={{ flexDirection: 'row', gap: '8px' }}>
                      <span className="product-price-original" style={{ fontSize: '0.8rem' }}>{p.price}</span>
                      <span className="product-price product-price-discounted" style={{ fontSize: '0.9rem' }}>{p.discountPrice}</span>
                    </div>
                  ) : (
                    <p>{p.price}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
