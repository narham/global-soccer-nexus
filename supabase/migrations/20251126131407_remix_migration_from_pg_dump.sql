CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin_federasi',
    'admin_klub',
    'wasit',
    'panitia'
);


--
-- Name: card_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.card_type AS ENUM (
    'yellow',
    'red'
);


--
-- Name: competition_format; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.competition_format AS ENUM (
    'round_robin',
    'knockout',
    'group_knockout'
);


--
-- Name: competition_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.competition_type AS ENUM (
    'liga',
    'piala',
    'youth_league'
);


--
-- Name: match_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.match_status AS ENUM (
    'scheduled',
    'live',
    'finished',
    'postponed',
    'cancelled'
);


--
-- Name: player_position; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.player_position AS ENUM (
    'GK',
    'DF',
    'MF',
    'FW'
);


--
-- Name: player_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.player_status AS ENUM (
    'fit',
    'cedera',
    'pemulihan'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: club_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.club_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    club_id uuid NOT NULL,
    document_type text NOT NULL,
    document_url text NOT NULL,
    valid_from date,
    valid_until date,
    verified boolean DEFAULT false,
    verified_by uuid,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: club_staff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.club_staff (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    club_id uuid NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    phone text,
    email text,
    joined_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clubs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clubs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    short_name text,
    logo_url text,
    founded_year integer,
    city text,
    address text,
    stadium_name text,
    home_color text,
    away_color text,
    license_status text DEFAULT 'pending'::text,
    license_valid_until date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: competition_teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competition_teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    competition_id uuid NOT NULL,
    club_id uuid NOT NULL,
    group_name text,
    seed integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: competitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    logo_url text,
    type public.competition_type NOT NULL,
    format public.competition_format NOT NULL,
    season text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    num_teams integer,
    num_groups integer,
    description text,
    status text DEFAULT 'upcoming'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: match_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid NOT NULL,
    minute integer NOT NULL,
    event_type text NOT NULL,
    player_id uuid,
    club_id uuid NOT NULL,
    description text,
    card_type public.card_type,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    player_out_id uuid,
    goal_type text,
    var_decision_type text,
    red_card_reason text
);


--
-- Name: match_lineups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_lineups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid NOT NULL,
    club_id uuid NOT NULL,
    player_id uuid NOT NULL,
    position_type text NOT NULL,
    "position" text NOT NULL,
    shirt_number integer NOT NULL,
    formation_position integer,
    rating numeric(3,1),
    minutes_played integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT match_lineups_position_type_check CHECK ((position_type = ANY (ARRAY['starting'::text, 'bench'::text])))
);


--
-- Name: match_statistics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_statistics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid NOT NULL,
    club_id uuid NOT NULL,
    possession integer DEFAULT 0,
    shots integer DEFAULT 0,
    shots_on_target integer DEFAULT 0,
    passes integer DEFAULT 0,
    pass_accuracy integer DEFAULT 0,
    tackles integer DEFAULT 0,
    fouls integer DEFAULT 0,
    corners integer DEFAULT 0,
    offsides integer DEFAULT 0,
    saves integer DEFAULT 0,
    crosses integer DEFAULT 0,
    clearances integer DEFAULT 0,
    interceptions integer DEFAULT 0,
    duels_won integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    competition_id uuid NOT NULL,
    home_club_id uuid NOT NULL,
    away_club_id uuid NOT NULL,
    matchday integer,
    group_name text,
    round text,
    match_date timestamp with time zone NOT NULL,
    venue text,
    status public.match_status DEFAULT 'scheduled'::public.match_status,
    home_score integer DEFAULT 0,
    away_score integer DEFAULT 0,
    attendance integer,
    referee_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    half_time_home_score integer,
    half_time_away_score integer,
    assistant_referee_1 text,
    assistant_referee_2 text,
    fourth_official text,
    var_official text,
    weather_condition text,
    pitch_condition text,
    match_notes text
);


--
-- Name: player_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    player_id uuid NOT NULL,
    club_id uuid NOT NULL,
    from_date date NOT NULL,
    to_date date,
    transfer_fee numeric(15,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: player_statistics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_statistics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    player_id uuid NOT NULL,
    season text NOT NULL,
    competition_id uuid,
    matches_played integer DEFAULT 0,
    goals integer DEFAULT 0,
    assists integer DEFAULT 0,
    yellow_cards integer DEFAULT 0,
    red_cards integer DEFAULT 0,
    minutes_played integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: player_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_transfers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    player_id uuid NOT NULL,
    from_club_id uuid,
    to_club_id uuid NOT NULL,
    transfer_window_id uuid,
    transfer_type text NOT NULL,
    transfer_fee numeric(15,2),
    contract_start date NOT NULL,
    contract_end date NOT NULL,
    loan_end_date date,
    status text DEFAULT 'pending'::text NOT NULL,
    requires_itc boolean DEFAULT false,
    itc_status text,
    itc_request_date timestamp with time zone,
    itc_approved_date timestamp with time zone,
    itc_approved_by uuid,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejected_reason text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    from_club_approved_at timestamp with time zone,
    from_club_approved_by uuid,
    to_club_approved_at timestamp with time zone,
    to_club_approved_by uuid,
    CONSTRAINT player_transfers_itc_status_check CHECK ((itc_status = ANY (ARRAY['not_required'::text, 'requested'::text, 'pending'::text, 'approved'::text, 'rejected'::text]))),
    CONSTRAINT player_transfers_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'club_approved'::text, 'awaiting_itc'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text]))),
    CONSTRAINT player_transfers_transfer_type_check CHECK ((transfer_type = ANY (ARRAY['permanent'::text, 'loan'::text, 'free'::text, 'end_of_contract'::text]))),
    CONSTRAINT valid_loan_dates CHECK ((((transfer_type = 'loan'::text) AND (loan_end_date IS NOT NULL)) OR ((transfer_type <> 'loan'::text) AND (loan_end_date IS NULL))))
);


--
-- Name: players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.players (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    photo_url text,
    date_of_birth date NOT NULL,
    nationality text NOT NULL,
    "position" public.player_position NOT NULL,
    shirt_number integer,
    height_cm integer,
    weight_kg integer,
    preferred_foot text,
    current_club_id uuid,
    contract_start date,
    contract_end date,
    market_value numeric(15,2),
    transfer_status text DEFAULT 'not_available'::text,
    injury_status public.player_status DEFAULT 'fit'::public.player_status,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    nik character(16),
    place_of_birth text,
    nik_province text,
    nik_city text,
    nik_district text,
    registration_status text DEFAULT 'approved'::text NOT NULL,
    registered_by uuid,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    CONSTRAINT valid_registration_status CHECK ((registration_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: role_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    requested_role public.app_role NOT NULL,
    requested_club_id uuid,
    status text DEFAULT 'pending'::text,
    reason text,
    reviewer_id uuid,
    reviewer_notes text,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT role_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: stadiums; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stadiums (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    city text NOT NULL,
    address text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    capacity integer NOT NULL,
    vip_seats integer,
    media_seats integer,
    field_length integer DEFAULT 105,
    field_width integer DEFAULT 68,
    has_undersoil_heating boolean DEFAULT false,
    lighting_lux integer,
    has_video_screen boolean DEFAULT false,
    dressing_rooms integer DEFAULT 4,
    has_medical_room boolean DEFAULT true,
    has_doping_control_room boolean DEFAULT true,
    parking_capacity integer,
    afc_license_status text DEFAULT 'pending'::text,
    afc_license_valid_from date,
    afc_license_valid_until date,
    safety_certificate_valid_until date,
    owner_club_id uuid,
    photo_url text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: standings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.standings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    competition_id uuid NOT NULL,
    club_id uuid NOT NULL,
    group_name text,
    played integer DEFAULT 0,
    won integer DEFAULT 0,
    drawn integer DEFAULT 0,
    lost integer DEFAULT 0,
    goals_for integer DEFAULT 0,
    goals_against integer DEFAULT 0,
    goal_difference integer DEFAULT 0,
    points integer DEFAULT 0,
    "position" integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: transfer_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transfer_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transfer_id uuid NOT NULL,
    approver_role text NOT NULL,
    approver_id uuid,
    status text NOT NULL,
    approved_at timestamp with time zone,
    comments text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT transfer_approvals_approver_role_check CHECK ((approver_role = ANY (ARRAY['from_club'::text, 'to_club'::text, 'admin_federasi'::text, 'fifa'::text]))),
    CONSTRAINT transfer_approvals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: transfer_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transfer_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transfer_id uuid NOT NULL,
    document_type text NOT NULL,
    document_url text NOT NULL,
    uploaded_by uuid,
    verified boolean DEFAULT false,
    verified_by uuid,
    verified_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT transfer_documents_document_type_check CHECK ((document_type = ANY (ARRAY['contract'::text, 'itc'::text, 'medical_certificate'::text, 'clearance'::text, 'passport'::text, 'other'::text])))
);


--
-- Name: transfer_windows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transfer_windows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    window_type text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT transfer_windows_window_type_check CHECK ((window_type = ANY (ARRAY['summer'::text, 'winter'::text, 'mid_season'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    club_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: club_documents club_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_documents
    ADD CONSTRAINT club_documents_pkey PRIMARY KEY (id);


--
-- Name: club_staff club_staff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_staff
    ADD CONSTRAINT club_staff_pkey PRIMARY KEY (id);


--
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_pkey PRIMARY KEY (id);


--
-- Name: competition_teams competition_teams_competition_id_club_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competition_teams
    ADD CONSTRAINT competition_teams_competition_id_club_id_key UNIQUE (competition_id, club_id);


--
-- Name: competition_teams competition_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competition_teams
    ADD CONSTRAINT competition_teams_pkey PRIMARY KEY (id);


--
-- Name: competitions competitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitions
    ADD CONSTRAINT competitions_pkey PRIMARY KEY (id);


--
-- Name: match_events match_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_pkey PRIMARY KEY (id);


--
-- Name: match_lineups match_lineups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_lineups
    ADD CONSTRAINT match_lineups_pkey PRIMARY KEY (id);


--
-- Name: match_statistics match_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_statistics
    ADD CONSTRAINT match_statistics_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: player_history player_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_history
    ADD CONSTRAINT player_history_pkey PRIMARY KEY (id);


--
-- Name: player_statistics player_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_statistics
    ADD CONSTRAINT player_statistics_pkey PRIMARY KEY (id);


--
-- Name: player_statistics player_statistics_player_id_season_competition_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_statistics
    ADD CONSTRAINT player_statistics_player_id_season_competition_id_key UNIQUE (player_id, season, competition_id);


--
-- Name: player_transfers player_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_transfers
    ADD CONSTRAINT player_transfers_pkey PRIMARY KEY (id);


--
-- Name: players players_nik_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_nik_unique UNIQUE (nik);


--
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: role_requests role_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_requests
    ADD CONSTRAINT role_requests_pkey PRIMARY KEY (id);


--
-- Name: stadiums stadiums_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stadiums
    ADD CONSTRAINT stadiums_pkey PRIMARY KEY (id);


--
-- Name: standings standings_competition_id_club_id_group_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standings
    ADD CONSTRAINT standings_competition_id_club_id_group_name_key UNIQUE (competition_id, club_id, group_name);


--
-- Name: standings standings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standings
    ADD CONSTRAINT standings_pkey PRIMARY KEY (id);


--
-- Name: transfer_approvals transfer_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_approvals
    ADD CONSTRAINT transfer_approvals_pkey PRIMARY KEY (id);


--
-- Name: transfer_documents transfer_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_documents
    ADD CONSTRAINT transfer_documents_pkey PRIMARY KEY (id);


--
-- Name: transfer_windows transfer_windows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_windows
    ADD CONSTRAINT transfer_windows_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);


--
-- Name: idx_match_lineups_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_match_lineups_club_id ON public.match_lineups USING btree (club_id);


--
-- Name: idx_match_lineups_match_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_match_lineups_match_id ON public.match_lineups USING btree (match_id);


--
-- Name: idx_match_lineups_player_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_match_lineups_player_id ON public.match_lineups USING btree (player_id);


--
-- Name: idx_match_statistics_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_match_statistics_club_id ON public.match_statistics USING btree (club_id);


--
-- Name: idx_match_statistics_match_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_match_statistics_match_id ON public.match_statistics USING btree (match_id);


--
-- Name: idx_players_registered_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_players_registered_by ON public.players USING btree (registered_by);


--
-- Name: idx_players_registration_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_players_registration_status ON public.players USING btree (registration_status);


--
-- Name: club_documents update_club_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_club_documents_updated_at BEFORE UPDATE ON public.club_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: club_staff update_club_staff_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_club_staff_updated_at BEFORE UPDATE ON public.club_staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clubs update_clubs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: competition_teams update_competition_teams_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_competition_teams_updated_at BEFORE UPDATE ON public.competition_teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: competitions update_competitions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON public.competitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: match_lineups update_match_lineups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_match_lineups_updated_at BEFORE UPDATE ON public.match_lineups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: match_statistics update_match_statistics_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_match_statistics_updated_at BEFORE UPDATE ON public.match_statistics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: matches update_matches_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: player_history update_player_history_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_player_history_updated_at BEFORE UPDATE ON public.player_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: player_statistics update_player_statistics_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_player_statistics_updated_at BEFORE UPDATE ON public.player_statistics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: player_transfers update_player_transfers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_player_transfers_updated_at BEFORE UPDATE ON public.player_transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: players update_players_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: role_requests update_role_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_role_requests_updated_at BEFORE UPDATE ON public.role_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: stadiums update_stadiums_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_stadiums_updated_at BEFORE UPDATE ON public.stadiums FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: standings update_standings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON public.standings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transfer_approvals update_transfer_approvals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_transfer_approvals_updated_at BEFORE UPDATE ON public.transfer_approvals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transfer_documents update_transfer_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_transfer_documents_updated_at BEFORE UPDATE ON public.transfer_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transfer_windows update_transfer_windows_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_transfer_windows_updated_at BEFORE UPDATE ON public.transfer_windows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_roles update_user_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: club_documents club_documents_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_documents
    ADD CONSTRAINT club_documents_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: club_documents club_documents_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_documents
    ADD CONSTRAINT club_documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id);


--
-- Name: club_staff club_staff_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_staff
    ADD CONSTRAINT club_staff_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: competition_teams competition_teams_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competition_teams
    ADD CONSTRAINT competition_teams_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: competition_teams competition_teams_competition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competition_teams
    ADD CONSTRAINT competition_teams_competition_id_fkey FOREIGN KEY (competition_id) REFERENCES public.competitions(id) ON DELETE CASCADE;


--
-- Name: match_events match_events_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id);


--
-- Name: match_events match_events_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: match_events match_events_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: match_events match_events_player_out_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_player_out_id_fkey FOREIGN KEY (player_out_id) REFERENCES public.players(id);


--
-- Name: match_lineups match_lineups_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_lineups
    ADD CONSTRAINT match_lineups_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: match_lineups match_lineups_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_lineups
    ADD CONSTRAINT match_lineups_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: match_lineups match_lineups_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_lineups
    ADD CONSTRAINT match_lineups_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;


--
-- Name: match_statistics match_statistics_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_statistics
    ADD CONSTRAINT match_statistics_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: match_statistics match_statistics_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_statistics
    ADD CONSTRAINT match_statistics_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: matches matches_away_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_away_club_id_fkey FOREIGN KEY (away_club_id) REFERENCES public.clubs(id);


--
-- Name: matches matches_competition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_competition_id_fkey FOREIGN KEY (competition_id) REFERENCES public.competitions(id) ON DELETE CASCADE;


--
-- Name: matches matches_home_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_home_club_id_fkey FOREIGN KEY (home_club_id) REFERENCES public.clubs(id);


--
-- Name: player_history player_history_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_history
    ADD CONSTRAINT player_history_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: player_history player_history_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_history
    ADD CONSTRAINT player_history_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;


--
-- Name: player_statistics player_statistics_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_statistics
    ADD CONSTRAINT player_statistics_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;


--
-- Name: player_transfers player_transfers_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_transfers
    ADD CONSTRAINT player_transfers_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: player_transfers player_transfers_from_club_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_transfers
    ADD CONSTRAINT player_transfers_from_club_approved_by_fkey FOREIGN KEY (from_club_approved_by) REFERENCES auth.users(id);


--
-- Name: player_transfers player_transfers_from_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_transfers
    ADD CONSTRAINT player_transfers_from_club_id_fkey FOREIGN KEY (from_club_id) REFERENCES public.clubs(id);


--
-- Name: player_transfers player_transfers_itc_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_transfers
    ADD CONSTRAINT player_transfers_itc_approved_by_fkey FOREIGN KEY (itc_approved_by) REFERENCES auth.users(id);


--
-- Name: player_transfers player_transfers_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_transfers
    ADD CONSTRAINT player_transfers_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;


--
-- Name: player_transfers player_transfers_to_club_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_transfers
    ADD CONSTRAINT player_transfers_to_club_approved_by_fkey FOREIGN KEY (to_club_approved_by) REFERENCES auth.users(id);


--
-- Name: player_transfers player_transfers_to_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_transfers
    ADD CONSTRAINT player_transfers_to_club_id_fkey FOREIGN KEY (to_club_id) REFERENCES public.clubs(id);


--
-- Name: player_transfers player_transfers_transfer_window_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_transfers
    ADD CONSTRAINT player_transfers_transfer_window_id_fkey FOREIGN KEY (transfer_window_id) REFERENCES public.transfer_windows(id);


--
-- Name: players players_current_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_current_club_id_fkey FOREIGN KEY (current_club_id) REFERENCES public.clubs(id);


--
-- Name: players players_registered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_registered_by_fkey FOREIGN KEY (registered_by) REFERENCES auth.users(id);


--
-- Name: players players_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: role_requests role_requests_requested_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_requests
    ADD CONSTRAINT role_requests_requested_club_id_fkey FOREIGN KEY (requested_club_id) REFERENCES public.clubs(id);


--
-- Name: role_requests role_requests_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_requests
    ADD CONSTRAINT role_requests_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users(id);


--
-- Name: role_requests role_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_requests
    ADD CONSTRAINT role_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: standings standings_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standings
    ADD CONSTRAINT standings_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: standings standings_competition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standings
    ADD CONSTRAINT standings_competition_id_fkey FOREIGN KEY (competition_id) REFERENCES public.competitions(id) ON DELETE CASCADE;


--
-- Name: transfer_approvals transfer_approvals_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_approvals
    ADD CONSTRAINT transfer_approvals_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES auth.users(id);


--
-- Name: transfer_approvals transfer_approvals_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_approvals
    ADD CONSTRAINT transfer_approvals_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.player_transfers(id) ON DELETE CASCADE;


--
-- Name: transfer_documents transfer_documents_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_documents
    ADD CONSTRAINT transfer_documents_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.player_transfers(id) ON DELETE CASCADE;


--
-- Name: transfer_documents transfer_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_documents
    ADD CONSTRAINT transfer_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);


--
-- Name: transfer_documents transfer_documents_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_documents
    ADD CONSTRAINT transfer_documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles Admin federasi can insert profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: transfer_documents Admin federasi can manage all transfer documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage all transfer documents" ON public.transfer_documents USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: player_transfers Admin federasi can manage all transfers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage all transfers" ON public.player_transfers USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: transfer_approvals Admin federasi can manage approvals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage approvals" ON public.transfer_approvals USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: club_staff Admin federasi can manage club staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage club staff" ON public.club_staff TO authenticated USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: clubs Admin federasi can manage clubs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage clubs" ON public.clubs TO authenticated USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: competition_teams Admin federasi can manage competition teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage competition teams" ON public.competition_teams TO authenticated USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: competitions Admin federasi can manage competitions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage competitions" ON public.competitions TO authenticated USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: club_documents Admin federasi can manage documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage documents" ON public.club_documents TO authenticated USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: match_events Admin federasi can manage match events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage match events" ON public.match_events TO authenticated USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: match_lineups Admin federasi can manage match lineups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage match lineups" ON public.match_lineups USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: match_statistics Admin federasi can manage match statistics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage match statistics" ON public.match_statistics USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: matches Admin federasi can manage matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage matches" ON public.matches TO authenticated USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: player_history Admin federasi can manage player history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage player history" ON public.player_history TO authenticated USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: players Admin federasi can manage players; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage players" ON public.players TO authenticated USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: user_roles Admin federasi can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: stadiums Admin federasi can manage stadiums; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage stadiums" ON public.stadiums USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: standings Admin federasi can manage standings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage standings" ON public.standings TO authenticated USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: player_statistics Admin federasi can manage statistics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage statistics" ON public.player_statistics TO authenticated USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: transfer_windows Admin federasi can manage transfer windows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can manage transfer windows" ON public.transfer_windows USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: profiles Admin federasi can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: role_requests Admin federasi can update all requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can update all requests" ON public.role_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: players Admin federasi can update players and registration status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can update players and registration status" ON public.players FOR UPDATE USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: profiles Admin federasi can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: role_requests Admin federasi can view all requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can view all requests" ON public.role_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: user_roles Admin federasi can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin federasi can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin_federasi'::public.app_role));


--
-- Name: club_documents Anyone can view club documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view club documents" ON public.club_documents FOR SELECT TO authenticated USING (true);


--
-- Name: club_staff Anyone can view club staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view club staff" ON public.club_staff FOR SELECT TO authenticated USING (true);


--
-- Name: clubs Anyone can view clubs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT TO authenticated USING (true);


--
-- Name: competition_teams Anyone can view competition teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view competition teams" ON public.competition_teams FOR SELECT TO authenticated USING (true);


--
-- Name: competitions Anyone can view competitions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view competitions" ON public.competitions FOR SELECT TO authenticated USING (true);


--
-- Name: match_events Anyone can view match events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view match events" ON public.match_events FOR SELECT TO authenticated USING (true);


--
-- Name: match_lineups Anyone can view match lineups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view match lineups" ON public.match_lineups FOR SELECT USING (true);


--
-- Name: match_statistics Anyone can view match statistics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view match statistics" ON public.match_statistics FOR SELECT USING (true);


--
-- Name: matches Anyone can view matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT TO authenticated USING (true);


--
-- Name: player_history Anyone can view player history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view player history" ON public.player_history FOR SELECT TO authenticated USING (true);


--
-- Name: player_statistics Anyone can view player statistics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view player statistics" ON public.player_statistics FOR SELECT TO authenticated USING (true);


--
-- Name: players Anyone can view players; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view players" ON public.players FOR SELECT TO authenticated USING (true);


--
-- Name: stadiums Anyone can view stadiums; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view stadiums" ON public.stadiums FOR SELECT USING (true);


--
-- Name: standings Anyone can view standings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view standings" ON public.standings FOR SELECT TO authenticated USING (true);


--
-- Name: transfer_approvals Anyone can view transfer approvals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view transfer approvals" ON public.transfer_approvals FOR SELECT USING (true);


--
-- Name: transfer_windows Anyone can view transfer windows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view transfer windows" ON public.transfer_windows FOR SELECT USING (true);


--
-- Name: player_transfers Anyone can view transfers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view transfers" ON public.player_transfers FOR SELECT USING (true);


--
-- Name: player_transfers Club admin can create transfers for their players; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club admin can create transfers for their players" ON public.player_transfers FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin_klub'::public.app_role) AND (user_roles.club_id = player_transfers.from_club_id)))));


--
-- Name: club_documents Club admin can manage their documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club admin can manage their documents" ON public.club_documents TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin_klub'::public.app_role) AND (user_roles.club_id = club_documents.club_id)))));


--
-- Name: club_staff Club admin can manage their staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club admin can manage their staff" ON public.club_staff TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin_klub'::public.app_role) AND (user_roles.club_id = club_staff.club_id)))));


--
-- Name: players Club admin can register players; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club admin can register players" ON public.players FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin_klub'::public.app_role) AND (user_roles.club_id = players.current_club_id)))));


--
-- Name: clubs Club admin can update their club; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club admin can update their club" ON public.clubs FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin_klub'::public.app_role) AND (user_roles.club_id = clubs.id)))));


--
-- Name: players Club admin can update their pending/rejected registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club admin can update their pending/rejected registrations" ON public.players FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin_klub'::public.app_role) AND (players.registered_by = auth.uid()) AND (players.registration_status = ANY (ARRAY['pending'::text, 'rejected'::text]))))));


--
-- Name: stadiums Club admin can update their stadium; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club admin can update their stadium" ON public.stadiums FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin_klub'::public.app_role) AND (user_roles.club_id = stadiums.owner_club_id)))));


--
-- Name: player_transfers Club admin can update their transfers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club admin can update their transfers" ON public.player_transfers FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin_klub'::public.app_role) AND ((user_roles.club_id = player_transfers.from_club_id) OR (user_roles.club_id = player_transfers.to_club_id))))));


--
-- Name: transfer_documents Club admin can upload documents for their transfers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club admin can upload documents for their transfers" ON public.transfer_documents FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.player_transfers pt
     JOIN public.user_roles ur ON ((ur.user_id = auth.uid())))
  WHERE ((pt.id = transfer_documents.transfer_id) AND (ur.role = 'admin_klub'::public.app_role) AND ((ur.club_id = pt.from_club_id) OR (ur.club_id = pt.to_club_id))))));


--
-- Name: transfer_documents Club admin can view documents for their transfers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club admin can view documents for their transfers" ON public.transfer_documents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.player_transfers pt
     JOIN public.user_roles ur ON ((ur.user_id = auth.uid())))
  WHERE ((pt.id = transfer_documents.transfer_id) AND (ur.role = 'admin_klub'::public.app_role) AND ((ur.club_id = pt.from_club_id) OR (ur.club_id = pt.to_club_id))))));


--
-- Name: players Club admin can view their club's approved players or their regi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club admin can view their club's approved players or their regi" ON public.players FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin_klub'::public.app_role) AND (((user_roles.club_id = players.current_club_id) AND (players.registration_status = 'approved'::text)) OR (players.registered_by = auth.uid()))))));


--
-- Name: competition_teams Panitia can manage competition teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Panitia can manage competition teams" ON public.competition_teams TO authenticated USING (public.has_role(auth.uid(), 'panitia'::public.app_role));


--
-- Name: competitions Panitia can manage competitions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Panitia can manage competitions" ON public.competitions TO authenticated USING (public.has_role(auth.uid(), 'panitia'::public.app_role));


--
-- Name: match_events Panitia can manage match events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Panitia can manage match events" ON public.match_events TO authenticated USING (public.has_role(auth.uid(), 'panitia'::public.app_role));


--
-- Name: match_lineups Panitia can manage match lineups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Panitia can manage match lineups" ON public.match_lineups USING (public.has_role(auth.uid(), 'panitia'::public.app_role));


--
-- Name: match_statistics Panitia can manage match statistics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Panitia can manage match statistics" ON public.match_statistics USING (public.has_role(auth.uid(), 'panitia'::public.app_role));


--
-- Name: matches Panitia can manage matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Panitia can manage matches" ON public.matches TO authenticated USING (public.has_role(auth.uid(), 'panitia'::public.app_role));


--
-- Name: standings Panitia can manage standings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Panitia can manage standings" ON public.standings TO authenticated USING (public.has_role(auth.uid(), 'panitia'::public.app_role));


--
-- Name: role_requests Users can create their own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own requests" ON public.role_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: role_requests Users can update their rejected requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their rejected requests" ON public.role_requests FOR UPDATE TO authenticated USING (((auth.uid() = user_id) AND (status = 'rejected'::text))) WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: role_requests Users can view their own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own requests" ON public.role_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: club_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.club_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: club_staff; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.club_staff ENABLE ROW LEVEL SECURITY;

--
-- Name: clubs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

--
-- Name: competition_teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.competition_teams ENABLE ROW LEVEL SECURITY;

--
-- Name: competitions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

--
-- Name: match_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

--
-- Name: match_lineups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.match_lineups ENABLE ROW LEVEL SECURITY;

--
-- Name: match_statistics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.match_statistics ENABLE ROW LEVEL SECURITY;

--
-- Name: matches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

--
-- Name: player_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.player_history ENABLE ROW LEVEL SECURITY;

--
-- Name: player_statistics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.player_statistics ENABLE ROW LEVEL SECURITY;

--
-- Name: player_transfers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.player_transfers ENABLE ROW LEVEL SECURITY;

--
-- Name: players; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: role_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: stadiums; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stadiums ENABLE ROW LEVEL SECURITY;

--
-- Name: standings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;

--
-- Name: transfer_approvals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transfer_approvals ENABLE ROW LEVEL SECURITY;

--
-- Name: transfer_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transfer_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: transfer_windows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transfer_windows ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


