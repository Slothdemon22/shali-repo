import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import AddToCartButton from '@/components/AddToCartButton';

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
              <p className="product-price">{product.price}</p>
              
              {product.sku && <p className="product-sku">SKU: {product.sku}</p>}
              
              <div className="payment-installments">
                <span className="badge-purple">boldpay</span> Pay in 3 installments of <strong>Rs.{(parseFloat(product.price.replace(/[^\d.]/g, '')) / 3).toFixed(2)}</strong>
              </div>

              {/* Client Component for size selection + add to cart */}
              <AddToCartButton
                productId={product.id}
                productName={product.name}
                productPrice={product.price}
                productImage={product.image}
                availableSizes={product.sizes}
              />

              {/* Product Details */}
              <div className="product-tabs">
                <div className="tab-content">
                  <div className="tab-pane">
                    <p><strong>Product Detail:</strong></p>
                    <p>{product.description || 'Premium quality attire from Nishat Linen.'}</p>
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
                  <p>{p.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
