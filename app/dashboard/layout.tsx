"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <Link href="/">
            <h2 className="brand-logo">nishat <span className="pret">pret</span></h2>
          </Link>
          <div className="admin-tag">ADMIN PANEL</div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-group">
            <div className="nav-label">General</div>
            <ul>
              <li>
                <Link href="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>
                  <i className="fas fa-chart-line"></i> Overview
                </Link>
              </li>
            </ul>
          </div>

          <div className="nav-group">
            <div className="nav-label">Catalog</div>
            <ul>
              <li>
                <Link href="/dashboard/categories" className={pathname === '/dashboard/categories' ? 'active' : ''}>
                  <i className="fas fa-tags"></i> Categories
                </Link>
              </li>
              <li>
                <Link href="/dashboard/products" className={pathname === '/dashboard/products' ? 'active' : ''}>
                  <i className="fas fa-box-open"></i> Products
                </Link>
              </li>
              <li>
                <Link href="/dashboard/home-features" className={pathname === '/dashboard/home-features' ? 'active' : ''}>
                  <i className="fas fa-star"></i> Home Features
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="footer-user">
            <div className="user-avatar">AD</div>
            <div className="user-info">
              <span className="user-email">admin@shali.com</span>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST" style={{ width: '100%' }}>
            <button type="submit" className="logout-button">
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-content">
        <header className="content-header">
          <div className="header-meta">
            <div className="header-breadcrumbs">
              <span>Admin Dashboard</span> <i className="fas fa-chevron-right separator"></i> <span>{pathname.split('/').pop() || 'Overview'}</span>
            </div>
          </div>
          <div className="header-actions">
            <div className="header-time">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
        </header>
        
        <div className="content-inner">
          {children}
        </div>
      </main>
    </div>
  );
}
