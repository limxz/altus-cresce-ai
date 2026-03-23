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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      client_conversations: {
        Row: {
          bot_type: string
          client_id: string
          contact_name: string | null
          contact_phone: string | null
          id: string
          last_message_at: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          bot_type?: string
          client_id: string
          contact_name?: string | null
          contact_phone?: string | null
          id?: string
          last_message_at?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          bot_type?: string
          client_id?: string
          contact_name?: string | null
          contact_phone?: string | null
          id?: string
          last_message_at?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          sender: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          sender?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "client_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          brand_color: string | null
          business_name: string
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string | null
          facebook_baseline: number | null
          id: string
          instagram_baseline: number | null
          internal_notes: string | null
          leads_baseline: number | null
          login_email: string
          login_password: string
          logo_url: string | null
          mrr: number | null
          niche: string
          plan: string
          services: Json | null
          start_date: string | null
          status: string
        }
        Insert: {
          brand_color?: string | null
          business_name: string
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string | null
          facebook_baseline?: number | null
          id?: string
          instagram_baseline?: number | null
          internal_notes?: string | null
          leads_baseline?: number | null
          login_email: string
          login_password: string
          logo_url?: string | null
          mrr?: number | null
          niche?: string
          plan?: string
          services?: Json | null
          start_date?: string | null
          status?: string
        }
        Update: {
          brand_color?: string | null
          business_name?: string
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string | null
          facebook_baseline?: number | null
          id?: string
          instagram_baseline?: number | null
          internal_notes?: string | null
          leads_baseline?: number | null
          login_email?: string
          login_password?: string
          logo_url?: string | null
          mrr?: number | null
          niche?: string
          plan?: string
          services?: Json | null
          start_date?: string | null
          status?: string
        }
        Relationships: []
      }
      content_posts: {
        Row: {
          caption: string | null
          client_feedback: string | null
          client_id: string
          created_at: string | null
          hashtags: string | null
          id: string
          image_url: string | null
          platform: string
          published_at: string | null
          scheduled_at: string | null
          status: string
        }
        Insert: {
          caption?: string | null
          client_feedback?: string | null
          client_id: string
          created_at?: string | null
          hashtags?: string | null
          id?: string
          image_url?: string | null
          platform?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
        }
        Update: {
          caption?: string | null
          client_feedback?: string | null
          client_id?: string
          created_at?: string | null
          hashtags?: string | null
          id?: string
          image_url?: string | null
          platform?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosticos: {
        Row: {
          contactado: boolean | null
          created_at: string | null
          diagnostico_json: Json | null
          email: string
          id: string
          instagram_url: string
          nome: string
          score: number | null
          setor: string | null
          site_url: string | null
        }
        Insert: {
          contactado?: boolean | null
          created_at?: string | null
          diagnostico_json?: Json | null
          email: string
          id?: string
          instagram_url: string
          nome: string
          score?: number | null
          setor?: string | null
          site_url?: string | null
        }
        Update: {
          contactado?: boolean | null
          created_at?: string | null
          diagnostico_json?: Json | null
          email?: string
          id?: string
          instagram_url?: string
          nome?: string
          score?: number | null
          setor?: string | null
          site_url?: string | null
        }
        Relationships: []
      }
      metrics: {
        Row: {
          bot_conversations: number | null
          client_id: string
          created_at: string | null
          date: string
          facebook_followers: number | null
          health_score: number | null
          id: string
          instagram_followers: number | null
          leads_count: number | null
          posts_published: number | null
        }
        Insert: {
          bot_conversations?: number | null
          client_id: string
          created_at?: string | null
          date?: string
          facebook_followers?: number | null
          health_score?: number | null
          id?: string
          instagram_followers?: number | null
          leads_count?: number | null
          posts_published?: number | null
        }
        Update: {
          bot_conversations?: number | null
          client_id?: string
          created_at?: string | null
          date?: string
          facebook_followers?: number | null
          health_score?: number | null
          id?: string
          instagram_followers?: number | null
          leads_count?: number | null
          posts_published?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
