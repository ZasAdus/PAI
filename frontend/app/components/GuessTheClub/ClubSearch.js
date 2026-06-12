"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import LoadingSpinner from '../GuessThePlayer/LoadingSpinner';
import { fetchJson } from '../../../api/api';

export default function ClubSearch({ onSelect, disabled = false, excludeIds = [] }) {
	const [query, setQuery] = useState('');
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [open, setOpen] = useState(false);
	const shellRef = useRef(null);

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
	const excludeSet = useMemo(() => new Set(excludeIds.map((value) => String(value))), [excludeIds]);
	const visibleItems = useMemo(
		() => items.filter((item) => !excludeSet.has(String(item.club_id))),
		[items, excludeSet],
	);

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
				const params = new URLSearchParams({ q: normalizedQuery });
				const response = await fetchJson(`/clubs/search?${params.toString()}`);
				setItems(response.items || []);
				setOpen(true);
			} catch (requestError) {
				setError('Nie udało się pobrać podpowiedzi klubów.');
				setItems([]);
			} finally {
				setLoading(false);
			}
		}, 220);

		return () => window.clearTimeout(timeoutId);
	}, [disabled, normalizedQuery]);

	function handleSelect(item) {
		setQuery(item.club_name);
		setOpen(false);
		onSelect?.(item);
	}

	return (
		<div className="search-shell" ref={shellRef}>
			<input
				className="search-input"
				value={query}
				onChange={(event) => {
					setQuery(event.target.value);
					setOpen(true);
				}}
				onFocus={() => setOpen(true)}
				placeholder="Wpisz nazwę klubu..."
				autoComplete="off"
				disabled={disabled}
			/>

			{open && normalizedQuery && (
				<div className="search-dropdown" role="listbox" aria-label="Sugestie klubów">
					{loading ? <LoadingSpinner label="Szukam klubów..." size="sm" /> : null}
					{!loading && error ? <div className="empty-state">{error}</div> : null}
					{!loading && !error && visibleItems.length === 0 ? <div className="empty-state">Brak wyników.</div> : null}
					{!loading && !error
						? visibleItems.map((item) => (
								<button
									key={item.club_id}
									type="button"
									className="search-item"
									onClick={() => handleSelect(item)}
								>
									<img className="avatar" src={item.logo_url || 'https://dummyimage.com/88x88/141a2d/ffffff&text=FC'} alt="" />
									<span className="search-meta">
										<span className="search-name">{item.club_name}</span>
										<span className="search-subtitle">
											{item.competition_name || 'Brak ligi'}
											{item.country_name ? ` · ${item.country_name}` : ''}
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
