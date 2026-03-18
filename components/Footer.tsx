'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [comments, setComments] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !question) {
      toast.error('Please enter your email and question.');
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, question, comments }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message.');
      }

      setEmail('');
      setQuestion('');
      setComments('');
      toast.success('Message sent. Our team will reach out shortly.');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <footer className="main-footer">
      <div className="newsletter-section">
        <div className="newsletter-content">
          <h3>STAY IN TOUCH WITH SHALI</h3>
          <p className="newsletter-subtitle">
            Share your email and a short note about what you are looking for. We’ll respond
            personally with styling advice, product guidance, or order help.
          </p>

          <form className="newsletter-form" onSubmit={handleSubmit}>
            <div className="newsletter-grid">
              <div className="newsletter-field">
                <label className="newsletter-label">Email address *</label>
                <input
                  type="email"
                  required
                  placeholder="you@zalnex.me"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="newsletter-field newsletter-field-full">
                <label className="newsletter-label">Your question *</label>
                <textarea
                  required
                  placeholder="Tell us what you need help with – sizing, styling, availability, or anything else."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="newsletter-textarea"
                />
              </div>

              <div className="newsletter-field newsletter-field-full">
                <label className="newsletter-label">Additional context (optional)</label>
                <textarea
                  placeholder="Links, product names, occasions, or preferences you’d like us to consider."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="newsletter-textarea"
                />
              </div>
            </div>

            <div className="newsletter-actions">
              <button type="submit" disabled={isSending}>
                {isSending ? 'SENDING YOUR MESSAGE…' : 'SEND MESSAGE'}
              </button>
              <p className="newsletter-disclaimer">
                We respect your inbox. No spam — only direct replies and occasional important updates.
              </p>
            </div>
          </form>
        </div>
      </div>
      <div className="footer-links-wrapper wrapper">
        <div className="footer-col">
          <h4>About Us</h4>
          <ul>
            <li><a href="#">Our Story</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Store Locator</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Customer Care</h4>
          <ul>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">FAQs</a></li>
            <li><a href="#">Shipping &amp; Returns</a></li>
            <li><a href="#">Track Order</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Policies</h4>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom wrapper">
        <div className="social-icons">
          <a href="#"><i className="fab fa-facebook-f"></i></a>
          <a href="#"><i className="fab fa-instagram"></i></a>
          <a href="#"><i className="fab fa-youtube"></i></a>
        </div>
        <div className="copyright">
          <p>&copy; 2026 Fatimas Collection. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
