'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ClubOutcomeBanner({ state, isLoggedIn }) {
	const [visible, setVisible] = useState(false);
	const [animationClass, setAnimationClass] = useState('');

	useEffect(() => {
		if (state?.game_over) {
			setTimeout(() => {
				setVisible(true);
				setAnimationClass(state.solved ? 'banner-enter-win' : 'banner-enter-loss');
			}, 100);
		} else {
			setVisible(false);
			setAnimationClass('');
		}
	}, [state?.game_over, state?.solved]);

	if (!visible) return null;

	const target = state.revealed_target;
	const targetName = target?.club_name?.replace(/\s*\(\d+\)\s*$/, '').trim() ?? 'nieznany klub';

	if (state.solved) {
		return (
			<div className={`game-banner game-banner-win ${animationClass}`} role="status">
				<div className="banner-content">
					<div className="win-icon">🏆</div>
					<div className="win-text">
						<strong>Gratulacje!</strong>
						<span>
							Odgadłeś dzisiejszy klub
							{target ? (
								<>
									: <em>{targetName}</em>
									{target.competition_name ? ` (${target.competition_name})` : ''}
								</>
							) : (
								'.'
							)}
						</span>
						{!isLoggedIn && (
							<span className="guest-prompt">
								Zaloguj się, aby Twój wynik był w rankingu!{' '}
								<Link href="/auth/register" className="inline-link">Zarejestruj się</Link>
							</span>
						)}
					</div>
				</div>
				<div className="confetti">
					{[...Array(12)].map((_, i) => (
						<span key={i} className="confetti-piece" style={{ '--delay': `${i * 0.1}s`, '--x': `${(i % 4) * 25}%` }} />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className={`game-banner game-banner-loss ${animationClass}`} role="alert">
			<div className="banner-content">
				<div className="loss-icon">😢</div>
				<div className="loss-text">
					<strong>Koniec gry</strong>
					<span>
						Wykorzystałeś wszystkie próby. Szukany klub to{' '}
						{target ? (
							<>
								<em>{targetName}</em>
								{target.competition_name ? ` · ${target.competition_name}` : ''}
								{target.country_name ? ` · ${target.country_name}` : ''}
							</>
						) : (
							'nieznany klub'
						)}
						.
					</span>
					{!isLoggedIn && (
						<span className="guest-prompt">
							Dołącz do rankingu!{' '}
							<Link href="/auth/register" className="inline-link">Zarejestruj się za darmo</Link>
						</span>
					)}
				</div>
			</div>
			<div className="tears">
				{[...Array(4)].map((_, i) => (
					<span key={i} className="tear" style={{ '--delay': `${i * 0.2}s`, '--x': `${20 + i * 20}%` }} />
				))}
			</div>
		</div>
	);
}