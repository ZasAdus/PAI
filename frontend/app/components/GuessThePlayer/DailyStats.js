'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchJson } from '../../../api/api';

export default function DailyStats({ isLoggedIn, gameType = 'player', title }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchJson(`/stats/daily?game_type=${encodeURIComponent(gameType)}`)
      .then(data => setStats(data))
      .catch(err => console.error('Stats error:', err));
  }, [gameType]);

  if (!stats || stats.total_games === 0) return null;

  return (
    <div className="stats-box">
      <h3>{title || (gameType === 'club' ? 'Statystyki dzisiejszego klubu' : 'Statystyki dzisiejszego zawodnika')}</h3>
      <p className="stats-total">
        {stats.total_games} {stats.total_games === 1 ? 'gra' : 'gier'} dzisiaj
        {!isLoggedIn && (
          <span className="stats-guest">
            {' · '}
            <Link href="/auth/register" className="inline-link">
              Dołącz do {stats.total_games + 10}+ graczy w rankingu!
            </Link>
          </span>
        )}
      </p>
      
      <div className="stats-grid">
        {Object.entries(stats.distribution).sort((a,b) => {
          if (a[0] === 'X') return 1;
          if (b[0] === 'X') return -1;
          return parseInt(a[0]) - parseInt(b[0]);
        }).map(([attempt, percentage]) => (
          <div key={attempt} className="stats-item">
            <div className="stats-label">{attempt === 'X' ? 'Porażka' : `Próba ${attempt}`}</div>
            <div className="stats-bar-bg">
              <div className="stats-bar-fill" style={{ width: `${percentage}%` }}></div>
            </div>
            <div className="stats-value">{percentage}%</div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .stats-box {
          margin-top: 32px;
          padding: 20px;
          background: var(--surface-2);
          border-radius: var(--radius);
          border: 1px solid var(--border);
        }
        .stats-box h3 {
          font-size: 1rem;
          margin-bottom: 4px;
        }
        .stats-total {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 16px;
        }
        .stats-guest {
          display: block;
          margin-top: 8px;
          color: var(--text-muted);
        }
        .stats-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .stats-item {
          display: grid;
          grid-template-columns: 80px 1fr 45px;
          align-items: center;
          gap: 12px;
        }
        .stats-label {
          font-size: 0.8rem;
          font-weight: 600;
        }
        .stats-bar-bg {
          height: 8px;
          background: var(--bg);
          border-radius: 4px;
          overflow: hidden;
        }
        .stats-bar-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 4px;
        }
        .stats-value {
          font-size: 0.8rem;
          font-weight: 700;
          text-align: right;
        }
      `}</style>
    </div>
  );
}
