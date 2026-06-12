"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ClubSearch from './ClubSearch';
import LoadingSpinner from '../GuessThePlayer/LoadingSpinner';
import DailyStats from '../GuessThePlayer/DailyStats';
import { useAuth } from '../AuthContext';
import { fetchJson } from '../../../api/api';

function createSessionId(storageKey) {
	if (typeof window === 'undefined') {
		return 'server-session';
	}

	const existing = window.localStorage.getItem(storageKey);
	if (existing) {
		return existing;
	}

	const nextId = window.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	window.localStorage.setItem(storageKey, nextId);
	return nextId;
}

function formatMarketValue(value) {
	if (!value) {
		return 'brak danych';
	}
	if (value >= 1_000_000) {
		return `EUR ${(value / 1_000_000).toFixed(1)} mln`;
	}
	if (value >= 1_000) {
		return `EUR ${(value / 1_000).toFixed(0)} tys.`;
	}
	return `EUR ${value}`;
}

export default function ClubGameBoard() {
	const { isLoggedIn, loading: authLoading } = useAuth();
	const [sessionId, setSessionId] = useState('');
	const [state, setState] = useState(null);
	const [message, setMessage] = useState('');
	const [busy, setBusy] = useState(false);
	const [booting, setBooting] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		setSessionId(createSessionId('gtc-session-id'));
	}, []);

	useEffect(() => {
		if (!sessionId) {
			return undefined;
		}

		let active = true;

		(async () => {
			try {
				setBooting(true);
				setError('');
				const nextState = await fetchJson(`/game/club-daily/start?session_id=${encodeURIComponent(sessionId)}`, { method: 'POST' });
				if (!active) return;
				setState(nextState);
				setMessage(nextState.game_over ? '' : 'Klub dnia gotowy. Odczytaj flagi i zgaduj klub.');
			} catch (requestError) {
				if (!active) return;
				setError('Nie udało się pobrać stanu gry klubowej. Sprawdź backend.');
			} finally {
				if (active) {
					setBooting(false);
				}
			}
		})();

		return () => {
			active = false;
		};
	}, [sessionId]);

	async function handleSelect(club) {
		if (!sessionId || busy || state?.game_over) {
			return;
		}

		try {
			setBusy(true);
			setError('');
			const response = await fetchJson('/game/club-daily/guess', {
				method: 'POST',
				body: JSON.stringify({ session_id: sessionId, club_id: club.club_id }),
			});
			setState(response.state);
			setMessage(response.message);
		} catch (requestError) {
			setError('Nie udało się zapisać próby.');
		} finally {
			setBusy(false);
		}
	}

	const attemptsLeft = useMemo(() => state?.remaining_attempts ?? 4, [state]);
	const gameLocked = Boolean(state?.game_over);
	const guessedClubIds = useMemo(
		() => (state?.guesses || []).map((guess) => String(guess.club_id)),
		[state],
	);

	const groupedLineup = useMemo(() => {
		const groups = {
			goalkeeper: [],
			defender: [],
			midfielder: [],
			attacker: [],
		};

		for (const player of state?.lineup || []) {
			groups[player.line]?.push(player);
		}
		return groups;
	}, [state]);

	if (booting || authLoading) {
		return (
			<section className="board">
				<LoadingSpinner label="Przygotowuję wyzwanie klubowe..." />
			</section>
		);
	}

	return (
		<section className="board">
			{!isLoggedIn && (
				<div className="guest-notice">
					<span>🔒 Zaloguj się, aby zapisać wynik z gry klubowej w rankingu!</span>
					<Link href="/auth/register" className="guest-notice-btn">Zarejestruj się za darmo</Link>
				</div>
			)}

			<div className={`club-outcome panel ${state?.solved ? 'club-outcome-win' : state?.game_over ? 'club-outcome-loss' : ''}`}>
				<div className="panel-inner">
					<span className="eyebrow">Guess The Club</span>
					<h2>{state?.solved ? 'Trafione!' : state?.game_over ? 'Koniec gry' : 'Flagi w formacji 4-4-2'}</h2>
					<p>
						{state?.solved
							? `Klub dnia to ${state?.revealed_target?.club_name || 'szukany klub'}.`
							: state?.game_over
								? `Tym razem chodziło o ${state?.revealed_target?.club_name || 'szukany klub'}.`
								: 'Widzisz obywatelstwa 11 najcenniejszych zawodników w formacji 4-4-2. Zgadnij klub w maksymalnie 4 próbach.'}
					</p>
				</div>
			</div>

			<div className="panel">
				<div className="panel-inner">
					<div className="club-pitch">
						<div className="club-line club-line-gk">
							{groupedLineup.goalkeeper.map((player) => (
								<div key={player.player_id} className="flag-card">
									<div className="flag-wrap">
										{player.flag_url ? <img src={player.flag_url} alt={player.country_name || 'Flaga'} className="country-flag" /> : <span className="flag-fallback">?</span>}
									</div>
									<div className="flag-caption">BR</div>
									<div className="flag-subtitle">{player.country_name || 'Nieznany kraj'}</div>
								</div>
							))}
						</div>

						<div className="club-line">
							{groupedLineup.defender.map((player) => (
								<div key={player.player_id} className="flag-card">
									<div className="flag-wrap">
										{player.flag_url ? <img src={player.flag_url} alt={player.country_name || 'Flaga'} className="country-flag" /> : <span className="flag-fallback">?</span>}
									</div>
									<div className="flag-caption">DEF</div>
									<div className="flag-subtitle">{player.country_name || 'Nieznany kraj'}</div>
								</div>
							))}
						</div>

						<div className="club-line">
							{groupedLineup.midfielder.map((player) => (
								<div key={player.player_id} className="flag-card">
									<div className="flag-wrap">
										{player.flag_url ? <img src={player.flag_url} alt={player.country_name || 'Flaga'} className="country-flag" /> : <span className="flag-fallback">?</span>}
									</div>
									<div className="flag-caption">MID</div>
									<div className="flag-subtitle">{player.country_name || 'Nieznany kraj'}</div>
								</div>
							))}
						</div>

						<div className="club-line">
							{groupedLineup.attacker.map((player) => (
								<div key={player.player_id} className="flag-card">
									<div className="flag-wrap">
										{player.flag_url ? <img src={player.flag_url} alt={player.country_name || 'Flaga'} className="country-flag" /> : <span className="flag-fallback">?</span>}
									</div>
									<div className="flag-caption">ATT</div>
									<div className="flag-subtitle">{player.country_name || 'Nieznany kraj'}</div>
								</div>
							))}
						</div>
					</div>

					<div className="status-row">
						<span className="badge">Pozostałe próby: {attemptsLeft}</span>
						{busy ? (
							<span className="status-inline-loading">
								<span className="loading-spinner loading-spinner-inline" aria-hidden="true" />
								Sprawdzam klub...
							</span>
						) : (
							<span>{message || (gameLocked ? 'Gra zakończona na dziś.' : 'Wpisz nazwę klubu z podpowiedzi.')}</span>
						)}
					</div>

					<div className="club-search-box">
						<ClubSearch onSelect={handleSelect} disabled={busy || gameLocked} excludeIds={guessedClubIds} />
					</div>
					{error ? <div className="status-row" style={{ color: 'var(--wrong)' }}>{error}</div> : null}
				</div>
			</div>

			<div className="panel">
				<div className="panel-inner">
					<h3 className="club-section-title">Twoje próby</h3>
					{state?.guesses?.length ? (
						<div className="club-guess-list">
							{state.guesses.map((guess) => (
								<div key={`${guess.attempt_number}-${guess.club_id}`} className={`club-guess-item ${guess.is_correct ? 'club-guess-correct' : ''}`}>
									<span className="club-guess-number">#{guess.attempt_number}</span>
									<span className="club-guess-name">{guess.club_name}</span>
									<span className="club-guess-result">{guess.is_correct ? 'Poprawnie' : 'Nie tym razem'}</span>
								</div>
							))}
						</div>
					) : (
						<div className="empty-state">Brak prób. Zobacz flagi i wpisz nazwę klubu.</div>
					)}
				</div>
			</div>

			<div className="panel">
				<div className="panel-inner">
					<h3 className="club-section-title">Skład dnia</h3>
					<div className="club-market-grid">
						{(state?.lineup || []).map((player) => (
							<div key={`market-${player.player_id}`} className="club-market-item">
								<div className="club-market-top">
									<strong>{player.line.toUpperCase()}</strong>
									<span>{player.country_name || 'Nieznany kraj'}</span>
								</div>
								<div className="club-market-value">{formatMarketValue(player.market_value_eur)}</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{gameLocked ? <DailyStats isLoggedIn={isLoggedIn} gameType="club" title="Statystyki dzisiejszego klubu" /> : null}

			<style jsx>{`
				.club-outcome h2 {
					font-size: 1.5rem;
					margin-bottom: 6px;
				}
				.club-outcome p {
					color: var(--text-muted);
				}
				.club-outcome-win {
					border-color: rgba(62, 207, 110, 0.35);
					box-shadow: 0 0 0 1px rgba(62, 207, 110, 0.15), var(--shadow);
				}
				.club-outcome-loss {
					border-color: rgba(224, 82, 82, 0.35);
					box-shadow: 0 0 0 1px rgba(224, 82, 82, 0.15), var(--shadow);
				}
				.club-pitch {
					display: flex;
					flex-direction: column;
					gap: 18px;
					padding: 18px;
					border-radius: var(--radius);
					border: 1px solid rgba(255, 255, 255, 0.06);
					background:
						radial-gradient(circle at center, rgba(255,255,255,0.08), transparent 35%),
						linear-gradient(180deg, rgba(62, 120, 62, 0.25), rgba(18, 58, 18, 0.25)),
						var(--bg);
				}
				.club-line {
					display: grid;
					grid-template-columns: repeat(4, minmax(0, 1fr));
					gap: 12px;
					justify-items: center;
				}
				.club-line-gk {
					grid-template-columns: minmax(0, 180px);
					justify-content: center;
				}
				.flag-card {
					width: 100%;
					max-width: 150px;
					padding: 10px;
					border-radius: 12px;
					background: rgba(10, 18, 12, 0.72);
					border: 1px solid rgba(255, 255, 255, 0.08);
					text-align: center;
				}
				.flag-wrap {
					width: 100%;
					aspect-ratio: 4 / 3;
					border-radius: 10px;
					overflow: hidden;
					background: rgba(255,255,255,0.06);
					display: flex;
					align-items: center;
					justify-content: center;
				}
				.country-flag {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}
				.flag-fallback {
					font-size: 2rem;
					font-weight: 800;
					color: var(--text-muted);
				}
				.flag-caption {
					margin-top: 8px;
					font-size: 0.75rem;
					font-weight: 800;
					letter-spacing: 0.08em;
					color: var(--accent);
				}
				.flag-subtitle {
					font-size: 0.75rem;
					color: var(--text-muted);
				}
				.club-search-box {
					margin-top: 14px;
				}
				.club-section-title {
					margin-bottom: 12px;
				}
				.club-guess-list {
					display: flex;
					flex-direction: column;
					gap: 10px;
				}
				.club-guess-item {
					display: grid;
					grid-template-columns: 56px 1fr 110px;
					gap: 12px;
					align-items: center;
					padding: 12px 14px;
					border-radius: var(--radius-sm);
					border: 1px solid var(--border);
					background: rgba(255,255,255,0.02);
				}
				.club-guess-correct {
					border-color: rgba(62, 207, 110, 0.35);
					background: rgba(62, 207, 110, 0.08);
				}
				.club-guess-number {
					font-weight: 800;
					color: var(--accent);
				}
				.club-guess-name {
					font-weight: 700;
				}
				.club-guess-result {
					text-align: right;
					font-size: 0.85rem;
					color: var(--text-muted);
				}
				.club-market-grid {
					display: grid;
					grid-template-columns: repeat(2, minmax(0, 1fr));
					gap: 10px;
				}
				.club-market-item {
					padding: 12px;
					border-radius: var(--radius-sm);
					border: 1px solid var(--border);
					background: rgba(255,255,255,0.02);
				}
				.club-market-top {
					display: flex;
					justify-content: space-between;
					gap: 10px;
					font-size: 0.8rem;
					color: var(--text-muted);
				}
				.club-market-value {
					margin-top: 6px;
					font-size: 1rem;
					font-weight: 800;
				}
				@media (max-width: 720px) {
					.club-line,
					.club-line-gk {
						grid-template-columns: repeat(2, minmax(0, 1fr));
					}
					.club-guess-item {
						grid-template-columns: 56px 1fr;
					}
					.club-guess-result {
						grid-column: 1 / -1;
						text-align: left;
					}
					.club-market-grid {
						grid-template-columns: 1fr;
					}
				}
			`}</style>
		</section>
	);
}
