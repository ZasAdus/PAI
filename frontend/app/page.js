import GameBoard from './components/GuessThePlayer/GameBoard';

export default function HomePage() {
  return (
    <div className="game-page">
      <div className="game-page-head">
        <span className="eyebrow">Wyzwanie dnia</span>
        <h1>Zgadnij Zawodnika</h1>
        <p>Masz 8 prób, aby odgadnąć tajemniczego piłkarza z topowych lig europejskich.</p>
      </div>
      <GameBoard />
    </div>
  );
}
