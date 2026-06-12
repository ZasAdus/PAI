import ClubGameBoard from '../components/GuessTheClub/ClubGameBoard';

export default function GuessTheClubPage() {
	return (
		<div className="game-page">
			<section className="game-page-head">
				<div className="eyebrow">Guess The Club</div>
				<h1>Odgadnij klub po flagach składu</h1>
				<p>Widzisz obywatelstwa 11 najcenniejszych zawodników w ustawieniu 4-4-2. Masz 4 próby, aby odgadnąć klub dnia.</p>
			</section>
			<ClubGameBoard />
		</div>
	);
}
