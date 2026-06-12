INSERT INTO users (id, username, hashed_password)
VALUES (999, 'PolskiPiłkarzKamil', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.FOGFhcJjv.QhKq')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, username, hashed_password)
VALUES (1000, 'Kibic123', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.FOGFhcJjv.QhKq')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, username, hashed_password)
VALUES (1001, 'JohnPork', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.FOGFhcJjv.QhKq')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, username, hashed_password)
VALUES (1002, 'Striker99', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.FOGFhcJjv.QhKq')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, username, hashed_password)
VALUES (1003, 'GoalKeeper', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.FOGFhcJjv.QhKq')
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 999, 'mock-session-1', CURRENT_DATE - INTERVAL '7 day', 'player', 4, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '7 day' AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 999, 'mock-session-2', CURRENT_DATE - INTERVAL '6 day', 'player', 3, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '6 day' AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 999, 'mock-session-3', CURRENT_DATE - INTERVAL '5 day', 'player', 2, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '5 day' AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 999, 'mock-session-4', CURRENT_DATE - INTERVAL '4 day', 'player', 5, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '4 day' AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 999, 'mock-session-5', CURRENT_DATE - INTERVAL '3 day', 'player', 1, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '3 day' AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 999, 'mock-session-6', CURRENT_DATE - INTERVAL '2 day', 'player', 3, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '2 day' AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 999, 'mock-session-7', CURRENT_DATE - INTERVAL '1 day', 'player', 4, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '1 day' AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 999, 'mock-session-8', CURRENT_DATE, 'player', 2, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 1000, 'mock-session-10', CURRENT_DATE - INTERVAL '2 day', 'player', 5, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1000 AND date = CURRENT_DATE - INTERVAL '2 day' AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 1000, 'mock-session-11', CURRENT_DATE, 'player', 8, false, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1000 AND date = CURRENT_DATE AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 1001, 'mock-session-20', CURRENT_DATE - INTERVAL '10 day', 'player', 3, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1001 AND date = CURRENT_DATE - INTERVAL '10 day' AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 1001, 'mock-session-21', CURRENT_DATE - INTERVAL '9 day', 'player', 4, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1001 AND date = CURRENT_DATE - INTERVAL '9 day' AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 1001, 'mock-session-22', CURRENT_DATE - INTERVAL '8 day', 'player', 2, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1001 AND date = CURRENT_DATE - INTERVAL '8 day' AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 1001, 'mock-session-23', CURRENT_DATE - INTERVAL '7 day', 'player', 5, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1001 AND date = CURRENT_DATE - INTERVAL '7 day' AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 1001, 'mock-session-24', CURRENT_DATE - INTERVAL '1 day', 'player', 8, false, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1001 AND date = CURRENT_DATE - INTERVAL '1 day' AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 1001, 'mock-session-25', CURRENT_DATE, 'player', 3, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1001 AND date = CURRENT_DATE AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 1002, 'mock-session-30', CURRENT_DATE - INTERVAL '1 day', 'player', 6, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1002 AND date = CURRENT_DATE - INTERVAL '1 day' AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 1002, 'mock-session-31', CURRENT_DATE, 'player', 4, true, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1002 AND date = CURRENT_DATE AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 1003, 'mock-session-40', CURRENT_DATE, 'player', 8, false, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1003 AND date = CURRENT_DATE AND game_type = 'player');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 999, 'mock-club-session-1', CURRENT_DATE - INTERVAL '1 day', 'club', 2, true, NULL,
  (SELECT club_id FROM clubs ORDER BY club_id ASC LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '1 day' AND game_type = 'club');

INSERT INTO game_results (user_id, session_id, date, game_type, attempts_used, solved, target_player_id, target_club_id)
SELECT 1000, 'mock-club-session-2', CURRENT_DATE, 'club', 4, false, NULL,
  (SELECT club_id FROM clubs ORDER BY club_id ASC LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1000 AND date = CURRENT_DATE AND game_type = 'club');

UPDATE users SET streak = 0;
UPDATE users SET streak = 8 WHERE id = 999;
UPDATE users SET streak = 4 WHERE id = 1001;
UPDATE users SET streak = 2 WHERE id = 1002;
