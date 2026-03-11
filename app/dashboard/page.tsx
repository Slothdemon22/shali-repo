import Link from 'next/link';

export default function DashboardOverview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.2rem', color: '#0f172a', marginBottom: '8px' }}>
        Welcome, Shali Kake 👋
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '40px' }}>
        Manage your storefront from the sidebar, or jump to a section below.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', width: '100%', maxWidth: '700px' }}>
        <Link href="/dashboard/categories" className="admin-form-card" style={{ textDecoration: 'none', padding: '30px 20px', textAlign: 'center', transition: 'all 0.3s', cursor: 'pointer' }}>
          <i className="fas fa-tags" style={{ fontSize: '1.8rem', color: '#ca8a04', marginBottom: '12px', display: 'block' }}></i>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.05em' }}>Categories</h3>
        </Link>
        <Link href="/dashboard/products" className="admin-form-card" style={{ textDecoration: 'none', padding: '30px 20px', textAlign: 'center', transition: 'all 0.3s', cursor: 'pointer' }}>
          <i className="fas fa-box-open" style={{ fontSize: '1.8rem', color: '#ca8a04', marginBottom: '12px', display: 'block' }}></i>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.05em' }}>Products</h3>
        </Link>
        <Link href="/dashboard/home-features" className="admin-form-card" style={{ textDecoration: 'none', padding: '30px 20px', textAlign: 'center', transition: 'all 0.3s', cursor: 'pointer' }}>
          <i className="fas fa-star" style={{ fontSize: '1.8rem', color: '#ca8a04', marginBottom: '12px', display: 'block' }}></i>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.05em' }}>Home Features</h3>
        </Link>
      </div>

      <Link href="/" style={{ marginTop: '40px', fontSize: '0.8rem', color: '#64748b', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
        ← View Live Site
      </Link>
    </div>
  );
}
