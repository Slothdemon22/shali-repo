"use client";

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';

type Props = {
  productId: number;
  productName: string;
  productPrice: string;
  productImage: string;
  availableSizes: string[];
};

export default function AddToCartButton({ productId, productName, productPrice, productImage, availableSizes }: Props) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || 'M');
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      id: productId,
      name: productName,
      price: productPrice,
      image: productImage,
      size: selectedSize,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <>
      <div className="size-selector">
        <div className="size-header">
          <label>Size:</label>
          <button className="text-link">Size chart</button>
        </div>
        <div className="size-options">
          {["XS", "S", "M", "L", "XL"].map(size => {
            const isAvailable = availableSizes.includes(size);
            return (
              <button
                key={size}
                className={`size-btn ${selectedSize === size ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                disabled={!isAvailable}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div className="product-actions">
        <button className="btn-outline-dark full-width" onClick={handleAdd}>
          {added ? '✓ ADDED TO CART' : 'ADD TO CART'}
        </button>
        <button className="btn-dark full-width" onClick={handleAdd}>BUY IT NOW</button>
      </div>
    </>
  );
}
