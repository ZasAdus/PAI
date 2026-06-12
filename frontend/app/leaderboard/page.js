'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '../../api/api';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson('/leaderboard')
      .then(data => setLeaders(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="game-page">
      <div className="panel">
        <div className="panel-inner">
          <div className="game-page-head">
            <span className="eyebrow">Najlepsi gracze</span>
            <h1>Ranking</h1>
          </div>

          {loading ? (
            <div className="loading-spinner"></div>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Pozycja</th>
                  <th>Użytkownik</th>
                  <th>Seria 🔥</th>
                  <th>Wygrane</th>
                  <th>Suma prób</th>
                </tr>
              </thead>
              <tbody>
                {leaders.length > 0 ? leaders.map((leader, index) => (
                  <tr key={leader.username} className={index < 3 ? `top-${index + 1}` : ''}>
                    <td className="position">#{index + 1}</td>
                    <td>
                      <strong>{leader.username}</strong>
                      {leader.streak > 0 && (
                        <span className="streak-badge">{leader.streak} dni</span>
                      )}
                    </td>
                    <td className="streak-cell">
                      {leader.streak > 0 ? (
                        <span className="streak-fire">🔥 {leader.streak}</span>
                      ) : (
                        <span className="no-streak">-</span>
                      )}
                    </td>
                    <td>{leader.wins}</td>
                    <td>{leader.total_attempts}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                      Brak wyników w rankingu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style jsx>{`
        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .leaderboard-table th {
          text-align: left;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 12px;
          border-bottom: 2px solid var(--border);
        }
        .leaderboard-table td {
          padding: 14px 12px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .leaderboard-table tr:last-child td {
          border-bottom: none;
        }
        .leaderboard-table tr:hover {
          background: var(--surface-2);
        }
        .position {
          font-weight: 800;
          font-size: 1.1rem;
        }
        .top-1 td.position {
          color: #FFD700;
        }
        .top-2 td.position {
          color: #C0C0C0;
        }
        .top-3 td.position {
          color: #CD7F32;
        }
        .streak-badge {
          display: inline-block;
          margin-left: 8px;
          font-size: 0.65rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ff6b6b, #ffa500);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
        }
        .streak-cell {
          text-align: center;
        }
        .streak-fire {
          font-weight: 700;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .no-streak {
          color: var(--text-muted);
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
