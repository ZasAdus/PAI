import ClubGameBoard from '../components/GuessTheClub/ClubGameBoard';

export default function GuessTheClubPage() {
	return (
		<div className="game-page">
			<section className="game-page-head">
				<div className="eyebrow">Guess The Club</div>
				<h1>Widzisz narodowości pierwszej XI pewnego klubu. Odgadnij, który to klub.</h1>
			</section>
			<ClubGameBoard />
		</div>
	);
}
