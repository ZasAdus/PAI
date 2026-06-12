'use client';

import Link from 'next/link';
import { useAuth } from './AuthContext';

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="nav-logo">⚽ GuessThePlayer</Link>
        <div className="nav-links">
          <Link href="/leaderboard" className="nav-btn">Ranking</Link>
          {isLoggedIn ? (
            <div className="nav-user">
              <span className="username">{user.username}</span>
              <button onClick={logout} className="btn-logout">Wyloguj</button>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="nav-btn">Logowanie</Link>
              <Link href="/auth/register" className="nav-btn btn-accent">Rejestracja</Link>
            </>
          )}
        </div>
      </div>
      <style jsx>{`
        .navbar {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 0 16px;
          height: 64px;
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        .navbar-inner {
          max-width: 740px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nav-logo {
          font-weight: 800;
          color: var(--text);
          text-decoration: none;
          font-size: 1.2rem;
        }
        .nav-links {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .nav-btn {
          color: var(--text);
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          transition: all 0.2s;
          border: 1px solid transparent;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .nav-btn:hover {
          background: var(--surface-2);
          border-color: var(--border);
        }
        .btn-accent {
          background: var(--accent);
          color: var(--bg) !important;
          border-color: var(--accent);
        }
        .btn-accent:hover {
          background: #e0b030;
          border-color: #e0b030;
        }
        .nav-user {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .username {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--accent);
        }
        .btn-logout {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .btn-logout:hover {
          border-color: var(--wrong);
          color: var(--wrong);
          background: rgba(224, 82, 82, 0.1);
        }
      `}</style>
    </nav>
  );
}
