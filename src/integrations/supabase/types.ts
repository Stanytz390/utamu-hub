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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          created_at: string
          delta_sq: number
          id: string
          kind: Database["public"]["Enums"]["coin_txn_kind"]
          note: string | null
          ref_id: string | null
          status: Database["public"]["Enums"]["coin_txn_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          delta_sq: number
          id?: string
          kind: Database["public"]["Enums"]["coin_txn_kind"]
          note?: string | null
          ref_id?: string | null
          status?: Database["public"]["Enums"]["coin_txn_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          delta_sq?: number
          id?: string
          kind?: Database["public"]["Enums"]["coin_txn_kind"]
          note?: string | null
          ref_id?: string | null
          status?: Database["public"]["Enums"]["coin_txn_status"]
          user_id?: string
        }
        Relationships: []
      }
      coin_wallets: {
        Row: {
          balance_sq: number
          created_at: string
          total_earned_sq: number
          total_spent_sq: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_sq?: number
          created_at?: string
          total_earned_sq?: number
          total_spent_sq?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_sq?: number
          created_at?: string
          total_earned_sq?: number
          total_spent_sq?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dadaz_contact_unlocks: {
        Row: {
          cost_sq: number
          created_at: string
          dadaz_id: string
          id: string
          user_id: string
        }
        Insert: {
          cost_sq: number
          created_at?: string
          dadaz_id: string
          id?: string
          user_id: string
        }
        Update: {
          cost_sq?: number
          created_at?: string
          dadaz_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dadaz_contact_unlocks_dadaz_id_fkey"
            columns: ["dadaz_id"]
            isOneToOne: false
            referencedRelation: "dadaz_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dadaz_follows: {
        Row: {
          created_at: string
          dadaz_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dadaz_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          dadaz_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dadaz_follows_dadaz_id_fkey"
            columns: ["dadaz_id"]
            isOneToOne: false
            referencedRelation: "dadaz_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dadaz_likes: {
        Row: {
          created_at: string
          dadaz_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dadaz_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          dadaz_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dadaz_likes_dadaz_id_fkey"
            columns: ["dadaz_id"]
            isOneToOne: false
            referencedRelation: "dadaz_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dadaz_photos: {
        Row: {
          created_at: string
          dadaz_id: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          dadaz_id: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          dadaz_id?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "dadaz_photos_dadaz_id_fkey"
            columns: ["dadaz_id"]
            isOneToOne: false
            referencedRelation: "dadaz_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dadaz_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          contact_reveal_cost_sq: number
          cover_url: string | null
          created_at: string
          followers_count: number
          id: string
          is_admin_approved: boolean
          is_published: boolean
          likes_count: number
          location: string | null
          owner_id: string
          phone: string | null
          price_label: string | null
          price_tsh: number | null
          services: string | null
          status: Database["public"]["Enums"]["dadaz_status"]
          updated_at: string
          username: string
          whatsapp: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          contact_reveal_cost_sq?: number
          cover_url?: string | null
          created_at?: string
          followers_count?: number
          id?: string
          is_admin_approved?: boolean
          is_published?: boolean
          likes_count?: number
          location?: string | null
          owner_id: string
          phone?: string | null
          price_label?: string | null
          price_tsh?: number | null
          services?: string | null
          status?: Database["public"]["Enums"]["dadaz_status"]
          updated_at?: string
          username: string
          whatsapp?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          contact_reveal_cost_sq?: number
          cover_url?: string | null
          created_at?: string
          followers_count?: number
          id?: string
          is_admin_approved?: boolean
          is_published?: boolean
          likes_count?: number
          location?: string | null
          owner_id?: string
          phone?: string | null
          price_label?: string | null
          price_tsh?: number | null
          services?: string | null
          status?: Database["public"]["Enums"]["dadaz_status"]
          updated_at?: string
          username?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      groups: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean
          link: string
          logo_url: string | null
          members: number
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          link: string
          logo_url?: string | null
          members?: number
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          link?: string
          logo_url?: string | null
          members?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_tsh: number
          created_at: string
          id: string
          network: Database["public"]["Enums"]["payment_network"]
          phone: string
          provider_ref: string | null
          raw_response: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          amount_tsh: number
          created_at?: string
          id?: string
          network: Database["public"]["Enums"]["payment_network"]
          phone: string
          provider_ref?: string | null
          raw_response?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          amount_tsh?: number
          created_at?: string
          id?: string
          network?: Database["public"]["Enums"]["payment_network"]
          phone?: string
          provider_ref?: string | null
          raw_response?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      promo_banners: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          granted_at: string
          id: string
          payment_id: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          payment_id?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          payment_id?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      redeem_claims: {
        Row: {
          coins_sq: number
          created_at: string
          id: string
          link_id: string
          user_id: string
        }
        Insert: {
          coins_sq: number
          created_at?: string
          id?: string
          link_id: string
          user_id: string
        }
        Update: {
          coins_sq?: number
          created_at?: string
          id?: string
          link_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redeem_claims_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "redeem_links"
            referencedColumns: ["id"]
          },
        ]
      }
      redeem_links: {
        Row: {
          code: string
          coins_sq: number
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          note: string | null
          uses_count: number
        }
        Insert: {
          code: string
          coins_sq: number
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          note?: string | null
          uses_count?: number
        }
        Update: {
          code?: string
          coins_sq?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          note?: string | null
          uses_count?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          invitee_id: string
          inviter_id: string
          rewarded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_id: string
          inviter_id: string
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          rewarded_at?: string | null
          status?: string
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
      videos: {
        Row: {
          category_id: string | null
          created_at: string
          creator: string | null
          description: string | null
          duration: string | null
          id: string
          is_published: boolean
          price_sq: number
          price_tsh: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          video_url: string
          views_count: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          creator?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_published?: boolean
          price_sq?: number
          price_tsh?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          video_url: string
          views_count?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          creator?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_published?: boolean
          price_sq?: number
          price_tsh?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          video_url?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_redeem_link: {
        Args: { _code: string; _user_id: string }
        Returns: {
          coins_credited: number
          message: string
        }[]
      }
      credit_coins: {
        Args: {
          _amount: number
          _kind: Database["public"]["Enums"]["coin_txn_kind"]
          _note: string
          _ref_id: string
          _user_id: string
        }
        Returns: string
      }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      spend_coins: {
        Args: {
          _amount: number
          _kind: Database["public"]["Enums"]["coin_txn_kind"]
          _note: string
          _ref_id: string
          _user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "business" | "user"
      coin_txn_kind:
        | "topup"
        | "purchase"
        | "gift"
        | "referral"
        | "redeem"
        | "refund"
        | "admin_adjust"
      coin_txn_status: "pending" | "success" | "failed"
      dadaz_status: "free" | "work" | "service"
      payment_network: "halopesa" | "mixx" | "mpesa" | "airtel"
      payment_status: "pending" | "success" | "failed" | "cancelled"
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
      app_role: ["admin", "business", "user"],
      coin_txn_kind: [
        "topup",
        "purchase",
        "gift",
        "referral",
        "redeem",
        "refund",
        "admin_adjust",
      ],
      coin_txn_status: ["pending", "success", "failed"],
      dadaz_status: ["free", "work", "service"],
      payment_network: ["halopesa", "mixx", "mpesa", "airtel"],
      payment_status: ["pending", "success", "failed", "cancelled"],
    },
  },
} as const
