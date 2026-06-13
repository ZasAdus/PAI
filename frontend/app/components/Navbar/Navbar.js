'use client';
 
import Link from 'next/link';
import { useAuth } from '../AuthContext';
import './styles.css';
 
export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
 
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="nav-logo">
          <span className="nav-logo-icon">⚽</span>
          GuessThePlayer
        </Link>
 
        <div className="nav-center">
          <Link href="/guess-the-player" className="game-btn btn-player">
            <div className="btn-icon btn-icon-player">👤</div>
            <div className="btn-label">
              <span className="btn-mode">Tryb gry</span>
              <strong>Zawodnik</strong>
            </div>
          </Link>
          <Link href="/guess-the-club" className="game-btn btn-club">
            <div className="btn-icon btn-icon-club">🛡️</div>
            <div className="btn-label">
              <span className="btn-mode">Tryb gry</span>
              <strong>Klub</strong>
            </div>
          </Link>
        </div>
 
        <div className="nav-right">
          <Link href="/leaderboard" className="nav-link nav-link-ranking">
            🏆 Ranking
          </Link>
          <div className="nav-divider" />
          {isLoggedIn ? (
            <div className="nav-user">
              <div className="nav-avatar">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <span className="nav-username">{user.username}</span>
              <button onClick={logout} className="btn-logout">Wyloguj</button>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="nav-link">Logowanie</Link>
              <Link href="/auth/register" className="btn-register">Rejestracja</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}