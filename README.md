# GuessThePlayer ⚽

Gra polegająca na odgadywaniu "zawodnika dnia" na podstawie atrybutów takich jak klub, liga, kraj, pozycja i wiek.

## Wymagania Minimalne (Spełnione)

- **R1: Backend API** - FastAPI z endpointami dla zawodników, autentykacji, gier, rankingu i statystyk.
- **R2: Baza danych** - PostgreSQL z relacjami (Użytkownicy, Wyniki Gier, Zawodnicy). Migracje zarządzane przez Alembic.
- **R3: Frontend** - Aplikacja Next.js z interfejsem użytkownika.
- **R4: Autentykacja** - System JWT (rejestracja, logowanie, ochrona wyników).
- **R5: Konteneryzacja** - Pełna konfiguracja `docker-compose.yml`.
- **R6: Repozytorium** - Historia commitów, README z instrukcją.

## Architektura

- **Backend:** FastAPI (Python)
- **Frontend:** Next.js (React)
- **Baza danych:** PostgreSQL
- **Cache:** Redis (przechowywanie stanu sesji gier)
- **Migracje:** Alembic

## Uruchomienie

Aby uruchomić całą aplikację:

```bash
docker-compose up --build
```

Aplikacja będzie dostępna pod adresem:
- Frontend: `http://localhost:3000`
- API Docs: `http://localhost:8000/docs`

### Migracje bazy danych

Migracje są wykonywane automatycznie przy starcie kontenera (można dodać do entrypointa) lub ręcznie:

```bash
docker-compose exec backend alembic upgrade head
```
