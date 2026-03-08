
-- Add age group to competitions for age-restricted tournaments
ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS age_group text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS age_cutoff_date date DEFAULT NULL;

-- age_group values: 'U-15', 'U-17', 'U-20', 'U-23', 'Senior', NULL (no restriction)
-- age_cutoff_date: the date used to calculate player age (usually Jan 1 of competition year)

COMMENT ON COLUMN public.competitions.age_group IS 'Age category restriction: U-15, U-17, U-20, U-23, Senior, or NULL for no restriction';
COMMENT ON COLUMN public.competitions.age_cutoff_date IS 'Date used to calculate player age eligibility. If NULL, uses competition start_date.';
