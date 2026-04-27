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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_name: string
          balance: number
          connection_id: string | null
          created_at: string
          currency: string
          id: string
          institution_name: string
          last_sync_at: string | null
          provider_account_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          account_name: string
          balance?: number
          connection_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          institution_name: string
          last_sync_at?: string | null
          provider_account_id?: string | null
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          account_name?: string
          balance?: number
          connection_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          institution_name?: string
          last_sync_at?: string | null
          provider_account_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          currency: string
          healthy_pct: number | null
          id: string
          is_recurring: boolean
          name: string
          period: string
          period_month: string | null
          period_start_day: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string
          currency?: string
          healthy_pct?: number | null
          id?: string
          is_recurring?: boolean
          name: string
          period?: string
          period_month?: string | null
          period_start_day?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          currency?: string
          healthy_pct?: number | null
          id?: string
          is_recurring?: boolean
          name?: string
          period?: string
          period_month?: string | null
          period_start_day?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          parent_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
          parent_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          parent_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          accounts_count: number | null
          consent_expires_at: string | null
          country: string
          created_at: string
          external_connection_id: string | null
          id: string
          item_id: string | null
          last_sync_at: string | null
          logo: string | null
          provider: string
          provider_type: string
          status: string
          user_id: string
        }
        Insert: {
          accounts_count?: number | null
          consent_expires_at?: string | null
          country: string
          created_at?: string
          external_connection_id?: string | null
          id?: string
          item_id?: string | null
          last_sync_at?: string | null
          logo?: string | null
          provider: string
          provider_type: string
          status?: string
          user_id: string
        }
        Update: {
          accounts_count?: number | null
          consent_expires_at?: string | null
          country?: string
          created_at?: string
          external_connection_id?: string | null
          id?: string
          item_id?: string | null
          last_sync_at?: string | null
          logo?: string | null
          provider?: string
          provider_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_installments: {
        Row: {
          amount: number
          contract_id: string
          due_date: string
          id: string
          number: number
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          contract_id: string
          due_date: string
          id?: string
          number: number
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string
          due_date?: string
          id?: string
          number?: number
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_installments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_installments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string | null
          currency: string
          first_due_date: string | null
          id: string
          installments: number | null
          interest_rate: number | null
          lender: string | null
          notes: string | null
          principal_amount: number
          rate_type: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string
          first_due_date?: string | null
          id?: string
          installments?: number | null
          interest_rate?: number | null
          lender?: string | null
          notes?: string | null
          principal_amount: number
          rate_type?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string
          first_due_date?: string | null
          id?: string
          installments?: number | null
          interest_rate?: number | null
          lender?: string | null
          notes?: string | null
          principal_amount?: number
          rate_type?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          created_at: string | null
          created_by: string | null
          failed_count: number | null
          id: string
          name: string
          scheduled_at: string | null
          sent_count: number | null
          status: string | null
          target: string
          template_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          failed_count?: number | null
          id?: string
          name: string
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string | null
          target?: string
          template_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          failed_count?: number | null
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string | null
          target?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          resend_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_type: string
          user_id: string | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_type: string
          user_id?: string | null
        }
        Update: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          active: boolean | null
          body_html: string
          body_text: string
          created_at: string | null
          id: string
          last_edited_by: string | null
          name: string
          subject: string
          type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          active?: boolean | null
          body_html?: string
          body_text?: string
          created_at?: string | null
          id?: string
          last_edited_by?: string | null
          name: string
          subject: string
          type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          active?: boolean | null
          body_html?: string
          body_text?: string
          created_at?: string | null
          id?: string
          last_edited_by?: string | null
          name?: string
          subject?: string
          type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string
          error_message: string
          error_stack: string | null
          id: string
          metadata: Json | null
          page: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          page?: string | null
          severity?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          page?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          color: string | null
          created_at: string
          currency: string
          current_amount: number
          description: string | null
          icon: string | null
          id: string
          linked_investment_id: string | null
          monthly_contribution: number | null
          status: string
          target_amount: number
          target_date: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          description?: string | null
          icon?: string | null
          id?: string
          linked_investment_id?: string | null
          monthly_contribution?: number | null
          status?: string
          target_amount: number
          target_date?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          description?: string | null
          icon?: string | null
          id?: string
          linked_investment_id?: string | null
          monthly_contribution?: number | null
          status?: string
          target_amount?: number
          target_date?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_linked_investment_id_fkey"
            columns: ["linked_investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          created_at: string
          currency: string
          current_value: number
          expected_return_pct: number | null
          id: string
          institution: string | null
          invested_amount: number
          is_emergency_fund: boolean | null
          maturity_date: string | null
          name: string
          notes: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          current_value: number
          expected_return_pct?: number | null
          id?: string
          institution?: string | null
          invested_amount: number
          is_emergency_fund?: boolean | null
          maturity_date?: string | null
          name: string
          notes?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          current_value?: number
          expected_return_pct?: number | null
          id?: string
          institution?: string | null
          invested_amount?: number
          is_emergency_fund?: boolean | null
          maturity_date?: string | null
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          language: string
          last_active_at: string | null
          monthly_income_brl: number | null
          onboarding_completed: boolean
          plan: string
          tour_completed: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          language?: string
          last_active_at?: string | null
          monthly_income_brl?: number | null
          onboarding_completed?: boolean
          plan?: string
          tour_completed?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string
          last_active_at?: string | null
          monthly_income_brl?: number | null
          onboarding_completed?: boolean
          plan?: string
          tour_completed?: boolean
        }
        Relationships: []
      }
      rules: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          match_type: string
          match_value: string
          priority: number | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          match_type: string
          match_value: string
          priority?: number | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          match_type?: string
          match_value?: string
          priority?: number | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          category_id: string | null
          created_at: string
          currency: string
          diagnosis: string | null
          duration_type: string | null
          duration_value: number | null
          horizon_months: number | null
          id: string
          metadata: Json | null
          monthly_amount: number
          monthly_impact: number | null
          name: string
          simulation_type: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency?: string
          diagnosis?: string | null
          duration_type?: string | null
          duration_value?: number | null
          horizon_months?: number | null
          id?: string
          metadata?: Json | null
          monthly_amount: number
          monthly_impact?: number | null
          name: string
          simulation_type?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: string
          diagnosis?: string | null
          duration_type?: string | null
          duration_value?: number | null
          horizon_months?: number | null
          id?: string
          metadata?: Json | null
          monthly_amount?: number
          monthly_impact?: number | null
          name?: string
          simulation_type?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          message: string
          page_context: string | null
          responded_at: string | null
          status: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message: string
          page_context?: string | null
          responded_at?: string | null
          status?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message?: string
          page_context?: string | null
          responded_at?: string | null
          status?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          category_source: string
          connection_id: string | null
          created_at: string
          currency: string
          description_raw: string | null
          external_transaction_id: string | null
          id: string
          institution_name: string | null
          merchant: string
          posted_at: string
          raw: Json | null
          source: string
          status: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          category_source?: string
          connection_id?: string | null
          created_at?: string
          currency?: string
          description_raw?: string | null
          external_transaction_id?: string | null
          id?: string
          institution_name?: string | null
          merchant: string
          posted_at?: string
          raw?: Json | null
          source?: string
          status?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          category_source?: string
          connection_id?: string | null
          created_at?: string
          currency?: string
          description_raw?: string | null
          external_transaction_id?: string | null
          id?: string
          institution_name?: string | null
          merchant?: string
          posted_at?: string
          raw?: Json | null
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          plan: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          plan?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          plan?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_count_active_goals: { Args: { p_user_id: string }; Returns: number }
      admin_count_table: { Args: { table_name: string }; Returns: number }
      admin_count_user_table: {
        Args: { p_user_id: string; table_name: string }
        Returns: number
      }
      admin_get_all_profiles: {
        Args: never
        Returns: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          language: string
          last_active_at: string | null
          monthly_income_brl: number | null
          onboarding_completed: boolean
          plan: string
          tour_completed: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_get_user_accounts: {
        Args: { p_user_id: string }
        Returns: {
          account_name: string
          balance: number
          connection_id: string | null
          created_at: string
          currency: string
          id: string
          institution_name: string
          last_sync_at: string | null
          provider_account_id: string | null
          status: string
          type: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "accounts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_get_user_transactions: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          account_id: string | null
          amount: number
          category_id: string | null
          category_source: string
          connection_id: string | null
          created_at: string
          currency: string
          description_raw: string | null
          external_transaction_id: string | null
          id: string
          institution_name: string | null
          merchant: string
          posted_at: string
          raw: Json | null
          source: string
          status: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
