# GuessThePlayer ⚽

Gry polegająca na odgadywaniu zawodnika dnia i klubu dnia


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
