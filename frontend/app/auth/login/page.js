'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setAuthToken } from '../../../api/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      // Using fetch directly for login because it uses FormData for OAuth2PasswordRequestForm
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/login`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Błąd logowania');
      }

      const data = await response.json();
      setAuthToken(data.access_token);
      window.location.href = '/';
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
            <span className="eyebrow">Witaj ponownie</span>
            <h1>Logowanie</h1>
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
            
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
            
            <p className="auth-footer">
              Nie masz konta? <Link href="/auth/register">Zarejestruj się</Link>
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
          transition: transform 0.1s;
        }
        .btn-submit:active { transform: scale(0.98); }
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
