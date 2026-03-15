'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  showBackToDirectory?: boolean;
  showLogout?: boolean;
  onLogout?: () => void;
}

const LogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-400)' }}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const BackArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export default function Navbar({ showBackToDirectory = false, showLogout = false, onLogout }: NavbarProps) {
  return (
    <nav>
      <div className="container nav-container">
        <Link href="/" className="nav-logo">
          <LogoIcon />
          AI Store
        </Link>

        <div className="nav-links">
          {showBackToDirectory ? (
            <Link href="/" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BackArrowIcon />
              {showLogout ? 'Directory' : 'Back to Directory'}
            </Link>
          ) : (
            <Link href="/#directory" className="nav-link">Directory</Link>
          )}

          {showLogout ? (
            <button className="btn badge-outline" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }} onClick={onLogout}>
              Sign Out
            </button>
          ) : (
            <Link href="/login" className="nav-link" id="auth-link">Admin Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
