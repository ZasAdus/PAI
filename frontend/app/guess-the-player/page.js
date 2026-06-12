import GameBoard from '../components/GuessThePlayer/GameBoard';

export default function GamePage() {
	return (
		<div className="game-page">
			<section className="game-page-head">
				<div className="eyebrow">Guess The Player</div>
				<h1>Dzienne wyzwanie piłkarskie</h1>
				<p>Odgadnij tajemniczego zawodnika z topowych lig europejskich na podstawie podpowiedzi.</p>
			</section>
			<GameBoard />
		</div>
	);
}
