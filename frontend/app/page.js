﻿﻿import GameBoard from './components/GuessThePlayer/GameBoard';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="game-page">
      <div className="game-page-head">
        <span className="eyebrow">Wyzwanie dnia</span>
        <h1>Piłkarskie daily challenge</h1>
        <p>Wybierz tryb gry: klasyczne zgadywanie piłkarza albo nowy tryb odgadywania klubu po flagach składu.</p>
      </div>

      <div className="home-modes">
        <Link href="/guess-the-player" className="home-mode-card">
          <span className="eyebrow">Tryb 1</span>
          <h2>Zgadnij Zawodnika</h2>
          <p>Masz 8 prób i porównujesz klub, kraj, ligę, pozycję oraz wiek.</p>
        </Link>
        <Link href="/guess-the-club" className="home-mode-card">
          <span className="eyebrow">Tryb 2</span>
          <h2>Zgadnij Klub</h2>
          <p>Odczytaj flagi 11 najcenniejszych piłkarzy w formacji 4-4-2 i odgadnij klub w 4 próbach.</p>
        </Link>
      </div>

      <GameBoard />
    </div>
  );
}
