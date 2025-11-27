-- Create referees table
CREATE TABLE public.referees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  license_number TEXT UNIQUE,
  license_type TEXT NOT NULL DEFAULT 'Nasional',
  license_valid_until DATE,
  phone TEXT,
  email TEXT,
  photo_url TEXT,
  specialization TEXT,
  experience_years INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create match_officials table for referee assignments
CREATE TABLE public.match_officials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES public.referees(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  confirmed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(match_id, role)
);

-- Create match_reports table
CREATE TABLE public.match_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES public.referees(id) ON DELETE CASCADE NOT NULL,
  report_content TEXT,
  discipline_summary TEXT,
  incidents JSONB DEFAULT '[]'::jsonb,
  weather_notes TEXT,
  pitch_quality TEXT,
  attendance_estimate INTEGER,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referees
CREATE POLICY "Anyone can view referees"
ON public.referees FOR SELECT
USING (true);

CREATE POLICY "Admin federasi can manage referees"
ON public.referees FOR ALL
USING (has_role(auth.uid(), 'admin_federasi'::app_role));

CREATE POLICY "Wasit can view their own profile"
ON public.referees FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Wasit can update their own profile"
ON public.referees FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for match_officials
CREATE POLICY "Anyone can view match officials"
ON public.match_officials FOR SELECT
USING (true);

CREATE POLICY "Admin federasi can manage match officials"
ON public.match_officials FOR ALL
USING (has_role(auth.uid(), 'admin_federasi'::app_role));

CREATE POLICY "Panitia can manage match officials"
ON public.match_officials FOR ALL
USING (has_role(auth.uid(), 'panitia'::app_role));

CREATE POLICY "Wasit can confirm their assignments"
ON public.match_officials FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.referees
    WHERE referees.id = match_officials.referee_id
    AND referees.user_id = auth.uid()
  )
);

-- RLS Policies for match_reports
CREATE POLICY "Admin federasi can view all match reports"
ON public.match_reports FOR SELECT
USING (has_role(auth.uid(), 'admin_federasi'::app_role));

CREATE POLICY "Panitia can view match reports"
ON public.match_reports FOR SELECT
USING (has_role(auth.uid(), 'panitia'::app_role));

CREATE POLICY "Wasit can create reports for their matches"
ON public.match_reports FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.referees
    WHERE referees.id = match_reports.referee_id
    AND referees.user_id = auth.uid()
  )
);

CREATE POLICY "Wasit can view their own reports"
ON public.match_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.referees
    WHERE referees.id = match_reports.referee_id
    AND referees.user_id = auth.uid()
  )
);

CREATE POLICY "Wasit can update their unsubmitted reports"
ON public.match_reports FOR UPDATE
USING (
  submitted_at IS NULL AND
  EXISTS (
    SELECT 1 FROM public.referees
    WHERE referees.id = match_reports.referee_id
    AND referees.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_referees_status ON public.referees(status);
CREATE INDEX idx_referees_user_id ON public.referees(user_id);
CREATE INDEX idx_match_officials_match ON public.match_officials(match_id);
CREATE INDEX idx_match_officials_referee ON public.match_officials(referee_id);
CREATE INDEX idx_match_reports_match ON public.match_reports(match_id);
CREATE INDEX idx_match_reports_referee ON public.match_reports(referee_id);

-- Create updated_at trigger for referees
CREATE TRIGGER update_referees_updated_at
BEFORE UPDATE ON public.referees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for match_officials
CREATE TRIGGER update_match_officials_updated_at
BEFORE UPDATE ON public.match_officials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for match_reports
CREATE TRIGGER update_match_reports_updated_at
BEFORE UPDATE ON public.match_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();