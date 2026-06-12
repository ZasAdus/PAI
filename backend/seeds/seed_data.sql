-- Mock data for leaderboard (password for all: "haslo123")
-- Bcrypt hash of "haslo123": $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.FOGFhcJjv.QhKq
INSERT INTO users (id, username, hashed_password) VALUES (999, 'PolskiPiłkarzKamil', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.FOGFhcJjv.QhKq') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, hashed_password) VALUES (1000, 'Kibic123', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.FOGFhcJjv.QhKq') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, hashed_password) VALUES (1001, 'JohnPork', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.FOGFhcJjv.QhKq') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, hashed_password) VALUES (1002, 'Striker99', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.FOGFhcJjv.QhKq') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, hashed_password) VALUES (1003, 'GoalKeeper', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.FOGFhcJjv.QhKq') ON CONFLICT (id) DO NOTHING;

-- Mock game results with streak data
-- Using fixed player_id 1 since players might not be loaded yet
INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id) 
SELECT 999, 'mock-session-1', CURRENT_DATE - INTERVAL '7 day', 4, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '7 day');

INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id) 
SELECT 999, 'mock-session-2', CURRENT_DATE - INTERVAL '6 day', 3, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '6 day');

INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id) 
SELECT 999, 'mock-session-3', CURRENT_DATE - INTERVAL '5 day', 2, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '5 day');

INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id) 
SELECT 999, 'mock-session-4', CURRENT_DATE - INTERVAL '4 day', 5, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '4 day');

INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id) 
SELECT 999, 'mock-session-5', CURRENT_DATE - INTERVAL '3 day', 1, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '3 day');

INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id) 
SELECT 999, 'mock-session-6', CURRENT_DATE - INTERVAL '2 day', 3, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '2 day');

INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id) 
SELECT 999, 'mock-session-7', CURRENT_DATE - INTERVAL '1 day', 4, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE - INTERVAL '1 day');

INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id) 
SELECT 999, 'mock-session-8', CURRENT_DATE, 2, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 999 AND date = CURRENT_DATE);

-- Kibic123 - casual player
INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id) 
SELECT 1000, 'mock-session-10', CURRENT_DATE - INTERVAL '2 day', 5, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1000 AND date = CURRENT_DATE - INTERVAL '2 day');

INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id) 
SELECT 1000, 'mock-session-11', CURRENT_DATE, 8, false, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1000 AND date = CURRENT_DATE);

-- FutbolMaster - many wins but streak broken (lost yesterday)
INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id)
SELECT 1001, 'mock-session-20', CURRENT_DATE - INTERVAL '10 day', 3, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1001 AND date = CURRENT_DATE - INTERVAL '10 day');

INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id)
SELECT 1001, 'mock-session-21', CURRENT_DATE - INTERVAL '9 day', 4, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1001 AND date = CURRENT_DATE - INTERVAL '9 day');

INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id)
SELECT 1001, 'mock-session-22', CURRENT_DATE - INTERVAL '8 day', 2, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1001 AND date = CURRENT_DATE - INTERVAL '8 day');

INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id)
SELECT 1001, 'mock-session-23', CURRENT_DATE - INTERVAL '7 day', 5, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1001 AND date = CURRENT_DATE - INTERVAL '7 day');

INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id)
SELECT 1001, 'mock-session-24', CURRENT_DATE - INTERVAL '1 day', 8, false, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1001 AND date = CURRENT_DATE - INTERVAL '1 day');

INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id)
SELECT 1001, 'mock-session-25', CURRENT_DATE, 3, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1001 AND date = CURRENT_DATE);

-- Striker99
INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id) 
SELECT 1002, 'mock-session-30', CURRENT_DATE - INTERVAL '1 day', 6, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1002 AND date = CURRENT_DATE - INTERVAL '1 day');

INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id) 
SELECT 1002, 'mock-session-31', CURRENT_DATE, 4, true, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1002 AND date = CURRENT_DATE);

-- GoalKeeper - only loss
INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id) 
SELECT 1003, 'mock-session-40', CURRENT_DATE, 8, false, 1
WHERE NOT EXISTS (SELECT 1 FROM game_results WHERE user_id = 1003 AND date = CURRENT_DATE);

-- Calculate and store streak for each user (PostgreSQL syntax)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'streak') THEN
        ALTER TABLE users ADD COLUMN streak INT DEFAULT 0;
    END IF;
END $$;

-- Reset streak values for all users
UPDATE users SET streak = 0;

-- MistrzPiłki: 8-day streak
UPDATE users SET streak = 8 WHERE id = 999;

-- FutbolMaster: 4-day streak  
UPDATE users SET streak = 4 WHERE id = 1001;

-- Striker99: 2-day streak
UPDATE users SET streak = 2 WHERE id = 1002;

-- Kibic123: 0 (lost today, only 1 previous win)
UPDATE users SET streak = 0 WHERE id = 1000;

-- GoalKeeper: 0 (never won)
UPDATE users SET streak = 0 WHERE id = 1003;


DROP TABLE IF EXISTS players;

CREATE TABLE players (
    player_id BIGINT,
    player_slug TEXT,
    player_name TEXT,
    player_image_url TEXT,
    name_in_home_country TEXT,
    date_of_birth TEXT,
    place_of_birth TEXT,
    country_of_birth TEXT,
    height TEXT,
    citizenship TEXT,
    is_eu TEXT,
    position TEXT,
    main_position TEXT,
    foot TEXT,
    current_club_id TEXT,
    current_club_name TEXT,
    joined TEXT,
    contract_expires TEXT,
    outfitter TEXT,
    social_media_url TEXT,
    player_agent_id TEXT,
    player_agent_name TEXT,
    contract_option TEXT,
    date_of_last_contract_extension TEXT,
    on_loan_from_club_id TEXT,
    on_loan_from_club_name TEXT,
    contract_there_expires TEXT,
    second_club_url TEXT,
    second_club_name TEXT,
    third_club_url TEXT,
    third_club_name TEXT,
    fourth_club_url TEXT,
    fourth_club_name TEXT,
    date_of_death TEXT
);

COPY players (
    player_id,
    player_slug,
    player_name,
    player_image_url,
    name_in_home_country,
    date_of_birth,
    place_of_birth,
    country_of_birth,
    height,
    citizenship,
    is_eu,
    position,
    main_position,
    foot,
    current_club_id,
    current_club_name,
    joined,
    contract_expires,
    outfitter,
    social_media_url,
    player_agent_id,
    player_agent_name,
    contract_option,
    date_of_last_contract_extension,
    on_loan_from_club_id,
    on_loan_from_club_name,
    contract_there_expires,
    second_club_url,
    second_club_name,
    third_club_url,
    third_club_name,
    fourth_club_url,
    fourth_club_name,
    date_of_death
)
FROM '/docker-entrypoint-initdb.d/player_profiles.csv'
WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');


DROP TABLE IF EXISTS competitions;
CREATE TABLE competitions (
    club_division TEXT,
    club_id TEXT,
    competition_id TEXT,
    competition_name TEXT,
    season_draws TEXT,
    season_goal_difference TEXT,
    season_goals_against TEXT,
    season_goals_for TEXT,
    season_id TEXT,
    season_is_two_point_system TEXT,
    season_league_competition_id TEXT,
    season_league_league_name TEXT,
    season_league_league_slug TEXT,
    season_league_level_level_name TEXT,
    season_league_level_level_number TEXT,
    season_league_season_id TEXT,
    season_losses TEXT,
    season_manager TEXT,
    season_manager_manager_id TEXT,
    season_manager_manager_name TEXT,
    season_manager_manager_slug TEXT,
    season_points TEXT,
    season_points_against TEXT,
    season_points_for TEXT,
    season_rank TEXT,
    season_season TEXT,
    season_total_matches TEXT,
    season_wins TEXT,
    team_name TEXT
);

COPY competitions (
    club_division,
    club_id,
    competition_id,
    competition_name,
    season_draws,
    season_goal_difference,
    season_goals_against,
    season_goals_for,
    season_id,
    season_is_two_point_system,
    season_league_competition_id,
    season_league_league_name,
    season_league_league_slug,
    season_league_level_level_name,
    season_league_level_level_number,
    season_league_season_id,
    season_losses,
    season_manager,
    season_manager_manager_id,
    season_manager_manager_name,
    season_manager_manager_slug,
    season_points,
    season_points_against,
    season_points_for,
    season_rank,
    season_season,
    season_total_matches,
    season_wins,
    team_name
) FROM '/docker-entrypoint-initdb.d/team_competitions_seasons.csv'
WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

DROP TABLE IF EXISTS clubs;
CREATE TABLE clubs (
    club_id TEXT,
    club_slug TEXT,
    club_name TEXT,
    logo_url TEXT,
    country_name TEXT,
    season_id TEXT,
    competition_id TEXT,
    competition_slug TEXT,
    competition_name TEXT,
    club_division TEXT,
    source_url TEXT,
    _last_modified_at TEXT
);

COPY clubs (
    club_id,
    club_slug,
    club_name,
    logo_url,
    country_name,
    season_id,
    competition_id,
    competition_slug,
    competition_name,
    club_division,
    source_url,
    _last_modified_at
) FROM '/docker-entrypoint-initdb.d/team_details.csv'
WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');


DELETE FROM players 
    WHERE current_club_id 
    NOT IN (SELECT club_id FROM competitions 
        WHERE competitions.competition_id IN ('ES1','GB1','L1','FR1','IT1') 
    AND season_id = '2025');

DELETE FROM clubs 
	WHERE club_id 
    NOT IN (SELECT club_id FROM competitions 
        WHERE competitions.competition_id IN ('ES1','GB1','L1','FR1','IT1') 
    AND season_id = '2025');
