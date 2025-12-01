export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      club_documents: {
        Row: {
          club_id: string
          created_at: string
          document_type: string
          document_url: string
          id: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          club_id: string
          created_at?: string
          document_type: string
          document_url: string
          id?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_documents_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_staff: {
        Row: {
          club_id: string
          created_at: string
          email: string | null
          id: string
          joined_date: string | null
          name: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          email?: string | null
          id?: string
          joined_date?: string | null
          name: string
          phone?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          email?: string | null
          id?: string
          joined_date?: string | null
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_staff_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          address: string | null
          away_color: string | null
          city: string | null
          created_at: string
          description: string | null
          email: string | null
          founded_year: number | null
          home_color: string | null
          id: string
          license_status: string | null
          license_valid_until: string | null
          logo_url: string | null
          name: string
          phone: string | null
          short_name: string | null
          social_media: string | null
          stadium_name: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          away_color?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          founded_year?: number | null
          home_color?: string | null
          id?: string
          license_status?: string | null
          license_valid_until?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          short_name?: string | null
          social_media?: string | null
          stadium_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          away_color?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          founded_year?: number | null
          home_color?: string | null
          id?: string
          license_status?: string | null
          license_valid_until?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          short_name?: string | null
          social_media?: string | null
          stadium_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      competition_documents: {
        Row: {
          competition_id: string
          created_at: string | null
          document_type: string
          document_url: string
          id: string
          notes: string | null
          rejection_reason: string | null
          updated_at: string | null
          uploaded_by: string | null
          valid_from: string | null
          valid_until: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          document_type: string
          document_url: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          document_type?: string
          document_url?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_documents_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_player_registrations: {
        Row: {
          club_id: string
          competition_id: string
          created_at: string | null
          id: string
          player_id: string
          registered_at: string | null
          registered_by: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shirt_number: number
          status: string
          updated_at: string | null
        }
        Insert: {
          club_id: string
          competition_id: string
          created_at?: string | null
          id?: string
          player_id: string
          registered_at?: string | null
          registered_by?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shirt_number: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          club_id?: string
          competition_id?: string
          created_at?: string | null
          id?: string
          player_id?: string
          registered_at?: string | null
          registered_by?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shirt_number?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_player_registrations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_player_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_player_registrations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_player_registrations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players_public"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_teams: {
        Row: {
          club_id: string
          competition_id: string
          created_at: string
          group_name: string | null
          id: string
          seed: number | null
          updated_at: string
        }
        Insert: {
          club_id: string
          competition_id: string
          created_at?: string
          group_name?: string | null
          id?: string
          seed?: number | null
          updated_at?: string
        }
        Update: {
          club_id?: string
          competition_id?: string
          created_at?: string
          group_name?: string | null
          id?: string
          seed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_teams_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_teams_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          format: Database["public"]["Enums"]["competition_format"]
          id: string
          logo_url: string | null
          name: string
          num_groups: number | null
          num_teams: number | null
          rejection_reason: string | null
          season: string
          start_date: string
          status: string | null
          type: Database["public"]["Enums"]["competition_type"]
          updated_at: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          format: Database["public"]["Enums"]["competition_format"]
          id?: string
          logo_url?: string | null
          name: string
          num_groups?: number | null
          num_teams?: number | null
          rejection_reason?: string | null
          season: string
          start_date: string
          status?: string | null
          type: Database["public"]["Enums"]["competition_type"]
          updated_at?: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          format?: Database["public"]["Enums"]["competition_format"]
          id?: string
          logo_url?: string | null
          name?: string
          num_groups?: number | null
          num_teams?: number | null
          rejection_reason?: string | null
          season?: string
          start_date?: string
          status?: string | null
          type?: Database["public"]["Enums"]["competition_type"]
          updated_at?: string
        }
        Relationships: []
      }
      match_events: {
        Row: {
          card_type: Database["public"]["Enums"]["card_type"] | null
          club_id: string
          created_at: string
          description: string | null
          event_type: string
          goal_type: string | null
          id: string
          match_id: string
          minute: number
          player_id: string | null
          player_out_id: string | null
          red_card_reason: string | null
          var_decision_type: string | null
        }
        Insert: {
          card_type?: Database["public"]["Enums"]["card_type"] | null
          club_id: string
          created_at?: string
          description?: string | null
          event_type: string
          goal_type?: string | null
          id?: string
          match_id: string
          minute: number
          player_id?: string | null
          player_out_id?: string | null
          red_card_reason?: string | null
          var_decision_type?: string | null
        }
        Update: {
          card_type?: Database["public"]["Enums"]["card_type"] | null
          club_id?: string
          created_at?: string
          description?: string | null
          event_type?: string
          goal_type?: string | null
          id?: string
          match_id?: string
          minute?: number
          player_id?: string | null
          player_out_id?: string | null
          red_card_reason?: string | null
          var_decision_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_out_id_fkey"
            columns: ["player_out_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_out_id_fkey"
            columns: ["player_out_id"]
            isOneToOne: false
            referencedRelation: "players_public"
            referencedColumns: ["id"]
          },
        ]
      }
      match_lineups: {
        Row: {
          club_id: string
          created_at: string
          formation_position: number | null
          id: string
          match_id: string
          minutes_played: number | null
          player_id: string
          position: string
          position_type: string
          rating: number | null
          shirt_number: number
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          formation_position?: number | null
          id?: string
          match_id: string
          minutes_played?: number | null
          player_id: string
          position: string
          position_type: string
          rating?: number | null
          shirt_number: number
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          formation_position?: number | null
          id?: string
          match_id?: string
          minutes_played?: number | null
          player_id?: string
          position?: string
          position_type?: string
          rating?: number | null
          shirt_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_lineups_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineups_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineups_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineups_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players_public"
            referencedColumns: ["id"]
          },
        ]
      }
      match_officials: {
        Row: {
          confirmed: boolean | null
          created_at: string | null
          id: string
          match_id: string
          notes: string | null
          referee_id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          confirmed?: boolean | null
          created_at?: string | null
          id?: string
          match_id: string
          notes?: string | null
          referee_id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          confirmed?: boolean | null
          created_at?: string | null
          id?: string
          match_id?: string
          notes?: string | null
          referee_id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_officials_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_officials_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "referees"
            referencedColumns: ["id"]
          },
        ]
      }
      match_reports: {
        Row: {
          attendance_estimate: number | null
          created_at: string | null
          discipline_summary: string | null
          id: string
          incidents: Json | null
          match_id: string
          pitch_quality: string | null
          referee_id: string
          report_content: string | null
          submitted_at: string | null
          updated_at: string | null
          weather_notes: string | null
        }
        Insert: {
          attendance_estimate?: number | null
          created_at?: string | null
          discipline_summary?: string | null
          id?: string
          incidents?: Json | null
          match_id: string
          pitch_quality?: string | null
          referee_id: string
          report_content?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          weather_notes?: string | null
        }
        Update: {
          attendance_estimate?: number | null
          created_at?: string | null
          discipline_summary?: string | null
          id?: string
          incidents?: Json | null
          match_id?: string
          pitch_quality?: string | null
          referee_id?: string
          report_content?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          weather_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_reports_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_reports_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "referees"
            referencedColumns: ["id"]
          },
        ]
      }
      match_statistics: {
        Row: {
          clearances: number | null
          club_id: string
          corners: number | null
          created_at: string
          crosses: number | null
          duels_won: number | null
          fouls: number | null
          id: string
          interceptions: number | null
          match_id: string
          offsides: number | null
          pass_accuracy: number | null
          passes: number | null
          possession: number | null
          saves: number | null
          shots: number | null
          shots_on_target: number | null
          tackles: number | null
          updated_at: string
        }
        Insert: {
          clearances?: number | null
          club_id: string
          corners?: number | null
          created_at?: string
          crosses?: number | null
          duels_won?: number | null
          fouls?: number | null
          id?: string
          interceptions?: number | null
          match_id: string
          offsides?: number | null
          pass_accuracy?: number | null
          passes?: number | null
          possession?: number | null
          saves?: number | null
          shots?: number | null
          shots_on_target?: number | null
          tackles?: number | null
          updated_at?: string
        }
        Update: {
          clearances?: number | null
          club_id?: string
          corners?: number | null
          created_at?: string
          crosses?: number | null
          duels_won?: number | null
          fouls?: number | null
          id?: string
          interceptions?: number | null
          match_id?: string
          offsides?: number | null
          pass_accuracy?: number | null
          passes?: number | null
          possession?: number | null
          saves?: number | null
          shots?: number | null
          shots_on_target?: number | null
          tackles?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_statistics_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_statistics_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          assistant_referee_1: string | null
          assistant_referee_2: string | null
          attendance: number | null
          away_club_id: string
          away_score: number | null
          competition_id: string
          created_at: string
          fourth_official: string | null
          group_name: string | null
          half_time_away_score: number | null
          half_time_home_score: number | null
          home_club_id: string
          home_score: number | null
          id: string
          match_date: string
          match_notes: string | null
          matchday: number | null
          pitch_condition: string | null
          referee_name: string | null
          round: string | null
          status: Database["public"]["Enums"]["match_status"] | null
          updated_at: string
          var_official: string | null
          venue: string | null
          weather_condition: string | null
        }
        Insert: {
          assistant_referee_1?: string | null
          assistant_referee_2?: string | null
          attendance?: number | null
          away_club_id: string
          away_score?: number | null
          competition_id: string
          created_at?: string
          fourth_official?: string | null
          group_name?: string | null
          half_time_away_score?: number | null
          half_time_home_score?: number | null
          home_club_id: string
          home_score?: number | null
          id?: string
          match_date: string
          match_notes?: string | null
          matchday?: number | null
          pitch_condition?: string | null
          referee_name?: string | null
          round?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
          updated_at?: string
          var_official?: string | null
          venue?: string | null
          weather_condition?: string | null
        }
        Update: {
          assistant_referee_1?: string | null
          assistant_referee_2?: string | null
          attendance?: number | null
          away_club_id?: string
          away_score?: number | null
          competition_id?: string
          created_at?: string
          fourth_official?: string | null
          group_name?: string | null
          half_time_away_score?: number | null
          half_time_home_score?: number | null
          home_club_id?: string
          home_score?: number | null
          id?: string
          match_date?: string
          match_notes?: string | null
          matchday?: number | null
          pitch_condition?: string | null
          referee_name?: string | null
          round?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
          updated_at?: string
          var_official?: string | null
          venue?: string | null
          weather_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_club_id_fkey"
            columns: ["away_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_club_id_fkey"
            columns: ["home_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      player_documents: {
        Row: {
          created_at: string
          document_type: string
          document_url: string
          id: string
          player_id: string
          rejection_reason: string | null
          updated_at: string
          uploaded_by: string | null
          valid_from: string | null
          valid_until: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          document_url: string
          id?: string
          player_id: string
          rejection_reason?: string | null
          updated_at?: string
          uploaded_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          player_id?: string
          rejection_reason?: string | null
          updated_at?: string
          uploaded_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_documents_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_documents_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players_public"
            referencedColumns: ["id"]
          },
        ]
      }
      player_history: {
        Row: {
          club_id: string
          created_at: string
          from_date: string
          id: string
          player_id: string
          to_date: string | null
          transfer_fee: number | null
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          from_date: string
          id?: string
          player_id: string
          to_date?: string | null
          transfer_fee?: number | null
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          from_date?: string
          id?: string
          player_id?: string
          to_date?: string | null
          transfer_fee?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_history_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players_public"
            referencedColumns: ["id"]
          },
        ]
      }
      player_statistics: {
        Row: {
          assists: number | null
          competition_id: string | null
          created_at: string
          goals: number | null
          id: string
          matches_played: number | null
          minutes_played: number | null
          player_id: string
          red_cards: number | null
          season: string
          updated_at: string
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          competition_id?: string | null
          created_at?: string
          goals?: number | null
          id?: string
          matches_played?: number | null
          minutes_played?: number | null
          player_id: string
          red_cards?: number | null
          season: string
          updated_at?: string
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          competition_id?: string | null
          created_at?: string
          goals?: number | null
          id?: string
          matches_played?: number | null
          minutes_played?: number | null
          player_id?: string
          red_cards?: number | null
          season?: string
          updated_at?: string
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_statistics_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_statistics_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players_public"
            referencedColumns: ["id"]
          },
        ]
      }
      player_transfers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contract_end: string
          contract_start: string
          created_at: string
          from_club_approved_at: string | null
          from_club_approved_by: string | null
          from_club_id: string | null
          id: string
          itc_approved_by: string | null
          itc_approved_date: string | null
          itc_request_date: string | null
          itc_status: string | null
          loan_end_date: string | null
          notes: string | null
          player_id: string
          rejected_reason: string | null
          requires_itc: boolean | null
          status: string
          to_club_approved_at: string | null
          to_club_approved_by: string | null
          to_club_id: string
          transfer_fee: number | null
          transfer_type: string
          transfer_window_id: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contract_end: string
          contract_start: string
          created_at?: string
          from_club_approved_at?: string | null
          from_club_approved_by?: string | null
          from_club_id?: string | null
          id?: string
          itc_approved_by?: string | null
          itc_approved_date?: string | null
          itc_request_date?: string | null
          itc_status?: string | null
          loan_end_date?: string | null
          notes?: string | null
          player_id: string
          rejected_reason?: string | null
          requires_itc?: boolean | null
          status?: string
          to_club_approved_at?: string | null
          to_club_approved_by?: string | null
          to_club_id: string
          transfer_fee?: number | null
          transfer_type: string
          transfer_window_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contract_end?: string
          contract_start?: string
          created_at?: string
          from_club_approved_at?: string | null
          from_club_approved_by?: string | null
          from_club_id?: string | null
          id?: string
          itc_approved_by?: string | null
          itc_approved_date?: string | null
          itc_request_date?: string | null
          itc_status?: string | null
          loan_end_date?: string | null
          notes?: string | null
          player_id?: string
          rejected_reason?: string | null
          requires_itc?: boolean | null
          status?: string
          to_club_approved_at?: string | null
          to_club_approved_by?: string | null
          to_club_id?: string
          transfer_fee?: number | null
          transfer_type?: string
          transfer_window_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_transfers_from_club_id_fkey"
            columns: ["from_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_transfers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_transfers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_transfers_to_club_id_fkey"
            columns: ["to_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_transfers_transfer_window_id_fkey"
            columns: ["transfer_window_id"]
            isOneToOne: false
            referencedRelation: "transfer_windows"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          contract_end: string | null
          contract_start: string | null
          created_at: string
          current_club_id: string | null
          date_of_birth: string
          full_name: string
          height_cm: number | null
          id: string
          injury_status: Database["public"]["Enums"]["player_status"] | null
          market_value: number | null
          nationality: string
          nik: string | null
          nik_city: string | null
          nik_district: string | null
          nik_province: string | null
          photo_url: string | null
          place_of_birth: string | null
          position: Database["public"]["Enums"]["player_position"]
          preferred_foot: string | null
          registered_by: string | null
          registration_status: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shirt_number: number | null
          transfer_status: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          current_club_id?: string | null
          date_of_birth: string
          full_name: string
          height_cm?: number | null
          id?: string
          injury_status?: Database["public"]["Enums"]["player_status"] | null
          market_value?: number | null
          nationality: string
          nik?: string | null
          nik_city?: string | null
          nik_district?: string | null
          nik_province?: string | null
          photo_url?: string | null
          place_of_birth?: string | null
          position: Database["public"]["Enums"]["player_position"]
          preferred_foot?: string | null
          registered_by?: string | null
          registration_status?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shirt_number?: number | null
          transfer_status?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          current_club_id?: string | null
          date_of_birth?: string
          full_name?: string
          height_cm?: number | null
          id?: string
          injury_status?: Database["public"]["Enums"]["player_status"] | null
          market_value?: number | null
          nationality?: string
          nik?: string | null
          nik_city?: string | null
          nik_district?: string | null
          nik_province?: string | null
          photo_url?: string | null
          place_of_birth?: string | null
          position?: Database["public"]["Enums"]["player_position"]
          preferred_foot?: string | null
          registered_by?: string | null
          registration_status?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shirt_number?: number | null
          transfer_status?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_current_club_id_fkey"
            columns: ["current_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referees: {
        Row: {
          created_at: string | null
          email: string | null
          experience_years: number | null
          full_name: string
          id: string
          license_number: string | null
          license_type: string
          license_valid_until: string | null
          phone: string | null
          photo_url: string | null
          specialization: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          experience_years?: number | null
          full_name: string
          id?: string
          license_number?: string | null
          license_type?: string
          license_valid_until?: string | null
          phone?: string | null
          photo_url?: string | null
          specialization?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          experience_years?: number | null
          full_name?: string
          id?: string
          license_number?: string | null
          license_type?: string
          license_valid_until?: string | null
          phone?: string | null
          photo_url?: string | null
          specialization?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      role_requests: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          requested_club_id: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          requested_club_id?: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          requested_club_id?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_requests_requested_club_id_fkey"
            columns: ["requested_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      stadiums: {
        Row: {
          address: string | null
          afc_license_status: string | null
          afc_license_valid_from: string | null
          afc_license_valid_until: string | null
          capacity: number
          city: string
          created_at: string
          dressing_rooms: number | null
          field_length: number | null
          field_width: number | null
          has_doping_control_room: boolean | null
          has_medical_room: boolean | null
          has_undersoil_heating: boolean | null
          has_video_screen: boolean | null
          id: string
          latitude: number | null
          lighting_lux: number | null
          longitude: number | null
          media_seats: number | null
          name: string
          notes: string | null
          owner_club_id: string | null
          parking_capacity: number | null
          photo_url: string | null
          safety_certificate_valid_until: string | null
          updated_at: string
          vip_seats: number | null
        }
        Insert: {
          address?: string | null
          afc_license_status?: string | null
          afc_license_valid_from?: string | null
          afc_license_valid_until?: string | null
          capacity: number
          city: string
          created_at?: string
          dressing_rooms?: number | null
          field_length?: number | null
          field_width?: number | null
          has_doping_control_room?: boolean | null
          has_medical_room?: boolean | null
          has_undersoil_heating?: boolean | null
          has_video_screen?: boolean | null
          id?: string
          latitude?: number | null
          lighting_lux?: number | null
          longitude?: number | null
          media_seats?: number | null
          name: string
          notes?: string | null
          owner_club_id?: string | null
          parking_capacity?: number | null
          photo_url?: string | null
          safety_certificate_valid_until?: string | null
          updated_at?: string
          vip_seats?: number | null
        }
        Update: {
          address?: string | null
          afc_license_status?: string | null
          afc_license_valid_from?: string | null
          afc_license_valid_until?: string | null
          capacity?: number
          city?: string
          created_at?: string
          dressing_rooms?: number | null
          field_length?: number | null
          field_width?: number | null
          has_doping_control_room?: boolean | null
          has_medical_room?: boolean | null
          has_undersoil_heating?: boolean | null
          has_video_screen?: boolean | null
          id?: string
          latitude?: number | null
          lighting_lux?: number | null
          longitude?: number | null
          media_seats?: number | null
          name?: string
          notes?: string | null
          owner_club_id?: string | null
          parking_capacity?: number | null
          photo_url?: string | null
          safety_certificate_valid_until?: string | null
          updated_at?: string
          vip_seats?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stadiums_owner_club_id_fkey"
            columns: ["owner_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      standings: {
        Row: {
          club_id: string
          competition_id: string
          created_at: string
          drawn: number | null
          goal_difference: number | null
          goals_against: number | null
          goals_for: number | null
          group_name: string | null
          id: string
          lost: number | null
          played: number | null
          points: number | null
          position: number | null
          updated_at: string
          won: number | null
        }
        Insert: {
          club_id: string
          competition_id: string
          created_at?: string
          drawn?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          group_name?: string | null
          id?: string
          lost?: number | null
          played?: number | null
          points?: number | null
          position?: number | null
          updated_at?: string
          won?: number | null
        }
        Update: {
          club_id?: string
          competition_id?: string
          created_at?: string
          drawn?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          group_name?: string | null
          id?: string
          lost?: number | null
          played?: number | null
          points?: number | null
          position?: number | null
          updated_at?: string
          won?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "standings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_approvals: {
        Row: {
          approved_at: string | null
          approver_id: string | null
          approver_role: string
          comments: string | null
          created_at: string
          id: string
          status: string
          transfer_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approver_id?: string | null
          approver_role: string
          comments?: string | null
          created_at?: string
          id?: string
          status: string
          transfer_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approver_id?: string | null
          approver_role?: string
          comments?: string | null
          created_at?: string
          id?: string
          status?: string
          transfer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_approvals_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "player_transfers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_approvals_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "player_transfers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_documents: {
        Row: {
          created_at: string | null
          document_type: string
          document_url: string
          id: string
          notes: string | null
          transfer_id: string
          updated_at: string | null
          uploaded_by: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          document_url: string
          id?: string
          notes?: string | null
          transfer_id: string
          updated_at?: string | null
          uploaded_by?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          document_url?: string
          id?: string
          notes?: string | null
          transfer_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfer_documents_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "player_transfers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_documents_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "player_transfers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_windows: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          start_date: string
          updated_at: string
          window_type: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          start_date: string
          updated_at?: string
          window_type: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string
          updated_at?: string
          window_type?: string
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          created_at: string | null
          document_type: string
          document_url: string
          id: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          document_url: string
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          document_url?: string
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          club_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      club_staff_public: {
        Row: {
          club_id: string | null
          created_at: string | null
          id: string | null
          joined_date: string | null
          name: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          id?: string | null
          joined_date?: string | null
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          id?: string | null
          joined_date?: string | null
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_staff_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      player_transfers_public: {
        Row: {
          approved_at: string | null
          contract_end: string | null
          contract_start: string | null
          created_at: string | null
          from_club_id: string | null
          id: string | null
          itc_approved_date: string | null
          itc_request_date: string | null
          itc_status: string | null
          loan_end_date: string | null
          player_id: string | null
          requires_itc: boolean | null
          status: string | null
          to_club_id: string | null
          transfer_type: string | null
          transfer_window_id: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          from_club_id?: string | null
          id?: string | null
          itc_approved_date?: string | null
          itc_request_date?: string | null
          itc_status?: string | null
          loan_end_date?: string | null
          player_id?: string | null
          requires_itc?: boolean | null
          status?: string | null
          to_club_id?: string | null
          transfer_type?: string | null
          transfer_window_id?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          from_club_id?: string | null
          id?: string | null
          itc_approved_date?: string | null
          itc_request_date?: string | null
          itc_status?: string | null
          loan_end_date?: string | null
          player_id?: string | null
          requires_itc?: boolean | null
          status?: string | null
          to_club_id?: string | null
          transfer_type?: string | null
          transfer_window_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_transfers_from_club_id_fkey"
            columns: ["from_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_transfers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_transfers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_transfers_to_club_id_fkey"
            columns: ["to_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_transfers_transfer_window_id_fkey"
            columns: ["transfer_window_id"]
            isOneToOne: false
            referencedRelation: "transfer_windows"
            referencedColumns: ["id"]
          },
        ]
      }
      players_public: {
        Row: {
          contract_end: string | null
          contract_start: string | null
          created_at: string | null
          current_club_id: string | null
          date_of_birth: string | null
          full_name: string | null
          height_cm: number | null
          id: string | null
          injury_status: Database["public"]["Enums"]["player_status"] | null
          market_value: number | null
          nationality: string | null
          photo_url: string | null
          place_of_birth: string | null
          position: Database["public"]["Enums"]["player_position"] | null
          preferred_foot: string | null
          registration_status: string | null
          shirt_number: number | null
          transfer_status: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          current_club_id?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          height_cm?: number | null
          id?: string | null
          injury_status?: Database["public"]["Enums"]["player_status"] | null
          market_value?: number | null
          nationality?: string | null
          photo_url?: string | null
          place_of_birth?: string | null
          position?: Database["public"]["Enums"]["player_position"] | null
          preferred_foot?: string | null
          registration_status?: string | null
          shirt_number?: number | null
          transfer_status?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          current_club_id?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          height_cm?: number | null
          id?: string | null
          injury_status?: Database["public"]["Enums"]["player_status"] | null
          market_value?: number | null
          nationality?: string | null
          photo_url?: string | null
          place_of_birth?: string | null
          position?: Database["public"]["Enums"]["player_position"] | null
          preferred_foot?: string | null
          registration_status?: string | null
          shirt_number?: number | null
          transfer_status?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_current_club_id_fkey"
            columns: ["current_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin_federasi" | "admin_klub" | "wasit" | "panitia"
      card_type: "yellow" | "red"
      competition_format: "round_robin" | "knockout" | "group_knockout"
      competition_type: "liga" | "piala" | "youth_league"
      match_status:
        | "scheduled"
        | "live"
        | "finished"
        | "postponed"
        | "cancelled"
      player_position: "GK" | "DF" | "MF" | "FW"
      player_status: "fit" | "cedera" | "pemulihan"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin_federasi", "admin_klub", "wasit", "panitia"],
      card_type: ["yellow", "red"],
      competition_format: ["round_robin", "knockout", "group_knockout"],
      competition_type: ["liga", "piala", "youth_league"],
      match_status: ["scheduled", "live", "finished", "postponed", "cancelled"],
      player_position: ["GK", "DF", "MF", "FW"],
      player_status: ["fit", "cedera", "pemulihan"],
    },
  },
} as const
