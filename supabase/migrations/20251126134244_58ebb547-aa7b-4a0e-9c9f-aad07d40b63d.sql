-- SEED DUMMY DATA - Football Management System
-- Stadiums, Clubs, Players, Competitions, Transfer Windows, Standings

-- 1. STADIUMS
INSERT INTO stadiums (name, city, address, capacity, vip_seats, media_seats, field_length, field_width, lighting_lux, parking_capacity, dressing_rooms, has_medical_room, has_doping_control_room, has_video_screen, afc_license_status, afc_license_valid_from, afc_license_valid_until) VALUES
('Stadion Utama GBK', 'Jakarta', 'Jl. Pintu Satu Senayan', 77193, 5000, 500, 105, 68, 2500, 5000, 6, true, true, true, 'active', '2024-01-01', '2026-12-31'),
('Stadion Si Jalak Harupat', 'Bandung', 'Soreang, Bandung', 27000, 1500, 200, 105, 68, 2000, 2000, 4, true, true, true, 'active', '2024-01-01', '2026-12-31'),
('Stadion Kanjuruhan', 'Malang', 'Kepanjen', 42449, 2000, 300, 105, 68, 2200, 3000, 4, true, true, true, 'active', '2024-01-01', '2026-12-31'),
('Stadion Gelora Bung Tomo', 'Surabaya', 'Ketintang', 55000, 3000, 400, 105, 68, 2300, 4000, 5, true, true, true, 'active', '2024-01-01', '2026-12-31'),
('Stadion Mattoanging', 'Makassar', 'Mannuruki', 20000, 1000, 150, 105, 68, 2000, 1500, 4, true, true, true, 'active', '2024-01-01', '2026-12-31'),
('Stadion Dipta', 'Gianyar', 'Gianyar', 25000, 1500, 200, 105, 68, 2100, 2000, 4, true, true, true, 'active', '2024-01-01', '2026-12-31'),
('Stadion Jatidiri', 'Semarang', 'Setiabudi', 25000, 1200, 180, 105, 68, 2000, 2500, 4, true, true, true, 'active', '2024-01-01', '2026-12-31'),
('Stadion Brawijaya', 'Kediri', 'Brawijaya', 25000, 1000, 150, 105, 68, 1900, 2000, 4, true, true, false, 'active', '2024-01-01', '2026-12-31'),
('Stadion Indomilk', 'Tangerang', 'Kampung Utan', 15000, 800, 100, 105, 68, 1800, 1500, 4, true, true, true, 'active', '2024-01-01', '2026-12-31'),
('Stadion Segiri', 'Samarinda', 'Pahlawan', 20000, 1000, 150, 105, 68, 2000, 1800, 4, true, true, false, 'active', '2024-01-01', '2026-12-31'),
('Stadion Pamelingan', 'Pamekasan', 'Pamekasan', 15000, 800, 100, 105, 68, 1800, 1200, 4, true, true, false, 'active', '2024-01-01', '2026-12-31'),
('Stadion Madya', 'Jakarta', 'Senayan', 20000, 1000, 150, 105, 68, 2000, 2000, 4, true, true, true, 'active', '2024-01-01', '2026-12-31');

-- 2. CLUBS  
INSERT INTO clubs (name, short_name, city, founded_year, home_color, away_color, stadium_name, license_status, license_valid_until) VALUES
('Persija Jakarta', 'PJK', 'Jakarta', 1928, '#FF0000', '#FFFFFF', 'Stadion Utama GBK', 'active', '2025-12-31'),
('Persib Bandung', 'PSB', 'Bandung', 1933, '#2563EB', '#FFFFFF', 'Stadion Si Jalak Harupat', 'active', '2025-12-31'),
('Arema FC', 'ARM', 'Malang', 1987, '#1E40AF', '#FBBF24', 'Stadion Kanjuruhan', 'active', '2025-12-31'),
('Persebaya Surabaya', 'PBS', 'Surabaya', 1927, '#16A34A', '#FFFFFF', 'Stadion Gelora Bung Tomo', 'active', '2025-12-31'),
('PSM Makassar', 'PSM', 'Makassar', 1915, '#DC2626', '#000000', 'Stadion Mattoanging', 'active', '2025-12-31'),
('Bali United', 'BLU', 'Gianyar', 2015, '#DC2626', '#FFFFFF', 'Stadion Dipta', 'active', '2025-12-31'),
('PSIS Semarang', 'PSIS', 'Semarang', 1932, '#7C3AED', '#FFFFFF', 'Stadion Jatidiri', 'active', '2025-12-31'),
('Persik Kediri', 'PRK', 'Kediri', 1950, '#16A34A', '#FFFFFF', 'Stadion Brawijaya', 'active', '2025-12-31'),
('Persita Tangerang', 'PTA', 'Tangerang', 1953, '#9333EA', '#F59E0B', 'Stadion Indomilk', 'active', '2025-12-31'),
('Borneo FC', 'BFC', 'Samarinda', 2014, '#DC2626', '#000000', 'Stadion Segiri', 'active', '2025-12-31'),
('Madura United', 'MDU', 'Pamekasan', 2016, '#EF4444', '#FFFFFF', 'Stadion Pamelingan', 'active', '2025-12-31'),
('Bhayangkara FC', 'BHY', 'Jakarta', 2010, '#1E40AF', '#DC2626', 'Stadion Madya', 'active', '2025-12-31');

-- 3. COMPETITIONS
INSERT INTO competitions (name, season, type, format, start_date, end_date, num_teams, status) VALUES
('Liga 1 Indonesia 2024/2025', '2024/2025', 'liga', 'round_robin', '2024-08-01', '2025-05-31', 18, 'ongoing'),
('Piala Indonesia 2024', '2024', 'piala', 'knockout', '2024-03-01', '2024-06-30', 32, 'finished');

-- 4. TRANSFER WINDOWS
INSERT INTO transfer_windows (name, window_type, start_date, end_date, is_active) VALUES
('Transfer Window Musim Panas 2024', 'summer', '2024-06-01', '2024-08-31', false),
('Transfer Window Musim Dingin 2025', 'winter', '2025-01-01', '2025-01-31', true),
('Transfer Window Mid Season 2024', 'mid_season', '2024-12-01', '2024-12-15', false);

-- 5. COMPETITION TEAMS
INSERT INTO competition_teams (competition_id, club_id) 
SELECT c.id, cl.id FROM competitions c, clubs cl WHERE c.name = 'Liga 1 Indonesia 2024/2025';

-- 6. STANDINGS
INSERT INTO standings (competition_id, club_id, position, played, won, drawn, lost, goals_for, goals_against, goal_difference, points)
SELECT c.id, cl.id, ROW_NUMBER() OVER (ORDER BY RANDOM()), 10, 
FLOOR(RANDOM() * 8)::int, FLOOR(RANDOM() * 4)::int, FLOOR(RANDOM() * 3)::int,
FLOOR(RANDOM() * 20 + 5)::int, FLOOR(RANDOM() * 15 + 3)::int, 0, 0
FROM competitions c, clubs cl WHERE c.name = 'Liga 1 Indonesia 2024/2025';

UPDATE standings SET goal_difference = goals_for - goals_against, points = (won * 3) + drawn;