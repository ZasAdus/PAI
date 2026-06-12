"use client";

import { useEffect, useMemo, useState } from 'react';
import PlayerSearch from './PlayerSearch';
import GuessCard from './GuessCard';
import GameOutcomeBanner from './GameOutcomeBanner';
import LoadingSpinner from './LoadingSpinner';
import DailyStats from './DailyStats';
import { fetchJson } from '../../../api/api';
import './styles.css';

function createSessionId() {
	if (typeof window === 'undefined') {
		return 'server-session';
	}

	const storageKey = 'gtp-session-id';
	const existing = window.localStorage.getItem(storageKey);
	if (existing) {
		return existing;
	}

	const nextId = window.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	window.localStorage.setItem(storageKey, nextId);
	return nextId;
}

export default function GameBoard() {
	const [sessionId, setSessionId] = useState('');
	const [state, setState] = useState(null);
	const [guesses, setGuesses] = useState([]);
	const [message, setMessage] = useState('');
	const [busy, setBusy] = useState(false);
	const [booting, setBooting] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		setSessionId(createSessionId());
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
				const nextState = await fetchJson(`/game/daily/start?session_id=${encodeURIComponent(sessionId)}`, { method: 'POST' });
				if (!active) return;
				setState(nextState);
				setGuesses(nextState.guesses || []);
				setMessage(nextState.game_over ? '' : 'Dzienne wyzwanie gotowe.');
			} catch (requestError) {
				if (!active) return;
				setError('Nie udało się pobrać stanu gry. Sprawdź backend.');
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

	async function handleSelect(player) {
		if (!sessionId || busy || state?.game_over) {
			return;
		}

		try {
			setBusy(true);
			setError('');
			const response = await fetchJson('/game/daily/guess', {
				method: 'POST',
				body: JSON.stringify({ session_id: sessionId, player_id: player.player_id }),
			});
			setState(response.state);
			setGuesses(response.state.guesses || []);
			setMessage(response.message);
		} catch (requestError) {
			setError('Nie udało się zapisać strzału.');
		} finally {
			setBusy(false);
		}
	}

	const attemptsLeft = useMemo(() => state?.remaining_attempts ?? 8, [state]);
	const gameLocked = Boolean(state?.game_over);

	if (booting) {
		return (
			<section className="board">
				<LoadingSpinner label="Przygotowuję dzienne wyzwanie..." />
			</section>
		);
	}

	return (
		<section className="board">
			<GameOutcomeBanner state={state} />

			<div className="panel">
				<div className="panel-inner">
					<PlayerSearch onSelect={handleSelect} disabled={busy || gameLocked} />
					<div className="status-row">
						<span className="badge">Pozostałe próby: {attemptsLeft}</span>
						{busy ? (
							<span className="status-inline-loading">
								<span className="loading-spinner loading-spinner-inline" aria-hidden="true" />
								Aktualizuję wynik...
							</span>
						) : (
							<span>{message || (gameLocked ? 'Gra zakończona na dziś.' : 'Wybierz zawodnika z listy podpowiedzi.')}</span>
						)}
					</div>
					{error ? <div className="status-row" style={{ color: 'var(--wrong)' }}>{error}</div> : null}
				</div>
			</div>

			<div className="guesses">
				{guesses.length === 0 ? (
					<div className="panel">
						<div className="empty-state">Brak prób. Zacznij od wpisania nazwiska zawodnika.</div>
					</div>
				) : (
					[...guesses].reverse().map((guess) => <GuessCard key={`${guess.attempt_number}-${guess.guess.player_id}`} attempt={guess} />)
				)}
			</div>

			{gameLocked && <DailyStats />}
		</section>
	);
}
