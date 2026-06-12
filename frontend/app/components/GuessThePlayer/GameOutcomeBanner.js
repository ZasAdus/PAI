'use client';

import { useEffect, useState } from 'react';

export default function GameOutcomeBanner({ state }) {
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

	if (!visible) {
		return null;
	}

	const target = state.revealed_target;

	if (state.solved) {
		return (
			<div className={`game-banner game-banner-win ${animationClass}`} role="status">
				<div className="banner-content">
					<div className="win-icon">🏆</div>
					<div className="win-text">
						<strong>Gratulacje!</strong>
						<span>
							Odgadłeś dzisiejszego zawodnika
							{target ? (
								<>
									: <em>{target.player_name}</em>
									{target.current_club_name ? ` (${target.current_club_name})` : ''}
								</>
							) : (
								'.'
							)}
						</span>
					</div>
				</div>
				<div className="confetti">
					{[...Array(12)].map((_, i) => (
						<span key={i} className="confetti-piece" style={{ '--delay': `${i * 0.1}s`, '--x': `${(i % 4) * 25}%` }}></span>
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
						Wykorzystałeś wszystkie próby. Szukany zawodnik to{' '}
						{target ? (
							<>
								<em>{target.player_name}</em>
								{target.current_club_name ? ` · ${target.current_club_name}` : ''}
								{target.competition_name ? ` · ${target.competition_name}` : ''}
								{target.main_position || target.position ? ` · ${target.main_position || target.position}` : ''}
							</>
						) : (
							'nieznany zawodnik'
						)}
						.
					</span>
				</div>
			</div>
			<div className="tears">
				{[...Array(4)].map((_, i) => (
					<span key={i} className="tear" style={{ '--delay': `${i * 0.2}s`, '--x': `${20 + i * 20}%` }}></span>
				))}
			</div>
		</div>
	);
}
