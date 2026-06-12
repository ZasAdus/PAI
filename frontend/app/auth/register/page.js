'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchJson } from '../../../api/api';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await fetchJson('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      router.push('/auth/login?registered=true');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="game-page">
      <div className="panel">
        <div className="panel-inner">
          <div className="game-page-head">
            <span className="eyebrow">Dołącz do gry</span>
            <h1>Rejestracja</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-msg">{error}</div>}
            
            <div className="form-group">
              <label>Nazwa użytkownika</label>
              <input 
                type="text" 
                className="search-input" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Hasło</label>
              <input 
                type="password" 
                className="search-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Powtórz hasło</label>
              <input 
                type="password" 
                className="search-input" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Rejestracja...' : 'Utwórz konto'}
            </button>
            
            <p className="auth-footer">
              Masz już konto? <Link href="/auth/login">Zaloguj się</Link>
            </p>
          </form>
        </div>
      </div>

      <style jsx>{`
        .auth-form {
          max-width: 320px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .btn-submit {
          background: var(--accent);
          color: var(--bg);
          border: none;
          padding: 12px;
          border-radius: var(--radius-sm);
          font-weight: 700;
          cursor: pointer;
        }
        .btn-submit:disabled { opacity: 0.6; }
        .error-msg {
          background: rgba(224, 82, 82, 0.1);
          border: 1px solid var(--wrong);
          color: var(--wrong);
          padding: 10px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          text-align: center;
        }
        .auth-footer {
          text-align: center;
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-top: 10px;
        }
        .auth-footer a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
