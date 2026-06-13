import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="game-page">
      <div className="game-page-head">
        <span className="eyebrow">Wyzwanie dnia</span>
        <h1>Wybierz tryb gry:</h1>
      </div>

      <div className="home-modes">
        <Link href="/guess-the-player" className="home-mode-card">
          <span className="eyebrow">Tryb 1</span>
          <h2>Zgadnij Zawodnika</h2>
          <p>Masz 8 prób przy koljenych próbach dostajesz coraz więcej informacji.</p>
        </Link>
        <Link href="/guess-the-club" className="home-mode-card">
          <span className="eyebrow">Tryb 2</span>
          <h2>Zgadnij Klub</h2>
          <p>Masz 4 próby odgadnięcia klubu na podstawie narodowości pierwszej XI.</p>
        </Link>
      </div>
    </div>
  );
}
