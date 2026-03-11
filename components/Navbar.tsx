"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const { openCart, totalItems } = useCart();

  return (
    <>
      <div className="top-bar">
        <p>FREE SHIPPING NATIONWIDE ON ORDERS ABOVE PKR 3,000</p>
      </div>
      <header className="main-header">
        <div className="nav-left">
          <ul>
            <li><Link href="/#popular-picks">New In</Link></li>
            <li><Link href="/#popular-picks">Collections</Link></li>
            <li><Link href="/#popular-picks">Pret</Link></li>
            <li><Link href="/#popular-picks">Unstitched</Link></li>
            <li><Link href="/#popular-picks">Accessories</Link></li>
            <li><Link href="/#popular-picks" className="sale-link">Sale</Link></li>
          </ul>
        </div>
        <div className="nav-center logo">
          <Link href="/"><h1>nishat <span className="pret">pret</span></h1></Link>
        </div>
        <div className="nav-right">
          <a href="#"><i className="fas fa-search"></i></a>
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
