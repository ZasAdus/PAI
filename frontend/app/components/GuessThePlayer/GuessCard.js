"use client";

function iconForComparison(item) {
	if (item.status === 'correct') {
		return '✓';
	}
	if (item.direction === 'up') {
		return '↑';
	}
	if (item.direction === 'down') {
		return '↓';
	}
	return '•';
}

function classForComparison(item) {
	if (item.status === 'correct') {
		return 'correct';
	}
	if (item.status === 'higher' || item.status === 'lower' || item.status === 'different') {
		return 'wrong';
	}
	return 'unknown';
}

export default function GuessCard({ attempt }) {
  const { guess, comparisons, attempt_number } = attempt;

  return (
    <div className="panel guess-card">
      <div className="guess-layout">
        <div className="guess-player-info">
          <div className="guess-avatar-container">
            {guess.player_image_url ? (
              <img src={guess.player_image_url} alt={guess.player_name} className="guess-avatar-large" />
            ) : (
              <div className="guess-avatar-placeholder">?</div>
            )}
          </div>
          <div className="guess-player-meta">
            <span className="guess-number">#{attempt_number}</span>
            <div className="guess-name">{guess.player_name}</div>
          </div>
        </div>

        <div className="guess-grid-container">
          <div className="guess-grid">
            {comparisons.map((item) => (
              <div key={item.key} className="hint-box">
                <span className="hint-label">{item.label}</span>
                <div className={`hint-value ${item.status}`}>
                  {item.direction === 'up' && <span className="arrow">↑</span>}
                  {item.direction === 'down' && <span className="arrow">↓</span>}
                  {item.match && <span className="arrow">✓</span>}
                  <span className="value-text">{item.guess || '?'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}