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
      ad_metrics: {
        Row: {
          clicks: number | null
          client_id: string
          conversions: number | null
          cost_per_conversion: number | null
          cost_per_message: number | null
          created_at: string
          date: string
          id: string
          impressions: number | null
          messages_started: number | null
          spend: number | null
          updated_at: string
        }
        Insert: {
          clicks?: number | null
          client_id: string
          conversions?: number | null
          cost_per_conversion?: number | null
          cost_per_message?: number | null
          created_at?: string
          date: string
          id?: string
          impressions?: number | null
          messages_started?: number | null
          spend?: number | null
          updated_at?: string
        }
        Update: {
          clicks?: number | null
          client_id?: string
          conversions?: number | null
          cost_per_conversion?: number | null
          cost_per_message?: number | null
          created_at?: string
          date?: string
          id?: string
          impressions?: number | null
          messages_started?: number | null
          spend?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          client_id: string
          created_at: string
          generated_at: string
          id: string
          period_end: string | null
          period_start: string | null
          recommendations: Json | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          generated_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          recommendations?: Json | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          generated_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          recommendations?: Json | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          audit_json: Json | null
          business_name: string | null
          business_type: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          score: number | null
          url: string | null
        }
        Insert: {
          audit_json?: Json | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          score?: number | null
          url?: string | null
        }
        Update: {
          audit_json?: Json | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          score?: number | null
          url?: string | null
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          actions: Json
          client_id: string | null
          config: Json
          created_at: string
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          organization_id: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          client_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          organization_id: string
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          client_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          organization_id?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          message: string | null
          organization_id: string
          payload: Json
          rule_id: string | null
          status: string
          trigger_type: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          organization_id: string
          payload?: Json
          rule_id?: string | null
          status?: string
          trigger_type: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          organization_id?: string
          payload?: Json
          rule_id?: string | null
          status?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
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
      client_integrations: {
        Row: {
          auto_sync: boolean
          backoff_until: string | null
          client_id: string
          config: Json
          created_at: string
          display_name: string | null
          external_account_id: string | null
          failure_count: number
          id: string
          last_error: string | null
          last_sync_at: string | null
          next_sync_at: string
          organization_id: string
          provider: string
          status: string
          sync_interval_minutes: number
          updated_at: string
        }
        Insert: {
          auto_sync?: boolean
          backoff_until?: string | null
          client_id: string
          config?: Json
          created_at?: string
          display_name?: string | null
          external_account_id?: string | null
          failure_count?: number
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          next_sync_at?: string
          organization_id: string
          provider: string
          status?: string
          sync_interval_minutes?: number
          updated_at?: string
        }
        Update: {
          auto_sync?: boolean
          backoff_until?: string | null
          client_id?: string
          config?: Json
          created_at?: string
          display_name?: string | null
          external_account_id?: string | null
          failure_count?: number
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          next_sync_at?: string
          organization_id?: string
          provider?: string
          status?: string
          sync_interval_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_integrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_memory: {
        Row: {
          audience: string | null
          city: string | null
          client_id: string
          competitors: Json
          created_at: string
          goals: string | null
          history: string | null
          id: string
          kpis: Json
          niche: string | null
          offers: string | null
          organization_id: string
          tone: string | null
          updated_at: string
        }
        Insert: {
          audience?: string | null
          city?: string | null
          client_id: string
          competitors?: Json
          created_at?: string
          goals?: string | null
          history?: string | null
          id?: string
          kpis?: Json
          niche?: string | null
          offers?: string | null
          organization_id: string
          tone?: string | null
          updated_at?: string
        }
        Update: {
          audience?: string | null
          city?: string | null
          client_id?: string
          competitors?: Json
          created_at?: string
          goals?: string | null
          history?: string | null
          id?: string
          kpis?: Json
          niche?: string | null
          offers?: string | null
          organization_id?: string
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_memory_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_memory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      client_reports: {
        Row: {
          actions: Json
          client_id: string
          created_at: string
          highlights: Json
          id: string
          organization_id: string
          period_end: string | null
          period_start: string | null
          risks: Json
          source: string
          summary: string | null
        }
        Insert: {
          actions?: Json
          client_id: string
          created_at?: string
          highlights?: Json
          id?: string
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          risks?: Json
          source?: string
          summary?: string | null
        }
        Update: {
          actions?: Json
          client_id?: string
          created_at?: string
          highlights?: Json
          id?: string
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          risks?: Json
          source?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          industry: string | null
          instagram_baseline: number | null
          instagram_handle: string | null
          internal_notes: string | null
          leads_baseline: number | null
          login_email: string
          login_password: string
          logo_url: string | null
          meta_ad_account_id: string | null
          mrr: number | null
          niche: string
          organization_id: string
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
          industry?: string | null
          instagram_baseline?: number | null
          instagram_handle?: string | null
          internal_notes?: string | null
          leads_baseline?: number | null
          login_email: string
          login_password: string
          logo_url?: string | null
          meta_ad_account_id?: string | null
          mrr?: number | null
          niche?: string
          organization_id: string
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
          industry?: string | null
          instagram_baseline?: number | null
          instagram_handle?: string | null
          internal_notes?: string | null
          leads_baseline?: number | null
          login_email?: string
          login_password?: string
          logo_url?: string | null
          meta_ad_account_id?: string | null
          mrr?: number | null
          niche?: string
          organization_id?: string
          plan?: string
          services?: Json | null
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      instagram_metrics: {
        Row: {
          client_id: string
          created_at: string
          date: string
          engagement_rate: number | null
          followers_count: number | null
          followers_gained: number | null
          id: string
          profile_visits: number | null
          reach: number | null
          updated_at: string
          website_clicks: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          date: string
          engagement_rate?: number | null
          followers_count?: number | null
          followers_gained?: number | null
          id?: string
          profile_visits?: number | null
          reach?: number | null
          updated_at?: string
          website_clicks?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          engagement_rate?: number | null
          followers_count?: number | null
          followers_gained?: number | null
          id?: string
          profile_visits?: number | null
          reach?: number | null
          updated_at?: string
          website_clicks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_credentials: {
        Row: {
          integration_id: string
          secrets: Json
          updated_at: string
        }
        Insert: {
          integration_id: string
          secrets?: Json
          updated_at?: string
        }
        Update: {
          integration_id?: string
          secrets?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_credentials_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: true
            referencedRelation: "client_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_runs: {
        Row: {
          client_id: string
          created_at: string
          duration_ms: number | null
          id: string
          integration_id: string
          message: string | null
          provider: string
          records_written: number
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          integration_id: string
          message?: string | null
          provider: string
          records_written?: number
          status: string
        }
        Update: {
          client_id?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          integration_id?: string
          message?: string | null
          provider?: string
          records_written?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_runs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_runs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "client_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          monthly_loss: number | null
          nome: string | null
          source: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          monthly_loss?: number | null
          nome?: string | null
          source?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          monthly_loss?: number | null
          nome?: string | null
          source?: string | null
          telefone?: string | null
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
      notifications: {
        Row: {
          category: string
          client_id: string | null
          created_at: string
          dedupe_key: string | null
          detail: string | null
          href: string | null
          id: string
          organization_id: string
          read_at: string | null
          severity: string
          title: string
        }
        Insert: {
          category: string
          client_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          detail?: string | null
          href?: string | null
          id?: string
          organization_id: string
          read_at?: string | null
          severity?: string
          title: string
        }
        Update: {
          category?: string
          client_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          detail?: string | null
          href?: string | null
          id?: string
          organization_id?: string
          read_at?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_leads: {
        Row: {
          business_name: string
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          next_action: string | null
          notes: string | null
          phone: string | null
          plan_value: number | null
          score: number | null
          stage: string | null
          updated_at: string | null
        }
        Insert: {
          business_name: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          next_action?: string | null
          notes?: string | null
          phone?: string | null
          plan_value?: number | null
          score?: number | null
          stage?: string | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          next_action?: string | null
          notes?: string | null
          phone?: string | null
          plan_value?: number | null
          score?: number | null
          stage?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      plan_requests: {
        Row: {
          business_name: string | null
          business_type: string | null
          created_at: string | null
          email: string | null
          id: string
          nome: string | null
          plan_text: string | null
          problems: string[] | null
          revenue_range: string | null
          telefone: string | null
        }
        Insert: {
          business_name?: string | null
          business_type?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          plan_text?: string | null
          problems?: string[] | null
          revenue_range?: string | null
          telefone?: string | null
        }
        Update: {
          business_name?: string | null
          business_type?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          plan_text?: string | null
          problems?: string[] | null
          revenue_range?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      post_metrics: {
        Row: {
          client_id: string
          comments: number | null
          created_at: string
          id: string
          likes: number | null
          post_type: string | null
          posted_at: string | null
          reach: number | null
          saves: number | null
          script_structure: string | null
          shares: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          comments?: number | null
          created_at?: string
          id?: string
          likes?: number | null
          post_type?: string | null
          posted_at?: string | null
          reach?: number | null
          saves?: number | null
          script_structure?: string | null
          shares?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          comments?: number | null
          created_at?: string
          id?: string
          likes?: number | null
          post_type?: string | null
          posted_at?: string | null
          reach?: number | null
          saves?: number | null
          script_structure?: string | null
          shares?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          active: boolean
          avatar_url: string | null
          company: string | null
          created_at: string
          display_order: number
          id: string
          name: string
          quote: string
          rating: number
          role: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name: string
          quote: string
          rating?: number
          role?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          quote?: string
          rating?: number
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_agents: {
        Row: {
          agent_name: string
          booking_link: string | null
          business_description: string | null
          client_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          phone_number: string | null
          services_info: string | null
          system_prompt: string | null
          total_conversations: number | null
          total_messages: number | null
          twilio_number: string | null
          working_hours: string | null
        }
        Insert: {
          agent_name?: string
          booking_link?: string | null
          business_description?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number?: string | null
          services_info?: string | null
          system_prompt?: string | null
          total_conversations?: number | null
          total_messages?: number | null
          twilio_number?: string | null
          working_hours?: string | null
        }
        Update: {
          agent_name?: string
          booking_link?: string | null
          business_description?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number?: string | null
          services_info?: string | null
          system_prompt?: string | null
          total_conversations?: number | null
          total_messages?: number | null
          twilio_number?: string | null
          working_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_agents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversation_state: {
        Row: {
          agent_id: string
          history: Json | null
          id: string
          last_updated: string | null
          phone_number: string
        }
        Insert: {
          agent_id: string
          history?: Json | null
          id?: string
          last_updated?: string | null
          phone_number: string
        }
        Update: {
          agent_id?: string
          history?: Json | null
          id?: string
          last_updated?: string | null
          phone_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversation_state_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          agent_id: string | null
          classification_summary: string | null
          client_id: string
          contact_name: string | null
          contact_phone: string
          contact_type: string | null
          first_message: string | null
          id: string
          is_read: boolean | null
          last_message: string | null
          last_message_at: string | null
          lead_status: string | null
          messages_count: number | null
          primary_need: string | null
          sentiment: string | null
          started_at: string | null
          status: string | null
          tags: string[] | null
          urgency: string | null
        }
        Insert: {
          agent_id?: string | null
          classification_summary?: string | null
          client_id: string
          contact_name?: string | null
          contact_phone: string
          contact_type?: string | null
          first_message?: string | null
          id?: string
          is_read?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          lead_status?: string | null
          messages_count?: number | null
          primary_need?: string | null
          sentiment?: string | null
          started_at?: string | null
          status?: string | null
          tags?: string[] | null
          urgency?: string | null
        }
        Update: {
          agent_id?: string | null
          classification_summary?: string | null
          client_id?: string
          contact_name?: string | null
          contact_phone?: string
          contact_type?: string | null
          first_message?: string | null
          id?: string
          is_read?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          lead_status?: string | null
          messages_count?: number | null
          primary_need?: string | null
          sentiment?: string | null
          started_at?: string | null
          status?: string | null
          tags?: string[] | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          client_id: string
          content: string
          conversation_id: string
          id: string
          is_read: boolean | null
          sender: string
          timestamp: string | null
        }
        Insert: {
          client_id: string
          content: string
          conversation_id: string
          id?: string
          is_read?: boolean | null
          sender?: string
          timestamp?: string | null
        }
        Update: {
          client_id?: string
          content?: string
          conversation_id?: string
          id?: string
          is_read?: boolean | null
          sender?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
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
      is_org_member: { Args: { _org: string }; Returns: boolean }
      verify_client_password: {
        Args: { _plain_password: string; _stored_hash: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
