"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { fetchJson } from '../../../api/api';

const SEARCH_MODES = [
	{ id: 'name', label: 'Nazwisko', placeholder: 'Wpisz nazwisko zawodnika...' },
	{ id: 'club', label: 'Klub', placeholder: 'Wpisz nazwę klubu...' },
	{ id: 'league', label: 'Liga', placeholder: 'Wpisz nazwę ligi...' },
	{ id: 'position', label: 'Pozycja', placeholder: 'Wpisz pozycję, np. Defender...' },
];

export default function PlayerSearch({ onSelect, disabled = false }) {
	const [query, setQuery] = useState('');
	const [searchBy, setSearchBy] = useState('name');
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [open, setOpen] = useState(false);
	const shellRef = useRef(null);

	const activeMode = useMemo(
		() => SEARCH_MODES.find((mode) => mode.id === searchBy) || SEARCH_MODES[0],
		[searchBy],
	);

	useEffect(() => {
		function handleClickOutside(event) {
			if (shellRef.current && !shellRef.current.contains(event.target)) {
				setOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const normalizedQuery = useMemo(() => query.trim(), [query]);

	useEffect(() => {
		if (disabled) {
			return undefined;
		}

		if (!normalizedQuery) {
			setItems([]);
			setLoading(false);
			setError('');
			return undefined;
		}

		const timeoutId = window.setTimeout(async () => {
			try {
				setLoading(true);
				setError('');
				const params = new URLSearchParams({
					q: normalizedQuery,
					search_by: searchBy,
				});
				const response = await fetchJson(`/players/search?${params.toString()}`);
				setItems(response.items || []);
				setOpen(true);
			} catch (requestError) {
				setError('Nie udało się pobrać podpowiedzi.');
				setItems([]);
			} finally {
				setLoading(false);
			}
		}, 220);

		return () => window.clearTimeout(timeoutId);
	}, [disabled, normalizedQuery, searchBy]);

	function handleSelect(item) {
		setQuery(item.player_name);
		setOpen(false);
		onSelect?.(item);
	}

	return (
		<div className="search-shell" ref={shellRef}>
			<div className="search-mode-row" role="tablist" aria-label="Tryb wyszukiwania">
				{SEARCH_MODES.map((mode) => (
					<button
						key={mode.id}
						type="button"
						role="tab"
						aria-selected={searchBy === mode.id}
						className={searchBy === mode.id ? 'search-mode-btn active' : 'search-mode-btn'}
						onClick={() => {
							setSearchBy(mode.id);
							setOpen(Boolean(normalizedQuery));
						}}
						disabled={disabled}
					>
						{mode.label}
					</button>
				))}
			</div>

			<input
				className="search-input"
				value={query}
				onChange={(event) => {
					setQuery(event.target.value);
					setOpen(true);
				}}
				onFocus={() => setOpen(true)}
				placeholder={activeMode.placeholder}
				autoComplete="off"
				disabled={disabled}
			/>

			{open && normalizedQuery && (
				<div className="search-dropdown" role="listbox" aria-label="Sugestie zawodników">
					{loading ? <LoadingSpinner label="Szukam zawodników..." size="sm" /> : null}
					{!loading && error ? <div className="empty-state">{error}</div> : null}
					{!loading && !error && items.length === 0 ? (
						<div className="empty-state">Brak wyników.</div>
					) : null}
					{!loading && !error
						? items.map((item) => (
								<button
									key={item.player_id}
									type="button"
									className="search-item"
									onClick={() => handleSelect(item)}
								>
									<img className="avatar" src={item.player_image_url || 'https://dummyimage.com/88x88/141a2d/ffffff&text=?'} alt="" />
									<span className="search-meta">
										<span className="search-name">{item.player_name}</span>
										<span className="search-subtitle">
											{item.current_club_name || 'Brak klubu'} · {item.competition_name || 'Brak ligi'}
											{item.main_position || item.position ? ` · ${item.main_position || item.position}` : ''}
										</span>
									</span>
								</button>
							))
						: null}
				</div>
			)}
		</div>
	);
}