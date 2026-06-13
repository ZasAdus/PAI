"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ClubSearch from './ClubSearch';
import ClubOutcomeBanner from './ClubOutcomeBanner';
import LoadingSpinner from '../LoadingSpinner';
import DailyStats from '../DailyStats';
import { useAuth } from '../AuthContext';
import { fetchJson } from '../../../api/api';
import '../GuessThePlayer/styles.css';
import './styles.css';

function createSessionId(storageKey) {
	if (typeof window === 'undefined') return 'server-session';
	const existing = window.localStorage.getItem(storageKey);
	if (existing) return existing;
	const nextId = window.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	window.localStorage.setItem(storageKey, nextId);
	return nextId;
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
		if (!sessionId) return undefined;

		let active = true;
		(async () => {
			try {
				setBooting(true);
				setError('');
				const nextState = await fetchJson(
					`/game/club-daily/start?session_id=${encodeURIComponent(sessionId)}`,
					{ method: 'POST' },
				);
				if (!active) return;
				setState(nextState);
				setMessage(nextState.game_over ? '' : 'Zgadnij klub dnia.');
			} catch (requestError) {
				if (!active) return;
				const detail = requestError instanceof Error ? requestError.message : '';
				setError(detail || 'Nie udało się pobrać stanu gry klubowej. Sprawdź backend.');
			} finally {
				if (active) setBooting(false);
			}
		})();

		return () => { active = false; };
	}, [sessionId]);

	function cleanClubName(name) {
		return name?.replace(/\s*\(\d+\)\s*$/, '').trim() ?? '';
	}

	async function handleSelect(club) {
		if (!sessionId || busy || state?.game_over) return;

		try {
			setBusy(true);
			setError('');
			const response = await fetchJson('/game/club-daily/guess', {
				method: 'POST',
				body: JSON.stringify({ session_id: sessionId, club_id: club.club_id }),
			});
			setState(response.state);
			setMessage(response.message);
		} catch {
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
		const groups = { goalkeeper: [], defender: [], midfielder: [], attacker: [] };
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
					<Link href="/auth/register" className="guest-notice-btn">Zarejestruj się</Link>
				</div>
			)}

			{/* Banner wygranej/przegranej — identyczny mechanizm jak w GuessThePlayer */}
			<ClubOutcomeBanner state={state} isLoggedIn={isLoggedIn} />

			<div className="panel">
				<div className="panel-inner">
					<div className="club-pitch">
						<div className="club-line club-line-gk">
							{groupedLineup.goalkeeper.map((player) => (
								<div key={player.player_id} className="flag-card">
									<div className="flag-wrap">
										{player.flag_url
											? <img src={player.flag_url} alt={player.country_name || 'Flaga'} className="country-flag" />
											: <span className="flag-fallback">?</span>}
									</div>
								</div>
							))}
						</div>

						{['defender', 'midfielder', 'attacker'].map((line) => (
							<div key={line} className="club-line">
								{groupedLineup[line].map((player) => (
									<div key={player.player_id} className="flag-card">
										<div className="flag-wrap">
											{player.flag_url
												? <img src={player.flag_url} alt={player.country_name || 'Flaga'} className="country-flag" />
												: <span className="flag-fallback">?</span>}
										</div>
									</div>
								))}
							</div>
						))}
					</div>

					{/* Pole wyszukiwania nad status-row — identyczny układ jak GameBoard */}
					<div className="club-search-box">
						<ClubSearch onSelect={handleSelect} disabled={busy || gameLocked} excludeIds={guessedClubIds} />
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
					{error ? <div className="status-row" style={{ color: 'var(--wrong)' }}>{error}</div> : null}
				</div>
			</div>

			<div className="panel">
				<div className="panel-inner">
					<h3 className="club-section-title">Twoje próby</h3>
					{state?.guesses?.length ? (
						<div className="club-guess-list">
							{[...state.guesses].reverse().map((guess) => (
								<div
									key={`${guess.attempt_number}-${guess.club_id}`}
									className={`club-guess-item ${guess.is_correct ? 'club-guess-correct' : ''}`}
								>
									<span className="club-guess-number">#{guess.attempt_number}</span>
									<span className="club-guess-name">{cleanClubName(guess.club_name)}</span>
									<span className="club-guess-result">{guess.is_correct ? '✓ Poprawnie' : '✗ Nie tym razem'}</span>
								</div>
							))}
						</div>
					) : (
						<div className="empty-state">Brak prób. Zobacz flagi i wpisz nazwę klubu.</div>
					)}
				</div>
			</div>

			{gameLocked ? <DailyStats isLoggedIn={isLoggedIn} gameType="club" title="Statystyki dzisiejszego klubu" /> : null}

		</section>
	);
}