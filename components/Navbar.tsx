"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

type Category = {
  id: number;
  name: string;
};

export default function Navbar() {
  const { openCart, totalItems } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [latestCategories, setLatestCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          setLatestCategories(data.slice(0, 4));
        }
      } catch {
        // Keep navbar usable even if category fetch fails.
      }
    };

    loadCategories();
  }, []);

  return (
    <>

      <header className="main-header">
        <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle Menu">
          <i className={isMobileMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </button>
        
        <div className={`nav-left ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul>
            {latestCategories.length > 0 ? (
              latestCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/?category=${category.id}#popular-picks`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                </li>
              ))
            ) : (
              <>
                <li><Link href="/#popular-picks" onClick={() => setIsMobileMenuOpen(false)}>New In</Link></li>
                <li><Link href="/#popular-picks" onClick={() => setIsMobileMenuOpen(false)}>Collections</Link></li>
                <li><Link href="/#popular-picks" onClick={() => setIsMobileMenuOpen(false)}>Pret</Link></li>
                <li><Link href="/#popular-picks" onClick={() => setIsMobileMenuOpen(false)}>Unstitched</Link></li>
              </>
            )}
          </ul>
        </div>
        <div className="nav-center logo">
          <Link href="/"><h1>Fatimas <span className="pret">Collection</span></h1></Link>
        </div>
        <div className="nav-right">

          <a href="#"><i className="fas fa-user"></i></a>
          <button onClick={openCart} className="cart-trigger-btn" aria-label="Open Cart">
            <i className="fas fa-shopping-bag"></i>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
        </div>
      </header>
    </>
  );
}
