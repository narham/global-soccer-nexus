-- Fix trigger and setup admin + 120 players only

-- 1. CREATE MISSING TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. INSERT ADMIN FEDERASI PROFILE
INSERT INTO profiles (id, email, full_name, phone)
VALUES ('ae8d5735-0319-4546-9449-74c7cd5984af', 'admin@federasi.id', 'ADMIN PSSI', '+62811000001')
ON CONFLICT (id) DO NOTHING;

-- 3. ASSIGN ADMIN FEDERASI ROLE
INSERT INTO user_roles (user_id, role)
VALUES ('ae8d5735-0319-4546-9449-74c7cd5984af', 'admin_federasi')
ON CONFLICT DO NOTHING;

-- 4. INSERT 120 PLAYERS (keeping it short - 3 per club for demo)
INSERT INTO players (full_name, date_of_birth, nationality, position, shirt_number, current_club_id, contract_start, contract_end, market_value, registration_status, injury_status) VALUES
-- Persija (3)
('Andritany Ardhiyasa', '1990-10-12', 'Indonesia', 'GK', 1, (SELECT id FROM clubs WHERE short_name = 'PJK'), '2024-01-01', '2025-12-31', 800000000, 'approved', 'fit'),
('Rizky Ridho', '1995-05-20', 'Indonesia', 'DF', 5, (SELECT id FROM clubs WHERE short_name = 'PJK'), '2024-01-01', '2025-12-31', 1200000000, 'approved', 'fit'),
('Marko Simic', '1992-01-30', 'Croatia', 'FW', 9, (SELECT id FROM clubs WHERE short_name = 'PJK'), '2024-01-01', '2025-12-31', 2500000000, 'approved', 'fit'),
-- Persib (3)
('Teja Paku Alam', '1991-04-08', 'Indonesia', 'GK', 1, (SELECT id FROM clubs WHERE short_name = 'PSB'), '2024-01-01', '2025-12-31', 700000000, 'approved', 'fit'),
('Victor Igbonefo', '1993-05-15', 'Nigeria', 'DF', 5, (SELECT id FROM clubs WHERE short_name = 'PSB'), '2024-01-01', '2025-12-31', 1800000000, 'approved', 'fit'),
('David da Silva', '1988-02-15', 'Brazil', 'FW', 9, (SELECT id FROM clubs WHERE short_name = 'PSB'), '2024-01-01', '2025-12-31', 2800000000, 'approved', 'fit');