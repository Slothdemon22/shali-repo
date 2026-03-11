"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCart();

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="cart-backdrop" onClick={closeCart} />}

      {/* Sidebar */}
      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-sidebar-header">
          <h2>CART</h2>
          <button onClick={closeCart} className="cart-close-btn" aria-label="Close Cart">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="cart-sidebar-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <i className="fas fa-shopping-bag"></i>
              <p>Your cart is empty</p>
              <Link href="/" onClick={closeCart} className="cart-continue-btn">CONTINUE SHOPPING</Link>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={`${item.id}-${item.size}`}>
                <div className="cart-item-image">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="cart-item-details">
                  <h4>{item.name}</h4>
                  <p className="cart-item-price">{item.price}</p>
                  <p className="cart-item-size">Size: {item.size}</p>
                  <div className="cart-item-controls">
                    <div className="qty-control">
                      <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}>+</button>
                    </div>
                    <button className="cart-remove-btn" onClick={() => removeItem(item.id, item.size)}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-sidebar-footer">
            <div className="cart-note">
              <p className="cart-tax-note">Taxes and shipping calculated at checkout</p>
            </div>
            <button className="cart-checkout-btn">
              CHECKOUT &nbsp;•&nbsp; Rs. {totalPrice.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </button>
            <div className="cart-installment-note">
              <span className="badge-purple-sm">baadmay</span> Pay in 3 Installments of <strong>Rs. {(totalPrice / 3).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
