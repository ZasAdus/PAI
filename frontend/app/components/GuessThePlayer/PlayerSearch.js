"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import { fetchJson } from '../../../api/api';

const COMPETITION_LOGOS = {
  GB1: 'https://tmssl.akamaized.net/images/logo/normal/gb1.png',
  ES1: 'https://tmssl.akamaized.net/images/logo/normal/es1.png',
  IT1: 'https://tmssl.akamaized.net/images/logo/normal/it1.png',
  L1:  'https://tmssl.akamaized.net/images/logo/normal/l1.png',
  FR1: 'https://tmssl.akamaized.net/images/logo/normal/fr1.png',
};

const COUNTRY_ISO = {
  'afghanistan':'af','albania':'al','algeria':'dz','andorra':'ad','angola':'ao',
  'argentina':'ar','armenia':'am','australia':'au','austria':'at','azerbaijan':'az',
  'bahrain':'bh','belarus':'by','belgium':'be','benin':'bj','bolivia':'bo',
  'bosnia and herzegovina':'ba','brazil':'br','bulgaria':'bg','burkina faso':'bf',
  'cameroon':'cm','canada':'ca','cabo verde':'cv','chile':'cl','china':'cn',
  'colombia':'co','congo':'cg','costa rica':'cr','croatia':'hr','cuba':'cu',
  'curacao':'cw','czechia':'cz','czech republic':'cz',
  'democratic republic of the congo':'cd','denmark':'dk','ecuador':'ec',
  'egypt':'eg','ethiopia':'et','finland':'fi','france':'fr','gabon':'ga',
  'gambia':'gm','georgia':'ge','germany':'de','ghana':'gh','greece':'gr',
  'guatemala':'gt','guinea':'gn','guinea-bissau':'gw','honduras':'hn',
  'hungary':'hu','iceland':'is','india':'in','indonesia':'id','iran':'ir',
  'iraq':'iq','ireland':'ie','republic of ireland':'ie','israel':'il',
  'italy':'it','ivory coast':'ci','jamaica':'jm','japan':'jp','jordan':'jo',
  'kazakhstan':'kz','kenya':'ke','latvia':'lv','lebanon':'lb','liberia':'lr',
  'libya':'ly','liechtenstein':'li','lithuania':'lt','luxembourg':'lu',
  'madagascar':'mg','mali':'ml','malta':'mt','mauritania':'mr','mauritius':'mu',
  'mexico':'mx','moldova':'md','monaco':'mc','montenegro':'me','morocco':'ma',
  'mozambique':'mz','namibia':'na','netherlands':'nl','new zealand':'nz',
  'nicaragua':'ni','niger':'ne','nigeria':'ng','north korea':'kp',
  'north macedonia':'mk','norway':'no','oman':'om','panama':'pa','paraguay':'py',
  'peru':'pe','philippines':'ph','poland':'pl','portugal':'pt','qatar':'qa',
  'romania':'ro','russia':'ru','saudi arabia':'sa','senegal':'sn','serbia':'rs',
  'sierra leone':'sl','slovakia':'sk','slovenia':'si','south africa':'za',
  'south korea':'kr','spain':'es','sudan':'sd','sweden':'se','switzerland':'ch',
  'syria':'sy','tanzania':'tz','thailand':'th','togo':'tg',
  'trinidad and tobago':'tt','tunisia':'tn','turkey':'tr','turkiye':'tr',
  'uganda':'ug','ukraine':'ua','united arab emirates':'ae','united states':'us',
  'usa':'us','uruguay':'uy','uzbekistan':'uz','venezuela':'ve','vietnam':'vn',
  'zambia':'zm','zimbabwe':'zw',
};

const HARDCODED_FLAGS = {
  'england':          'https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg',
  'scotland':         'https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg',
  'wales':            'https://upload.wikimedia.org/wikipedia/commons/d/dc/Flag_of_Wales.svg',
  'northern ireland': 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Flag_of_Northern_Ireland_%281953%E2%80%931972%29.svg',
  'kosovo':           'https://upload.wikimedia.org/wikipedia/commons/1/1f/Flag_of_Kosovo.svg',
};

function getFlagUrl(country) {
  if (!country) return null;
  const key = country.trim().toLowerCase();
  if (HARDCODED_FLAGS[key]) return HARDCODED_FLAGS[key];
  const iso = COUNTRY_ISO[key];
  return iso ? `https://flagcdn.com/w40/${iso}.png` : null;
}

function getClubLogoUrl(clubId) {
  if (!clubId) return null;
  return `https://tmssl.akamaized.net/images/wappen/normquad/${clubId}.png`;
}

export default function PlayerSearch({ onSelect, disabled = false, excludeIds = [] }) {
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
		() => items.filter((item) => !excludeSet.has(String(item.player_id))),
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
				const params = new URLSearchParams({
					q: normalizedQuery,
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
	}, [disabled, normalizedQuery]);

	function handleSelect(item) {
		setQuery('');    
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
				placeholder="Wpisz nazwisko zawodnika lub nazwę klubu..."
				autoComplete="off"
				disabled={disabled}
			/>

			{open && normalizedQuery && (
				<div className="search-dropdown" role="listbox" aria-label="Sugestie zawodników">
					{loading ? <LoadingSpinner label="Szukam zawodników..." size="sm" /> : null}
					{!loading && error ? <div className="empty-state">{error}</div> : null}
					{!loading && !error && visibleItems.length === 0 ? (
						<div className="empty-state">Brak wyników.</div>
					) : null}
					{!loading && !error
						? visibleItems.map((item) => (
								<button
									key={item.player_id}
									type="button"
									className="search-item"
									onClick={() => handleSelect(item)}
								>
									<img className="avatar" src={item.player_image_url || 'https://dummyimage.com/88x88/141a2d/ffffff&text=?'} alt="" />
									<span className="search-meta">
										<span className="search-name">
											{(() => {
												const flagUrl = getFlagUrl(item.citizenship || item.country_of_birth);
												return flagUrl ? (
													<>
														<img src={flagUrl} alt="" className="search-flag" onError={e => { e.target.style.display='none'; }} />
														{item.player_name}
													</>
												) : item.player_name;
											})()}
										</span>
										<span className="search-subtitle">
											{item.current_club_id && (
												<img
													src={getClubLogoUrl(item.current_club_id)}
													alt=""
													className="search-club-logo"
													onError={e => { e.target.style.display='none'; }}
												/>
											)}
											{item.current_club_name || 'Brak klubu'}
											{' · '}
											{item.competition_id && COMPETITION_LOGOS[item.competition_id] && (
												<img
													src={COMPETITION_LOGOS[item.competition_id]}
													alt=""
													className="search-league-logo"
													onError={e => { e.target.style.display='none'; }}
												/>
											)}
											{item.competition_name || 'Brak ligi'}
											{(item.main_position || item.position) ? ` · ${item.main_position || item.position}` : ''}
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