-- Stadium Seating Sections
CREATE TABLE public.stadium_seating_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id UUID NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  section_code TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  section_type TEXT NOT NULL DEFAULT 'regular',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(stadium_id, section_code)
);

-- Match Ticket Categories
CREATE TABLE public.match_ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  seating_section_id UUID REFERENCES public.stadium_seating_sections(id),
  category_name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_quota INTEGER NOT NULL DEFAULT 0,
  sold_count INTEGER NOT NULL DEFAULT 0,
  reserved_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  sale_start_date TIMESTAMPTZ,
  sale_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ticket Orders
CREATE TABLE public.ticket_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  match_id UUID NOT NULL REFERENCES public.matches(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  notes TEXT,
  expired_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual Tickets
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.ticket_orders(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.match_ticket_categories(id),
  ticket_code TEXT UNIQUE NOT NULL,
  barcode_data TEXT,
  seat_number TEXT,
  holder_name TEXT,
  is_checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_stadium_sections_stadium ON public.stadium_seating_sections(stadium_id);
CREATE INDEX idx_match_tickets_match ON public.match_ticket_categories(match_id);
CREATE INDEX idx_ticket_orders_user ON public.ticket_orders(user_id);
CREATE INDEX idx_ticket_orders_match ON public.ticket_orders(match_id);
CREATE INDEX idx_ticket_orders_status ON public.ticket_orders(status);
CREATE INDEX idx_tickets_order ON public.tickets(order_id);
CREATE INDEX idx_tickets_code ON public.tickets(ticket_code);
CREATE INDEX idx_tickets_category ON public.tickets(category_id);

-- Enable RLS
ALTER TABLE public.stadium_seating_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stadium_seating_sections
CREATE POLICY "Anyone can view seating sections"
ON public.stadium_seating_sections FOR SELECT
USING (true);

CREATE POLICY "Admin federasi can manage seating sections"
ON public.stadium_seating_sections FOR ALL
USING (has_role(auth.uid(), 'admin_federasi'));

CREATE POLICY "Panitia can manage seating sections"
ON public.stadium_seating_sections FOR ALL
USING (has_role(auth.uid(), 'panitia'));

-- RLS Policies for match_ticket_categories
CREATE POLICY "Anyone can view ticket categories"
ON public.match_ticket_categories FOR SELECT
USING (true);

CREATE POLICY "Admin federasi can manage ticket categories"
ON public.match_ticket_categories FOR ALL
USING (has_role(auth.uid(), 'admin_federasi'));

CREATE POLICY "Panitia can manage ticket categories"
ON public.match_ticket_categories FOR ALL
USING (has_role(auth.uid(), 'panitia'));

-- RLS Policies for ticket_orders
CREATE POLICY "Users can view their own orders"
ON public.ticket_orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
ON public.ticket_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin federasi can view all orders"
ON public.ticket_orders FOR SELECT
USING (has_role(auth.uid(), 'admin_federasi'));

CREATE POLICY "Admin federasi can manage all orders"
ON public.ticket_orders FOR ALL
USING (has_role(auth.uid(), 'admin_federasi'));

CREATE POLICY "Panitia can view all orders"
ON public.ticket_orders FOR SELECT
USING (has_role(auth.uid(), 'panitia'));

CREATE POLICY "Panitia can manage orders"
ON public.ticket_orders FOR ALL
USING (has_role(auth.uid(), 'panitia'));

-- RLS Policies for tickets
CREATE POLICY "Users can view their own tickets"
ON public.tickets FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.ticket_orders 
  WHERE ticket_orders.id = tickets.order_id 
  AND ticket_orders.user_id = auth.uid()
));

CREATE POLICY "Admin federasi can view all tickets"
ON public.tickets FOR SELECT
USING (has_role(auth.uid(), 'admin_federasi'));

CREATE POLICY "Admin federasi can manage all tickets"
ON public.tickets FOR ALL
USING (has_role(auth.uid(), 'admin_federasi'));

CREATE POLICY "Panitia can view all tickets"
ON public.tickets FOR SELECT
USING (has_role(auth.uid(), 'panitia'));

CREATE POLICY "Panitia can manage tickets"
ON public.tickets FOR ALL
USING (has_role(auth.uid(), 'panitia'));

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  seq_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT LPAD((COALESCE(MAX(SUBSTRING(order_number FROM 10)::INTEGER), 0) + 1)::TEXT, 5, '0')
  INTO seq_part
  FROM ticket_orders
  WHERE order_number LIKE 'TKT' || date_part || '%';
  
  new_number := 'TKT' || date_part || seq_part;
  RETURN new_number;
END;
$$;

-- Function to generate ticket code
CREATE OR REPLACE FUNCTION public.generate_ticket_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INTEGER;
BEGIN
  new_code := '';
  FOR i IN 1..10 LOOP
    new_code := new_code || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN new_code;
END;
$$;

-- Trigger to update sold_count when ticket is created
CREATE OR REPLACE FUNCTION public.update_ticket_category_sold_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE match_ticket_categories 
    SET sold_count = sold_count + 1
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE match_ticket_categories 
    SET sold_count = sold_count - 1
    WHERE id = OLD.category_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_sold_count
AFTER INSERT OR DELETE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_ticket_category_sold_count();