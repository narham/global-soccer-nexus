-- Update transfer_windows constraint to support Indonesian transfer types
ALTER TABLE transfer_windows 
DROP CONSTRAINT IF EXISTS transfer_windows_window_type_check;

ALTER TABLE transfer_windows
ADD CONSTRAINT transfer_windows_window_type_check 
CHECK (window_type = ANY (ARRAY['regular'::text, 'mid_season'::text, 'special'::text, 'emergency'::text]));