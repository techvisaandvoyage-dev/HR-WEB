import React from 'react';
import { Link } from 'react-router-dom';
import './guestAndFooter.css';

/**
 * Modern SahiJob Footer matching design mockup.
 * Scoped and pixel-matched with logo badge, contact, social icons,
 * navigation link columns, and copyright notice.
 */
export default function SjFooter() {
  return (
    <footer className="sj-gfo">
      <div className="sj-gfg">
        <div>
          <div className="sj-logo" style={{ color: '#fff' }}>
            Sahi<b>Job</b>.com
          </div>
          <p>
            Discover opportunities that align with your passion and expertise. Connecting
            top talent with leading employers worldwide.
          </p>
          <p>
            <b>Email:</b> info@sahijob.com
            <br />
            <b>Phone:</b> +91 (800) 123-4567
          </p>

          <h4>Follow us</h4>
          <div className="sj-soc">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              f
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)">
              𝕏
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="4" width="16" height="16" rx="5" />
                <circle cx="12" cy="12" r="3.5" />
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              in
            </a>
          </div>
        </div>

        <div>
          <h4>Support</h4>
          <Link to="/page/contact-us">Contact Us</Link>
          <Link to="/page/help-center">Help Center</Link>
          <a href="#sj-support" onClick={(e) => { e.preventDefault(); const btn = document.getElementById('sj-support-fab'); if (btn) btn.click(); }}>Support Desk</a>
        </div>

        <div>
          <h4>Legal</h4>
          <Link to="/page/terms-and-conditions">Terms of Service</Link>
          <Link to="/page/privacy-policy">Privacy Policy</Link>
          <Link to="/page/cookie-policy">Cookie Policy</Link>
        </div>

        <div>
          <h4>Services</h4>
          <Link to="/page/about-us">About Us</Link>
          <Link to="/page/employers">For Employers</Link>
          <Link to="/page/consultants">For Consultants</Link>
        </div>

        <div>
          <h4>Information</h4>
          <Link to="/page/careers">Careers</Link>
          <Link to="/page/blog">Press &amp; News</Link>
          <Link to="/page/faq">FAQs</Link>
        </div>
      </div>

      <div className="sj-gcp">
        <span>&copy; {new Date().getFullYear()} SahiJob.com. All rights reserved.</span>
        <span>Built with precision &amp; care for modern hiring.</span>
      </div>
    </footer>
  );
}

