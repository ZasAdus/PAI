import GameBoard from '../components/GuessThePlayer/GameBoard';

export default function GamePage() {
	return (
		<div className="game-page">
			<section className="game-page-head">
				<div className="eyebrow">Guess The Player</div>
				<h1>Odgadnij tajemniczego zawodnika grającego w jednej z 5 topowych lig europejskich</h1>
			</section>
			<GameBoard />
		</div>
	);
}
