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
          city: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          type: Database["public"]["Enums"]["account_type"]
          website: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          type: Database["public"]["Enums"]["account_type"]
          website?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          type?: Database["public"]["Enums"]["account_type"]
          website?: string | null
        }
        Relationships: []
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
      contacts: {
        Row: {
          account_id: string
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
          city: string
          construction_budget: number | null
          created_at: string
          id: string
          land_cost: number | null
          project_id: string
          state: string
          status: Database["public"]["Enums"]["property_status"]
          target_resale_value: number | null
          total_cost: number | null
        }
        Insert: {
          address: string
          apn?: string | null
          city: string
          construction_budget?: number | null
          created_at?: string
          id?: string
          land_cost?: number | null
          project_id: string
          state: string
          status?: Database["public"]["Enums"]["property_status"]
          target_resale_value?: number | null
          total_cost?: number | null
        }
        Update: {
          address?: string
          apn?: string | null
          city?: string
          construction_budget?: number | null
          created_at?: string
          id?: string
          land_cost?: number | null
          project_id?: string
          state?: string
          status?: Database["public"]["Enums"]["property_status"]
          target_resale_value?: number | null
          total_cost?: number | null
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
      tasks: {
        Row: {
          created_at: string
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
    }
    Views: {
      [_ in never]: never
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
      doc_type: "Deck" | "Model" | "Proforma" | "PPM" | "LOI" | "Contract"
      project_stage:
        | "Ideation"
        | "Pre-Dev"
        | "Raising"
        | "Entitlements"
        | "Construction"
        | "Stabilization"
        | "Exit"
      project_type: "AI_Data_Center" | "Luxury_Res" | "Tokenized_Fund"
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
      ],
      project_type: ["AI_Data_Center", "Luxury_Res", "Tokenized_Fund"],
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
