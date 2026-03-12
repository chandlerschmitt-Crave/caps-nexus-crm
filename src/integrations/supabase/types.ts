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
      accounts: {
        Row: {
          capital_invested: number | null
          city: string | null
          country: string | null
          created_at: string
          financing_type: string | null
          id: string
          investment_rate: string | null
          investment_term: string | null
          investment_type: string | null
          investor_status: string | null
          investor_tier: string | null
          last_report_sent_at: string | null
          name: string
          next_report_due_at: string | null
          notes: string | null
          phone: string | null
          relationship_owner_user_id: string | null
          state: string | null
          total_called_capital: number | null
          total_committed_capital: number | null
          total_distributed_capital: number | null
          type_of_account: string | null
          website: string | null
        }
        Insert: {
          capital_invested?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          financing_type?: string | null
          id?: string
          investment_rate?: string | null
          investment_term?: string | null
          investment_type?: string | null
          investor_status?: string | null
          investor_tier?: string | null
          last_report_sent_at?: string | null
          name: string
          next_report_due_at?: string | null
          notes?: string | null
          phone?: string | null
          relationship_owner_user_id?: string | null
          state?: string | null
          total_called_capital?: number | null
          total_committed_capital?: number | null
          total_distributed_capital?: number | null
          type_of_account?: string | null
          website?: string | null
        }
        Update: {
          capital_invested?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          financing_type?: string | null
          id?: string
          investment_rate?: string | null
          investment_term?: string | null
          investment_type?: string | null
          investor_status?: string | null
          investor_tier?: string | null
          last_report_sent_at?: string | null
          name?: string
          next_report_due_at?: string | null
          notes?: string | null
          phone?: string | null
          relationship_owner_user_id?: string | null
          state?: string | null
          total_called_capital?: number | null
          total_committed_capital?: number | null
          total_distributed_capital?: number | null
          type_of_account?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_relationship_owner_user_id_fkey"
            columns: ["relationship_owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activity_date: string
          body: string | null
          created_at: string
          id: string
          next_step: string | null
          next_step_due: string | null
          owner_user_id: string
          subject: string
          type: Database["public"]["Enums"]["activity_type"]
          what_id: string | null
          what_type: string | null
          who_contact_id: string | null
        }
        Insert: {
          activity_date: string
          body?: string | null
          created_at?: string
          id?: string
          next_step?: string | null
          next_step_due?: string | null
          owner_user_id: string
          subject: string
          type: Database["public"]["Enums"]["activity_type"]
          what_id?: string | null
          what_type?: string | null
          who_contact_id?: string | null
        }
        Update: {
          activity_date?: string
          body?: string | null
          created_at?: string
          id?: string
          next_step?: string | null
          next_step_due?: string | null
          owner_user_id?: string
          subject?: string
          type?: Database["public"]["Enums"]["activity_type"]
          what_id?: string | null
          what_type?: string | null
          who_contact_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_who_contact_id_fkey"
            columns: ["who_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          actuals: number | null
          approved_co: number | null
          code: string
          committed: number | null
          eac: number | null
          forecast_to_complete: number | null
          id: string
          name: string
          notes: string | null
          original_budget: number | null
          package_id: string
          percent_complete: number | null
          revised_budget: number | null
          section: string | null
          variance: number | null
        }
        Insert: {
          actuals?: number | null
          approved_co?: number | null
          code: string
          committed?: number | null
          eac?: number | null
          forecast_to_complete?: number | null
          id?: string
          name: string
          notes?: string | null
          original_budget?: number | null
          package_id: string
          percent_complete?: number | null
          revised_budget?: number | null
          section?: string | null
          variance?: number | null
        }
        Update: {
          actuals?: number | null
          approved_co?: number | null
          code?: string
          committed?: number | null
          eac?: number | null
          forecast_to_complete?: number | null
          id?: string
          name?: string
          notes?: string | null
          original_budget?: number | null
          package_id?: string
          percent_complete?: number | null
          revised_budget?: number | null
          section?: string | null
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "construction_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_stacks: {
        Row: {
          called_amount: number | null
          committed_amount: number | null
          created_at: string | null
          gp_split_above_hurdle_pct: number | null
          id: string
          interest_rate_pct: number | null
          layer: string
          lp_split_above_hurdle_pct: number | null
          ltc_pct: number | null
          ltv_pct: number | null
          maturity_date: string | null
          notes: string | null
          preferred_return_pct: number | null
          project_id: string
          promote_pct: number | null
          provider_name: string | null
          sort_order: number | null
          uncalled_amount: number | null
        }
        Insert: {
          called_amount?: number | null
          committed_amount?: number | null
          created_at?: string | null
          gp_split_above_hurdle_pct?: number | null
          id?: string
          interest_rate_pct?: number | null
          layer: string
          lp_split_above_hurdle_pct?: number | null
          ltc_pct?: number | null
          ltv_pct?: number | null
          maturity_date?: string | null
          notes?: string | null
          preferred_return_pct?: number | null
          project_id: string
          promote_pct?: number | null
          provider_name?: string | null
          sort_order?: number | null
          uncalled_amount?: number | null
        }
        Update: {
          called_amount?: number | null
          committed_amount?: number | null
          created_at?: string | null
          gp_split_above_hurdle_pct?: number | null
          id?: string
          interest_rate_pct?: number | null
          layer?: string
          lp_split_above_hurdle_pct?: number | null
          ltc_pct?: number | null
          ltv_pct?: number | null
          maturity_date?: string | null
          notes?: string | null
          preferred_return_pct?: number | null
          project_id?: string
          promote_pct?: number | null
          provider_name?: string | null
          sort_order?: number | null
          uncalled_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "capital_stacks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          approved_at: string | null
          co_no: string
          created_at: string | null
          description: string | null
          file_url: string | null
          id: string
          package_id: string
          status: string | null
          value: number
        }
        Insert: {
          approved_at?: string | null
          co_no: string
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          package_id: string
          status?: string | null
          value: number
        }
        Update: {
          approved_at?: string | null
          co_no?: string
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          package_id?: string
          status?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "construction_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      commitment_lines: {
        Row: {
          budget_line_id: string | null
          commitment_id: string
          description: string | null
          id: string
          value: number
        }
        Insert: {
          budget_line_id?: string | null
          commitment_id: string
          description?: string | null
          id?: string
          value: number
        }
        Update: {
          budget_line_id?: string | null
          commitment_id?: string
          description?: string | null
          id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "commitment_lines_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitment_lines_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "v_draw_continuation"
            referencedColumns: ["budget_line_id"]
          },
          {
            foreignKeyName: "commitment_lines_commitment_id_fkey"
            columns: ["commitment_id"]
            isOneToOne: false
            referencedRelation: "commitments"
            referencedColumns: ["id"]
          },
        ]
      }
      commitments: {
        Row: {
          created_at: string | null
          executed_at: string | null
          id: string
          number: string | null
          package_id: string
          retainage_pct: number | null
          status: string | null
          total_value: number
          vendor: string
        }
        Insert: {
          created_at?: string | null
          executed_at?: string | null
          id?: string
          number?: string | null
          package_id: string
          retainage_pct?: number | null
          status?: string | null
          total_value: number
          vendor: string
        }
        Update: {
          created_at?: string | null
          executed_at?: string | null
          id?: string
          number?: string | null
          package_id?: string
          retainage_pct?: number | null
          status?: string | null
          total_value?: number
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "commitments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "construction_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      construction_files: {
        Row: {
          id: string
          kind: string | null
          package_id: string
          title: string
          uploaded_at: string | null
          url: string
        }
        Insert: {
          id?: string
          kind?: string | null
          package_id: string
          title: string
          uploaded_at?: string | null
          url: string
        }
        Update: {
          id?: string
          kind?: string | null
          package_id?: string
          title?: string
          uploaded_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "construction_files_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "construction_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      construction_packages: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          notes: string | null
          phase: string | null
          project_id: string
          retainage_pct: number | null
          start_date: string | null
          substantial_completion: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          phase?: string | null
          project_id: string
          retainage_pct?: number | null
          start_date?: string | null
          substantial_completion?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          phase?: string | null
          project_id?: string
          retainage_pct?: number | null
          start_date?: string | null
          substantial_completion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "construction_packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_packages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          account_id: string
          communication_style: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          linkedin_url: string | null
          phone: string | null
          role: Database["public"]["Enums"]["contact_role"] | null
          title: string | null
        }
        Insert: {
          account_id: string
          communication_style?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          linkedin_url?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["contact_role"] | null
          title?: string | null
        }
        Update: {
          account_id?: string
          communication_style?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          linkedin_url?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["contact_role"] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          account_id: string
          amount_target: number | null
          close_date: string | null
          created_at: string
          id: string
          instrument: Database["public"]["Enums"]["deal_instrument"]
          name: string
          notes: string | null
          owner_user_id: string | null
          probability: number | null
          project_id: string | null
          source: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
        }
        Insert: {
          account_id: string
          amount_target?: number | null
          close_date?: string | null
          created_at?: string
          id?: string
          instrument: Database["public"]["Enums"]["deal_instrument"]
          name: string
          notes?: string | null
          owner_user_id?: string | null
          probability?: number | null
          project_id?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
        }
        Update: {
          account_id?: string
          amount_target?: number | null
          close_date?: string | null
          created_at?: string
          id?: string
          instrument?: Database["public"]["Enums"]["deal_instrument"]
          name?: string
          notes?: string | null
          owner_user_id?: string | null
          probability?: number | null
          project_id?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          id: string
          related_id: string | null
          related_type: string | null
          title: string
          uploaded_by_user_id: string | null
          url: string
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          id?: string
          related_id?: string | null
          related_type?: string | null
          title: string
          uploaded_by_user_id?: string | null
          url: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          id?: string
          related_id?: string | null
          related_type?: string | null
          title?: string
          uploaded_by_user_id?: string | null
          url?: string
        }
        Relationships: []
      }
      draw_lines: {
        Row: {
          budget_line_id: string | null
          draw_id: string
          id: string
          notes: string | null
          percent_complete: number | null
          prior_to_date: number | null
          retainage_this_period: number | null
          this_period: number | null
          to_date: number | null
          to_date_after: number | null
        }
        Insert: {
          budget_line_id?: string | null
          draw_id: string
          id?: string
          notes?: string | null
          percent_complete?: number | null
          prior_to_date?: number | null
          retainage_this_period?: number | null
          this_period?: number | null
          to_date?: number | null
          to_date_after?: number | null
        }
        Update: {
          budget_line_id?: string | null
          draw_id?: string
          id?: string
          notes?: string | null
          percent_complete?: number | null
          prior_to_date?: number | null
          retainage_this_period?: number | null
          this_period?: number | null
          to_date?: number | null
          to_date_after?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "draw_lines_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_lines_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "v_draw_continuation"
            referencedColumns: ["budget_line_id"]
          },
          {
            foreignKeyName: "draw_lines_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "draws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_lines_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "v_draw_continuation"
            referencedColumns: ["draw_id"]
          },
        ]
      }
      draws: {
        Row: {
          approved: number | null
          bank_reference: string | null
          created_at: string | null
          draw_no: number
          file_url: string | null
          funded: number | null
          id: string
          package_id: string
          period_end: string | null
          period_start: string | null
          requested: number | null
          status: string | null
        }
        Insert: {
          approved?: number | null
          bank_reference?: string | null
          created_at?: string | null
          draw_no: number
          file_url?: string | null
          funded?: number | null
          id?: string
          package_id: string
          period_end?: string | null
          period_start?: string | null
          requested?: number | null
          status?: string | null
        }
        Update: {
          approved?: number | null
          bank_reference?: string | null
          created_at?: string | null
          draw_no?: number
          file_url?: string | null
          funded?: number | null
          id?: string
          package_id?: string
          period_end?: string | null
          period_start?: string | null
          requested?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "draws_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "construction_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          bcc_emails: string[] | null
          body_html: string | null
          body_text: string | null
          cc_emails: string[] | null
          contact_id: string | null
          created_at: string
          from_email: string
          from_name: string | null
          gmail_message_id: string
          gmail_thread_id: string
          has_attachments: boolean
          id: string
          is_sent: boolean
          sent_at: string
          subject: string
          synced_at: string
          to_emails: string[]
        }
        Insert: {
          bcc_emails?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          contact_id?: string | null
          created_at?: string
          from_email: string
          from_name?: string | null
          gmail_message_id: string
          gmail_thread_id: string
          has_attachments?: boolean
          id?: string
          is_sent?: boolean
          sent_at: string
          subject: string
          synced_at?: string
          to_emails: string[]
        }
        Update: {
          bcc_emails?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          contact_id?: string | null
          created_at?: string
          from_email?: string
          from_name?: string | null
          gmail_message_id?: string
          gmail_thread_id?: string
          has_attachments?: boolean
          id?: string
          is_sent?: boolean
          sent_at?: string
          subject?: string
          synced_at?: string
          to_emails?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      geocode_cache: {
        Row: {
          address_hash: string
          county: string | null
          formatted_address: string | null
          lat: number | null
          lon: number | null
          raw: Json | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address_hash: string
          county?: string | null
          formatted_address?: string | null
          lat?: number | null
          lon?: number | null
          raw?: Json | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address_hash?: string
          county?: string | null
          formatted_address?: string | null
          lat?: number | null
          lon?: number | null
          raw?: Json | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      investor_obligations: {
        Row: {
          account_id: string
          assigned_to_user_id: string | null
          completed_date: string | null
          created_at: string | null
          document_url: string | null
          due_date: string
          id: string
          notes: string | null
          obligation_type: string
          project_id: string | null
          recurrence: string | null
          status: string
          title: string
        }
        Insert: {
          account_id: string
          assigned_to_user_id?: string | null
          completed_date?: string | null
          created_at?: string | null
          document_url?: string | null
          due_date: string
          id?: string
          notes?: string | null
          obligation_type: string
          project_id?: string | null
          recurrence?: string | null
          status?: string
          title: string
        }
        Update: {
          account_id?: string
          assigned_to_user_id?: string | null
          completed_date?: string | null
          created_at?: string | null
          document_url?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          obligation_type?: string
          project_id?: string | null
          recurrence?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_obligations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_obligations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_obligations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          approved_amount: number | null
          billed_this_period: number | null
          commitment_id: string | null
          created_at: string | null
          file_url: string | null
          id: string
          invoice_no: string
          package_id: string
          period_end: string | null
          period_start: string | null
          retainage_held: number | null
          status: string | null
        }
        Insert: {
          approved_amount?: number | null
          billed_this_period?: number | null
          commitment_id?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          invoice_no: string
          package_id: string
          period_end?: string | null
          period_start?: string | null
          retainage_held?: number | null
          status?: string | null
        }
        Update: {
          approved_amount?: number | null
          billed_this_period?: number | null
          commitment_id?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          invoice_no?: string
          package_id?: string
          period_end?: string | null
          period_start?: string | null
          retainage_held?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_commitment_id_fkey"
            columns: ["commitment_id"]
            isOneToOne: false
            referencedRelation: "commitments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "construction_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_jsonld: {
        Row: {
          parcel_id: string
          raw: Json | null
          updated_at: string | null
        }
        Insert: {
          parcel_id: string
          raw?: Json | null
          updated_at?: string | null
        }
        Update: {
          parcel_id?: string
          raw?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_jsonld_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: true
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          created_by_user_id: string
          id: string
          related_id: string
          related_type: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by_user_id: string
          id?: string
          related_id: string
          related_type: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by_user_id?: string
          id?: string
          related_id?: string
          related_type?: string
        }
        Relationships: []
      }
      ops_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      parcel_images: {
        Row: {
          created_at: string | null
          id: string
          kind: string | null
          parcel_id: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind?: string | null
          parcel_id?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string | null
          parcel_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parcel_images_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      parcel_rights: {
        Row: {
          easements: string | null
          id: string
          mineral_rights_confidence: string | null
          mineral_rights_evidence: string | null
          mineral_rights_owner: string | null
          mineral_rights_source: string | null
          notes: string | null
          parcel_id: string | null
          restrictions: string | null
        }
        Insert: {
          easements?: string | null
          id?: string
          mineral_rights_confidence?: string | null
          mineral_rights_evidence?: string | null
          mineral_rights_owner?: string | null
          mineral_rights_source?: string | null
          notes?: string | null
          parcel_id?: string | null
          restrictions?: string | null
        }
        Update: {
          easements?: string | null
          id?: string
          mineral_rights_confidence?: string | null
          mineral_rights_evidence?: string | null
          mineral_rights_owner?: string | null
          mineral_rights_source?: string | null
          notes?: string | null
          parcel_id?: string | null
          restrictions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parcel_rights_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      parcel_topography: {
        Row: {
          elevation_ft: number | null
          id: string
          parcel_id: string | null
          road_access_score: number | null
          slope_pct: number | null
          view_quality_score: number | null
        }
        Insert: {
          elevation_ft?: number | null
          id?: string
          parcel_id?: string | null
          road_access_score?: number | null
          slope_pct?: number | null
          view_quality_score?: number | null
        }
        Update: {
          elevation_ft?: number | null
          id?: string
          parcel_id?: string | null
          road_access_score?: number | null
          slope_pct?: number | null
          view_quality_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parcel_topography_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      parcel_utilities: {
        Row: {
          available_mw_confidence: string | null
          available_mw_estimate: number | null
          available_mw_evidence: string | null
          available_mw_source: string | null
          comp_price_per_acre: number | null
          fiber_distance_miles: number | null
          fiber_provider: string | null
          fiber_providers: string | null
          gas_batteries_allowed: boolean | null
          gas_batteries_confidence: string | null
          gas_batteries_source: string | null
          gas_provider: string | null
          grid_operator: string | null
          id: string
          nearest_substation_distance_mi: number | null
          nearest_substation_name: string | null
          notes: string | null
          parcel_id: string | null
          peak_season_constraints: string | null
          throttling_confidence: string | null
          throttling_risk: string | null
          throttling_source: string | null
          water_provider: string | null
        }
        Insert: {
          available_mw_confidence?: string | null
          available_mw_estimate?: number | null
          available_mw_evidence?: string | null
          available_mw_source?: string | null
          comp_price_per_acre?: number | null
          fiber_distance_miles?: number | null
          fiber_provider?: string | null
          fiber_providers?: string | null
          gas_batteries_allowed?: boolean | null
          gas_batteries_confidence?: string | null
          gas_batteries_source?: string | null
          gas_provider?: string | null
          grid_operator?: string | null
          id?: string
          nearest_substation_distance_mi?: number | null
          nearest_substation_name?: string | null
          notes?: string | null
          parcel_id?: string | null
          peak_season_constraints?: string | null
          throttling_confidence?: string | null
          throttling_risk?: string | null
          throttling_source?: string | null
          water_provider?: string | null
        }
        Update: {
          available_mw_confidence?: string | null
          available_mw_estimate?: number | null
          available_mw_evidence?: string | null
          available_mw_source?: string | null
          comp_price_per_acre?: number | null
          fiber_distance_miles?: number | null
          fiber_provider?: string | null
          fiber_providers?: string | null
          gas_batteries_allowed?: boolean | null
          gas_batteries_confidence?: string | null
          gas_batteries_source?: string | null
          gas_provider?: string | null
          grid_operator?: string | null
          id?: string
          nearest_substation_distance_mi?: number | null
          nearest_substation_name?: string | null
          notes?: string | null
          parcel_id?: string | null
          peak_season_constraints?: string | null
          throttling_confidence?: string | null
          throttling_risk?: string | null
          throttling_source?: string | null
          water_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parcel_utilities_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      parcel_zoning: {
        Row: {
          commercial_allowed: boolean | null
          data_center_allowed: boolean | null
          entitlement_speed: string | null
          id: string
          lot_coverage_pct: number | null
          max_height_ft: number | null
          overlay_coastal: boolean | null
          overlay_fire: boolean | null
          overlay_flood: boolean | null
          parcel_id: string | null
          references_url: string | null
          residential_allowed: boolean | null
          zoning_type: string | null
        }
        Insert: {
          commercial_allowed?: boolean | null
          data_center_allowed?: boolean | null
          entitlement_speed?: string | null
          id?: string
          lot_coverage_pct?: number | null
          max_height_ft?: number | null
          overlay_coastal?: boolean | null
          overlay_fire?: boolean | null
          overlay_flood?: boolean | null
          parcel_id?: string | null
          references_url?: string | null
          residential_allowed?: boolean | null
          zoning_type?: string | null
        }
        Update: {
          commercial_allowed?: boolean | null
          data_center_allowed?: boolean | null
          entitlement_speed?: string | null
          id?: string
          lot_coverage_pct?: number | null
          max_height_ft?: number | null
          overlay_coastal?: boolean | null
          overlay_fire?: boolean | null
          overlay_flood?: boolean | null
          parcel_id?: string | null
          references_url?: string | null
          residential_allowed?: boolean | null
          zoning_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parcel_zoning_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      parcels: {
        Row: {
          acreage: number | null
          address: string | null
          address_hash: string | null
          address_norm: string | null
          apn: string | null
          asking_price: number | null
          best_use: string | null
          canonical_url: string | null
          city: string | null
          county: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          dom_days_on_market: number | null
          enrichment_status: string | null
          entitlement_notes: string | null
          flood_zone: string | null
          force_refresh: boolean | null
          id: string
          last_enriched_at: string | null
          last_seen_at: string | null
          last_seen_price: number | null
          latitude: number | null
          listing_contact_email: string | null
          listing_contact_name: string | null
          listing_contact_phone: string | null
          listing_url: string | null
          longitude: number | null
          name: string | null
          near_airport_miles: number | null
          near_highway_miles: number | null
          parcel_polygon: string | null
          price_per_acre: number | null
          project_id: string | null
          prospect_confidence_pct: number | null
          prospect_notes: string | null
          prospect_owner: string | null
          score_data_center: number | null
          score_luxury: number | null
          score_updated_at: string | null
          source_listing_id: string | null
          source_name: string | null
          source_url: string | null
          state: string | null
          status: string | null
          url_fingerprint: string | null
          url_last_checked: string | null
          url_status: string | null
          url_title: string | null
          wildfire_risk_index: number | null
          zip: string | null
          zoning_code: string | null
          zoning_desc: string | null
        }
        Insert: {
          acreage?: number | null
          address?: string | null
          address_hash?: string | null
          address_norm?: string | null
          apn?: string | null
          asking_price?: number | null
          best_use?: string | null
          canonical_url?: string | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          dom_days_on_market?: number | null
          enrichment_status?: string | null
          entitlement_notes?: string | null
          flood_zone?: string | null
          force_refresh?: boolean | null
          id?: string
          last_enriched_at?: string | null
          last_seen_at?: string | null
          last_seen_price?: number | null
          latitude?: number | null
          listing_contact_email?: string | null
          listing_contact_name?: string | null
          listing_contact_phone?: string | null
          listing_url?: string | null
          longitude?: number | null
          name?: string | null
          near_airport_miles?: number | null
          near_highway_miles?: number | null
          parcel_polygon?: string | null
          price_per_acre?: number | null
          project_id?: string | null
          prospect_confidence_pct?: number | null
          prospect_notes?: string | null
          prospect_owner?: string | null
          score_data_center?: number | null
          score_luxury?: number | null
          score_updated_at?: string | null
          source_listing_id?: string | null
          source_name?: string | null
          source_url?: string | null
          state?: string | null
          status?: string | null
          url_fingerprint?: string | null
          url_last_checked?: string | null
          url_status?: string | null
          url_title?: string | null
          wildfire_risk_index?: number | null
          zip?: string | null
          zoning_code?: string | null
          zoning_desc?: string | null
        }
        Update: {
          acreage?: number | null
          address?: string | null
          address_hash?: string | null
          address_norm?: string | null
          apn?: string | null
          asking_price?: number | null
          best_use?: string | null
          canonical_url?: string | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          dom_days_on_market?: number | null
          enrichment_status?: string | null
          entitlement_notes?: string | null
          flood_zone?: string | null
          force_refresh?: boolean | null
          id?: string
          last_enriched_at?: string | null
          last_seen_at?: string | null
          last_seen_price?: number | null
          latitude?: number | null
          listing_contact_email?: string | null
          listing_contact_name?: string | null
          listing_contact_phone?: string | null
          listing_url?: string | null
          longitude?: number | null
          name?: string | null
          near_airport_miles?: number | null
          near_highway_miles?: number | null
          parcel_polygon?: string | null
          price_per_acre?: number | null
          project_id?: string | null
          prospect_confidence_pct?: number | null
          prospect_notes?: string | null
          prospect_owner?: string | null
          score_data_center?: number | null
          score_luxury?: number | null
          score_updated_at?: string | null
          source_listing_id?: string | null
          source_name?: string | null
          source_url?: string | null
          state?: string | null
          status?: string | null
          url_fingerprint?: string | null
          url_last_checked?: string | null
          url_status?: string | null
          url_title?: string | null
          wildfire_risk_index?: number | null
          zip?: string | null
          zoning_code?: string | null
          zoning_desc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parcels_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      picklists: {
        Row: {
          id: string
          is_active: boolean
          list_name: string
          sort_order: number | null
          value: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          list_name: string
          sort_order?: number | null
          value: string
        }
        Update: {
          id?: string
          is_active?: boolean
          list_name?: string
          sort_order?: number | null
          value?: string
        }
        Relationships: []
      }
      poi_reference: {
        Row: {
          id: string
          latitude: number
          longitude: number
          metadata: Json | null
          name: string
          poi_type: string
          state: string
        }
        Insert: {
          id?: string
          latitude: number
          longitude: number
          metadata?: Json | null
          name: string
          poi_type: string
          state: string
        }
        Update: {
          id?: string
          latitude?: number
          longitude?: number
          metadata?: Json | null
          name?: string
          poi_type?: string
          state?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      progress_updates: {
        Row: {
          created_at: string | null
          date: string
          id: string
          inspector: string | null
          notes: string | null
          package_id: string
          percent_overall: number | null
          photos_url: string | null
          stage: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          inspector?: string | null
          notes?: string | null
          package_id: string
          percent_overall?: number | null
          photos_url?: string | null
          stage?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          inspector?: string | null
          notes?: string | null
          package_id?: string
          percent_overall?: number | null
          photos_url?: string | null
          stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_updates_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "construction_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_financials: {
        Row: {
          actual_irr_pct: number | null
          actual_noi_to_date: number | null
          capital_deployed_pct: number | null
          dscr: number | null
          exit_date_projected: string | null
          exit_strategy: string | null
          hold_period_years: number | null
          id: string
          notes: string | null
          project_id: string
          projected_equity_multiple: number | null
          projected_irr_pct: number | null
          projected_noi: number | null
          projected_yield_on_cost_pct: number | null
          target_close_date: string | null
          target_equity_multiple: number | null
          target_irr_pct: number | null
          target_noi: number | null
          target_yield_on_cost_pct: number | null
          total_debt_raised: number | null
          total_equity_raised: number | null
          total_project_cost: number | null
          updated_at: string | null
        }
        Insert: {
          actual_irr_pct?: number | null
          actual_noi_to_date?: number | null
          capital_deployed_pct?: number | null
          dscr?: number | null
          exit_date_projected?: string | null
          exit_strategy?: string | null
          hold_period_years?: number | null
          id?: string
          notes?: string | null
          project_id: string
          projected_equity_multiple?: number | null
          projected_irr_pct?: number | null
          projected_noi?: number | null
          projected_yield_on_cost_pct?: number | null
          target_close_date?: string | null
          target_equity_multiple?: number | null
          target_irr_pct?: number | null
          target_noi?: number | null
          target_yield_on_cost_pct?: number | null
          total_debt_raised?: number | null
          total_equity_raised?: number | null
          total_project_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_irr_pct?: number | null
          actual_noi_to_date?: number | null
          capital_deployed_pct?: number | null
          dscr?: number | null
          exit_date_projected?: string | null
          exit_strategy?: string | null
          hold_period_years?: number | null
          id?: string
          notes?: string | null
          project_id?: string
          projected_equity_multiple?: number | null
          projected_irr_pct?: number | null
          projected_noi?: number | null
          projected_yield_on_cost_pct?: number | null
          target_close_date?: string | null
          target_equity_multiple?: number | null
          target_irr_pct?: number | null
          target_noi?: number | null
          target_yield_on_cost_pct?: number | null
          total_debt_raised?: number | null
          total_equity_raised?: number | null
          total_project_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_financials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          account_id: string
          created_at: string
          description: string | null
          est_total_cost: number | null
          id: string
          market: string | null
          name: string
          project_type: Database["public"]["Enums"]["project_type"]
          stage: Database["public"]["Enums"]["project_stage"]
          vertical: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          description?: string | null
          est_total_cost?: number | null
          id?: string
          market?: string | null
          name: string
          project_type: Database["public"]["Enums"]["project_type"]
          stage?: Database["public"]["Enums"]["project_stage"]
          vertical?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          description?: string | null
          est_total_cost?: number | null
          id?: string
          market?: string | null
          name?: string
          project_type?: Database["public"]["Enums"]["project_type"]
          stage?: Database["public"]["Enums"]["project_stage"]
          vertical?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          apn: string | null
          arv: number | null
          city: string
          construction_budget: number | null
          construction_hard: number | null
          created_at: string
          exit_costs: number | null
          gross_margin: number | null
          id: string
          land_cost: number | null
          project_id: string
          projected_profit: number | null
          purchase: number | null
          roi_on_uses: number | null
          softs: number | null
          state: string
          status: Database["public"]["Enums"]["property_status"]
          target_resale_value: number | null
          total_cost: number | null
          total_use_of_funds: number | null
        }
        Insert: {
          address: string
          apn?: string | null
          arv?: number | null
          city: string
          construction_budget?: number | null
          construction_hard?: number | null
          created_at?: string
          exit_costs?: number | null
          gross_margin?: number | null
          id?: string
          land_cost?: number | null
          project_id: string
          projected_profit?: number | null
          purchase?: number | null
          roi_on_uses?: number | null
          softs?: number | null
          state: string
          status?: Database["public"]["Enums"]["property_status"]
          target_resale_value?: number | null
          total_cost?: number | null
          total_use_of_funds?: number | null
        }
        Update: {
          address?: string
          apn?: string | null
          arv?: number | null
          city?: string
          construction_budget?: number | null
          construction_hard?: number | null
          created_at?: string
          exit_costs?: number | null
          gross_margin?: number | null
          id?: string
          land_cost?: number | null
          project_id?: string
          projected_profit?: number | null
          purchase?: number | null
          roi_on_uses?: number | null
          softs?: number | null
          state?: string
          status?: Database["public"]["Enums"]["property_status"]
          target_resale_value?: number | null
          total_cost?: number | null
          total_use_of_funds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      recap_logs: {
        Row: {
          error_message: string | null
          html_body: string | null
          id: string
          narrative: string | null
          recipient_count: number
          sent_at: string
          stats: Json | null
          status: string
          subject: string
        }
        Insert: {
          error_message?: string | null
          html_body?: string | null
          id?: string
          narrative?: string | null
          recipient_count?: number
          sent_at?: string
          stats?: Json | null
          status?: string
          subject: string
        }
        Update: {
          error_message?: string | null
          html_body?: string | null
          id?: string
          narrative?: string | null
          recipient_count?: number
          sent_at?: string
          stats?: Json | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      recap_preferences: {
        Row: {
          excluded_project_ids: string[] | null
          id: string
          is_enabled: boolean
          send_time: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          excluded_project_ids?: string[] | null
          id?: string
          is_enabled?: boolean
          send_time?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          excluded_project_ids?: string[] | null
          id?: string
          is_enabled?: boolean
          send_time?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recap_preferences_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          owner_user_id: string
          priority: Database["public"]["Enums"]["task_priority"]
          related_id: string | null
          related_type: string | null
          status: Database["public"]["Enums"]["task_status"]
          subject: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner_user_id: string
          priority?: Database["public"]["Enums"]["task_priority"]
          related_id?: string | null
          related_type?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          subject: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner_user_id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          related_id?: string | null
          related_type?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          subject?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voltqore_site_metrics: {
        Row: {
          avg_session_price_kwh: number | null
          created_at: string | null
          ebitda_margin_pct: number | null
          gross_capex: number | null
          ground_lease_executed: boolean | null
          ground_lease_monthly: number | null
          id: string
          incentives_secured: number | null
          itc_application_status: string | null
          lcfs_credits_monthly: number | null
          lcfs_registration_status: string | null
          location_city: string | null
          location_state: string | null
          market_type: string | null
          monthly_gross_revenue: number | null
          net_capex: number | null
          noi_monthly: number | null
          notes: string | null
          project_id: string
          site_name: string | null
          spv_formed: boolean | null
          stalls_in_development: number | null
          stalls_operational: number | null
          status: string | null
          tesla_om_agreement: boolean | null
          tesla_om_cost_monthly: number | null
          total_stalls: number | null
          updated_at: string | null
          utilities_network_fees_monthly: number | null
          utilization_rate_pct: number | null
          utilization_target_pct: number | null
          yield_on_cost_pct: number | null
        }
        Insert: {
          avg_session_price_kwh?: number | null
          created_at?: string | null
          ebitda_margin_pct?: number | null
          gross_capex?: number | null
          ground_lease_executed?: boolean | null
          ground_lease_monthly?: number | null
          id?: string
          incentives_secured?: number | null
          itc_application_status?: string | null
          lcfs_credits_monthly?: number | null
          lcfs_registration_status?: string | null
          location_city?: string | null
          location_state?: string | null
          market_type?: string | null
          monthly_gross_revenue?: number | null
          net_capex?: number | null
          noi_monthly?: number | null
          notes?: string | null
          project_id: string
          site_name?: string | null
          spv_formed?: boolean | null
          stalls_in_development?: number | null
          stalls_operational?: number | null
          status?: string | null
          tesla_om_agreement?: boolean | null
          tesla_om_cost_monthly?: number | null
          total_stalls?: number | null
          updated_at?: string | null
          utilities_network_fees_monthly?: number | null
          utilization_rate_pct?: number | null
          utilization_target_pct?: number | null
          yield_on_cost_pct?: number | null
        }
        Update: {
          avg_session_price_kwh?: number | null
          created_at?: string | null
          ebitda_margin_pct?: number | null
          gross_capex?: number | null
          ground_lease_executed?: boolean | null
          ground_lease_monthly?: number | null
          id?: string
          incentives_secured?: number | null
          itc_application_status?: string | null
          lcfs_credits_monthly?: number | null
          lcfs_registration_status?: string | null
          location_city?: string | null
          location_state?: string | null
          market_type?: string | null
          monthly_gross_revenue?: number | null
          net_capex?: number | null
          noi_monthly?: number | null
          notes?: string | null
          project_id?: string
          site_name?: string | null
          spv_formed?: boolean | null
          stalls_in_development?: number | null
          stalls_operational?: number | null
          status?: string | null
          tesla_om_agreement?: boolean | null
          tesla_om_cost_monthly?: number | null
          total_stalls?: number | null
          updated_at?: string | null
          utilities_network_fees_monthly?: number | null
          utilization_rate_pct?: number | null
          utilization_target_pct?: number | null
          yield_on_cost_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voltqore_site_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_draw_continuation: {
        Row: {
          budget_line_id: string | null
          code: string | null
          draw_id: string | null
          name: string | null
          package_id: string | null
          percent_complete: number | null
          prior_to_date: number | null
          remaining: number | null
          revised_budget: number | null
          section: string | null
          this_period: number | null
          to_date: number | null
        }
        Relationships: [
          {
            foreignKeyName: "draws_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "construction_packages"
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
      account_type:
        | "DevCo"
        | "HoldCo"
        | "Fund"
        | "Investor"
        | "Lender"
        | "Partner"
        | "Agency"
      activity_type: "Call" | "Email" | "Meeting" | "Note" | "Site_Visit"
      app_role: "Admin" | "Standard" | "ReadOnly"
      contact_role:
        | "Investor"
        | "LP"
        | "GP"
        | "Broker"
        | "CIO"
        | "CTO"
        | "Advisor"
        | "GC"
        | "Vendor"
        | "Prospect"
      deal_instrument:
        | "Equity"
        | "Debt"
        | "Seller_Carry"
        | "SAFE"
        | "Rev_Share"
        | "Token"
      deal_stage:
        | "Sourcing"
        | "Intro"
        | "Diligence"
        | "LOI_Out"
        | "Negotiation"
        | "Docs"
        | "Closed_Won"
        | "Closed_Lost"
        | "Prospecting"
      doc_type: "Deck" | "Model" | "Proforma" | "PPM" | "LOI" | "Contract"
      project_stage:
        | "Ideation"
        | "Pre-Dev"
        | "Raising"
        | "Entitlements"
        | "Construction"
        | "Stabilization"
        | "Exit"
        | "Site_Identified"
        | "Underwriting"
        | "LOI_Ground_Lease"
        | "Permits"
        | "Incentive_Applications"
        | "Shovel_Ready"
        | "Energized"
        | "Stabilized_Operations"
      project_type:
        | "AI_Data_Center"
        | "Luxury_Res"
        | "Tokenized_Fund"
        | "EV_Charging"
      property_status:
        | "Sourcing"
        | "Under_Contract"
        | "Entitling"
        | "Building"
        | "Listed"
        | "Sold"
      task_priority: "Low" | "Med" | "High"
      task_status: "Not_Started" | "In_Progress" | "Blocked" | "Done"
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
      account_type: [
        "DevCo",
        "HoldCo",
        "Fund",
        "Investor",
        "Lender",
        "Partner",
        "Agency",
      ],
      activity_type: ["Call", "Email", "Meeting", "Note", "Site_Visit"],
      app_role: ["Admin", "Standard", "ReadOnly"],
      contact_role: [
        "Investor",
        "LP",
        "GP",
        "Broker",
        "CIO",
        "CTO",
        "Advisor",
        "GC",
        "Vendor",
        "Prospect",
      ],
      deal_instrument: [
        "Equity",
        "Debt",
        "Seller_Carry",
        "SAFE",
        "Rev_Share",
        "Token",
      ],
      deal_stage: [
        "Sourcing",
        "Intro",
        "Diligence",
        "LOI_Out",
        "Negotiation",
        "Docs",
        "Closed_Won",
        "Closed_Lost",
        "Prospecting",
      ],
      doc_type: ["Deck", "Model", "Proforma", "PPM", "LOI", "Contract"],
      project_stage: [
        "Ideation",
        "Pre-Dev",
        "Raising",
        "Entitlements",
        "Construction",
        "Stabilization",
        "Exit",
        "Site_Identified",
        "Underwriting",
        "LOI_Ground_Lease",
        "Permits",
        "Incentive_Applications",
        "Shovel_Ready",
        "Energized",
        "Stabilized_Operations",
      ],
      project_type: [
        "AI_Data_Center",
        "Luxury_Res",
        "Tokenized_Fund",
        "EV_Charging",
      ],
      property_status: [
        "Sourcing",
        "Under_Contract",
        "Entitling",
        "Building",
        "Listed",
        "Sold",
      ],
      task_priority: ["Low", "Med", "High"],
      task_status: ["Not_Started", "In_Progress", "Blocked", "Done"],
    },
  },
} as const
