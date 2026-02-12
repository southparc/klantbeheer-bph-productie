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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      advisors: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          id: number
          name: string | null
          office_id: number | null
          phone: string | null
          photo_url: string | null
          updated_at: string
          VoAdvisor: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: number
          name?: string | null
          office_id?: number | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          VoAdvisor?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: number
          name?: string | null
          office_id?: number | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          VoAdvisor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisors_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          advisor_id: number | null
          client_id: string
          created_at: string
          display_name: string | null
          event_location: string | null
          id: number
          meeting_request: string | null
          message: string | null
          office_location: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          advisor_id?: number | null
          client_id: string
          created_at?: string
          display_name?: string | null
          event_location?: string | null
          id?: number
          meeting_request?: string | null
          message?: string | null
          office_location?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          advisor_id?: number | null
          client_id?: string
          created_at?: string
          display_name?: string | null
          event_location?: string | null
          id?: number
          meeting_request?: string | null
          message?: string | null
          office_location?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: unknown
          params_hash: string | null
          resource: string
          result_status: number
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: unknown
          params_hash?: string | null
          resource: string
          result_status: number
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          params_hash?: string | null
          resource?: string
          result_status?: number
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      dashboard_users: {
        Row: {
          id: string
          auth_id: string
          email: string
          name: string
          role: Database["public"]["Enums"]["dashboard_role"]
          office_id: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_id: string
          email: string
          name: string
          role?: Database["public"]["Enums"]["dashboard_role"]
          office_id?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_id?: string
          email?: string
          name?: string
          role?: Database["public"]["Enums"]["dashboard_role"]
          office_id?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_users_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          advisor_id: number | null
          age: number | null
          birth_date: string | null
          city: string | null
          company: string | null
          consumer_credit_amount: number | null
          country: string | null
          created_at: string
          email: string
          employment_type: string | null
          figlocfid: string | null
          figlolastsyncat: string | null
          figlorawsnapshot: Json | null
          figlotagname: string | null
          first_name: string | null
          gender: string | null
          gross_income: number | null
          id: string
          initials: string | null
          investment_balance: number | null
          last_name: string | null
          location: string | null
          mailerlite_id: string | null
          marketing_status: string | null
          monthly_fixed_costs: number | null
          monthly_variable_costs: number | null
          net_monthly_income: number | null
          net_monthly_spending: number | null
          pension_income: number | null
          phone: string | null
          planning_status: string | null
          prefix: string | null
          rank: number | null
          realEstateInvestments: number | null
          referer: string | null
          retirement_target_age: number | null
          risk_profile: string | null
          saving_balance: number | null
          subscription_status: string | null
          supabase_auth_id: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          advisor_id?: number | null
          age?: number | null
          birth_date?: string | null
          city?: string | null
          company?: string | null
          consumer_credit_amount?: number | null
          country?: string | null
          created_at?: string
          email: string
          employment_type?: string | null
          figlocfid?: string | null
          figlolastsyncat?: string | null
          figlorawsnapshot?: Json | null
          figlotagname?: string | null
          first_name?: string | null
          gender?: string | null
          gross_income?: number | null
          id?: string
          initials?: string | null
          investment_balance?: number | null
          last_name?: string | null
          location?: string | null
          mailerlite_id?: string | null
          marketing_status?: string | null
          monthly_fixed_costs?: number | null
          monthly_variable_costs?: number | null
          net_monthly_income?: number | null
          net_monthly_spending?: number | null
          pension_income?: number | null
          phone?: string | null
          planning_status?: string | null
          prefix?: string | null
          rank?: number | null
          realEstateInvestments?: number | null
          referer?: string | null
          retirement_target_age?: number | null
          risk_profile?: string | null
          saving_balance?: number | null
          subscription_status?: string | null
          supabase_auth_id?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          advisor_id?: number | null
          age?: number | null
          birth_date?: string | null
          city?: string | null
          company?: string | null
          consumer_credit_amount?: number | null
          country?: string | null
          created_at?: string
          email?: string
          employment_type?: string | null
          figlocfid?: string | null
          figlolastsyncat?: string | null
          figlorawsnapshot?: Json | null
          figlotagname?: string | null
          first_name?: string | null
          gender?: string | null
          gross_income?: number | null
          id?: string
          initials?: string | null
          investment_balance?: number | null
          last_name?: string | null
          location?: string | null
          mailerlite_id?: string | null
          marketing_status?: string | null
          monthly_fixed_costs?: number | null
          monthly_variable_costs?: number | null
          net_monthly_income?: number | null
          net_monthly_spending?: number | null
          pension_income?: number | null
          phone?: string | null
          planning_status?: string | null
          prefix?: string | null
          rank?: number | null
          realEstateInvestments?: number | null
          referer?: string | null
          retirement_target_age?: number | null
          risk_profile?: string | null
          saving_balance?: number | null
          subscription_status?: string | null
          supabase_auth_id?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisors"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string
          created_at: string
          display_name: string | null
          dvo: number | null
          id: number
          is_damage_client: boolean | null
          max_loan: number | null
          type: string | null
          updated_at: string
          value: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          display_name?: string | null
          dvo?: number | null
          id?: number
          is_damage_client?: boolean | null
          max_loan?: number | null
          type?: string | null
          updated_at?: string
          value?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          display_name?: string | null
          dvo?: number | null
          id?: number
          is_damage_client?: boolean | null
          max_loan?: number | null
          type?: string | null
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      estate_planning_documents: {
        Row: {
          client_id: string
          created_at: string
          document_type: string | null
          id: number
          location: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          document_type?: string | null
          id?: number
          location?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          document_type?: string | null
          id?: number
          location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estate_planning_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_goals: {
        Row: {
          amount: number | null
          client_id: string
          created_at: string
          description: string | null
          goal_priority: string | null
          id: number
          updated_at: string
        }
        Insert: {
          amount?: number | null
          client_id: string
          created_at?: string
          description?: string | null
          goal_priority?: string | null
          id?: number
          updated_at?: string
        }
        Update: {
          amount?: number | null
          client_id?: string
          created_at?: string
          description?: string | null
          goal_priority?: string | null
          id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_goals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          accumulation_return_rate: number
          annual_return_rate: number
          created_at: string
          current_amount: number
          id: string
          is_active: boolean
          life_expectancy_age: number
          monthly_contribution: number
          monthly_withdrawal: number | null
          name: string
          payout_start_age: number | null
          regime: string
          sort_order: number
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accumulation_return_rate?: number
          annual_return_rate?: number
          created_at?: string
          current_amount?: number
          id?: string
          is_active?: boolean
          life_expectancy_age?: number
          monthly_contribution?: number
          monthly_withdrawal?: number | null
          name: string
          payout_start_age?: number | null
          regime: string
          sort_order?: number
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accumulation_return_rate?: number
          annual_return_rate?: number
          created_at?: string
          current_amount?: number
          id?: string
          is_active?: boolean
          life_expectancy_age?: number
          monthly_contribution?: number
          monthly_withdrawal?: number | null
          name?: string
          payout_start_age?: number | null
          regime?: string
          sort_order?: number
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      house_objects: {
        Row: {
          annuity_amount: number | null
          annuity_target_amount: number | null
          client_id: string
          created_at: string
          current_rent: number | null
          display_name: string | null
          energy_label: string | null
          figlosourceid: string | null
          home_value: number | null
          id: number
          is_owner_occupied: boolean | null
          ltv: number | null
          mortgage_amount: number | null
          mortgage_interest_rate: number | null
          mortgage_remaining: number | null
          updated_at: string
        }
        Insert: {
          annuity_amount?: number | null
          annuity_target_amount?: number | null
          client_id: string
          created_at?: string
          current_rent?: number | null
          display_name?: string | null
          energy_label?: string | null
          figlosourceid?: string | null
          home_value?: number | null
          id?: number
          is_owner_occupied?: boolean | null
          ltv?: number | null
          mortgage_amount?: number | null
          mortgage_interest_rate?: number | null
          mortgage_remaining?: number | null
          updated_at?: string
        }
        Update: {
          annuity_amount?: number | null
          annuity_target_amount?: number | null
          client_id?: string
          created_at?: string
          current_rent?: number | null
          display_name?: string | null
          energy_label?: string | null
          figlosourceid?: string | null
          home_value?: number | null
          id?: number
          is_owner_occupied?: boolean | null
          ltv?: number | null
          mortgage_amount?: number | null
          mortgage_interest_rate?: number | null
          mortgage_remaining?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_objects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      insurances: {
        Row: {
          client_id: string
          created_at: string
          death_risk_assurance_amount: number | null
          disability_percentage: number | null
          display_name: string | null
          figlosourceid: string | null
          id: number
          type: string | null
          updated_at: string
          value: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          death_risk_assurance_amount?: number | null
          disability_percentage?: number | null
          display_name?: string | null
          figlosourceid?: string | null
          id?: number
          type?: string | null
          updated_at?: string
          value?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          death_risk_assurance_amount?: number | null
          disability_percentage?: number | null
          display_name?: string | null
          figlosourceid?: string | null
          id?: number
          type?: string | null
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "insurances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          client_id: string
          created_at: string
          current_value: number | null
          figlosourceid: string | null
          id: number
          name: string | null
          type: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          current_value?: number | null
          figlosourceid?: string | null
          id?: number
          name?: string | null
          type?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          current_value?: number | null
          figlosourceid?: string | null
          id?: number
          name?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      liabilities: {
        Row: {
          client_id: string
          created_at: string
          figlosourceid: string | null
          id: number
          name: string | null
          total_amount: number | null
          type: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          figlosourceid?: string | null
          id?: number
          name?: string | null
          total_amount?: number | null
          type?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          figlosourceid?: string | null
          id?: number
          name?: string | null
          total_amount?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "liabilities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          id: number
          name: string
          city: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          city?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          city?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_items: {
        Row: {
          auto_approved: boolean
          category: string
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          published_at: string | null
          source_url: string | null
          status: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          auto_approved?: boolean
          category?: string
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          source_url?: string | null
          status?: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          auto_approved?: boolean
          category?: string
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          source_url?: string | null
          status?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          advisor_id: number | null
          client_id: string
          created_at: string
          email: string | null
          figlosourceid: string | null
          first_name: string | null
          gender: string | null
          gross_income: number | null
          id: number
          initials: string | null
          last_name: string | null
          prefix: string | null
          updated_at: string
        }
        Insert: {
          advisor_id?: number | null
          client_id: string
          created_at?: string
          email?: string | null
          figlosourceid?: string | null
          first_name?: string | null
          gender?: string | null
          gross_income?: number | null
          id?: number
          initials?: string | null
          last_name?: string | null
          prefix?: string | null
          updated_at?: string
        }
        Update: {
          advisor_id?: number | null
          client_id?: string
          created_at?: string
          email?: string | null
          figlosourceid?: string | null
          first_name?: string | null
          gender?: string | null
          gross_income?: number | null
          id?: number
          initials?: string | null
          last_name?: string | null
          prefix?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pensions: {
        Row: {
          client_id: string
          created_at: string
          expected_annual_payout: number | null
          figlosourceid: string | null
          id: number
          provider: string | null
          type: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          expected_annual_payout?: number | null
          figlosourceid?: string | null
          id?: number
          provider?: string | null
          type?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          expected_annual_payout?: number | null
          figlosourceid?: string | null
          id?: number
          provider?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pensions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_parameters: {
        Row: {
          code: string
          country: string
          currency: string | null
          id: string
          name: string
          regime: string
          source_ref: string | null
          source_url: string | null
          status: string
          unit: string | null
          updated_at: string | null
          valid_from: string
          valid_to: string | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          code: string
          country?: string
          currency?: string | null
          id?: string
          name: string
          regime: string
          source_ref?: string | null
          source_url?: string | null
          status: string
          unit?: string | null
          updated_at?: string | null
          valid_from: string
          valid_to?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          code?: string
          country?: string
          currency?: string | null
          id?: string
          name?: string
          regime?: string
          source_ref?: string | null
          source_url?: string | null
          status?: string
          unit?: string | null
          updated_at?: string | null
          valid_from?: string
          valid_to?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_duplicate_advisors: {
        Args: never
        Returns: {
          count: number
          ids: string
          name: string
        }[]
      }
      cleanup_old_news: { Args: never; Returns: undefined }
      full_client: {
        Args: { email: string }
        Returns: {
          age: number
          annuity_amount: number
          annuity_target_amount: number
          consumer_credit_amount: number
          contract_display_name: string
          contract_id: number
          contract_type: string
          contract_value: number
          country: string
          current_rent: number
          death_risk_assurance_amount: number
          disability_percentage: number
          dvo: number
          email: string
          employment_type: string
          energy_label: string
          financial_goal_amount: number
          financial_goal_description: string
          financial_goal_id: number
          first_name: string
          goal_priority: string
          gross_income: number
          home_value: number
          house_id: number
          house_ltv: number
          id: string
          insurance_display_name: string
          insurance_id: number
          insurance_type: string
          insurance_value: number
          investment_balance: number
          investment_current_value: number
          investment_id: number
          investment_name: string
          investment_type: string
          is_damage_client: boolean
          is_owner_occupied: boolean
          last_name: string
          liability_id: number
          liability_name: string
          liability_total_amount: number
          liability_type: string
          max_loan: number
          monthly_fixed_costs: number
          monthly_variable_costs: number
          mortgage_interest_rate: number
          mortgage_remaining: number
          net_monthly_income: number
          net_monthly_spending: number
          pension_income: number
          phone: string
          planning_status: string
          retirement_target_age: number
          risk_profile: string
          saving_balance: number
          supabase_auth_id: string
        }[]
      }
      full_client_v2: {
        Args: { p_email: string }
        Returns: {
          advisor_email: string
          advisor_name: string
          age: number
          annuity_amount: number
          annuity_target_amount: number
          birth_date: string
          consumer_credit_amount: number
          contract_id: number
          country: string
          current_rent: number
          death_risk_assurance_amount: number
          disability_percentage: number
          dvo: number
          email: string
          employment_type: string
          energy_label: string
          financial_goal_amount: number
          financial_goal_description: string
          financial_goal_id: number
          first_name: string
          gender: string
          goal_priority: string
          gross_income: number
          home_value: number
          house_id: number
          id: string
          initials: string
          insurance_id: number
          insurance_premiums_total: number
          investment_balance: number
          investment_current_value: number
          investment_id: number
          is_damage_client: boolean
          is_owner_occupied: boolean
          last_name: string
          liability_id: number
          liability_total_amount: number
          max_loan: number
          monthly_fixed_costs: number
          monthly_variable_costs: number
          mortgage_amount: number
          mortgage_interest_rate: number
          mortgage_remaining: number
          net_monthly_income: number
          net_monthly_spending: number
          partner_gross_income: number
          pension_income: number
          phone: string
          planning_status: string
          prefix: string
          retirement_target_age: number
          risk_profile: string
          saving_balance: number
          supabase_auth_id: string
        }[]
      }
      get_dashboard_user: {
        Args: Record<string, never>
        Returns: {
          id: string
          email: string
          name: string
          role: Database["public"]["Enums"]["dashboard_role"]
          office_id: number | null
          office_name: string | null
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_client_auth_id: { Args: never; Returns: undefined }
      safe_to_float: { Args: { val: string }; Returns: number }
      safe_to_int: { Args: { val: string }; Returns: number }
      sync_figlo_client: {
        Args: {
          p_client: Json
          p_client_id: string
          p_houses?: Json
          p_insurances?: Json
          p_investments?: Json
          p_liabilities?: Json
          p_partners?: Json
          p_pensions?: Json
        }
        Returns: undefined
      }
      sync_figlo_client_v2: {
        Args: {
          p_client: Json
          p_client_id: string
          p_houses?: Json
          p_insurances?: Json
          p_investments?: Json
          p_liabilities?: Json
          p_partners?: Json
          p_pensions?: Json
        }
        Returns: undefined
      }
      upsert_tax_parameter: { Args: { p: Json }; Returns: undefined }
      v_tax_parameters_on: {
        Args: { peildatum: string }
        Returns: {
          code: string
          country: string
          currency: string | null
          id: string
          name: string
          regime: string
          source_ref: string | null
          source_url: string | null
          status: string
          unit: string | null
          updated_at: string | null
          valid_from: string
          valid_to: string | null
          value_numeric: number | null
          value_text: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "tax_parameters"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      app_role: "admin" | "user"
      dashboard_role: "super_admin" | "office_admin"
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
      app_role: ["admin", "user"],
      dashboard_role: ["super_admin", "office_admin"],
    },
  },
} as const
