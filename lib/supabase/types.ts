export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string;
          description: string;
          facility_id: string | null;
          id: string;
          module_name: string;
          organization_id: string;
          owner_name: string;
          severity: "low" | "medium" | "high" | "critical";
          status: "new" | "acknowledged" | "resolved";
          title: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          facility_id?: string | null;
          id?: string;
          module_name: string;
          organization_id: string;
          owner_name: string;
          severity: "low" | "medium" | "high" | "critical";
          status?: "new" | "acknowledged" | "resolved";
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
        Relationships: [];
      };
      clinical_metrics: {
        Row: {
          current_value: number;
          facility_id: string | null;
          id: string;
          metric_name: string;
          organization_id: string;
          target_value: number;
          trend_direction: "up" | "down" | "stable";
          unit: string;
        };
        Insert: {
          current_value: number;
          facility_id?: string | null;
          id?: string;
          metric_name: string;
          organization_id: string;
          target_value: number;
          trend_direction: "up" | "down" | "stable";
          unit: string;
        };
        Update: Partial<Database["public"]["Tables"]["clinical_metrics"]["Insert"]>;
        Relationships: [];
      };
      diagnoses: {
        Row: {
          code: string;
          description: string;
          id: string;
          patient_id: string;
        };
        Insert: {
          code: string;
          description: string;
          id?: string;
          patient_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["diagnoses"]["Insert"]>;
        Relationships: [];
      };
      facilities: {
        Row: {
          bed_count: number;
          city: string;
          facility_type: string;
          id: string;
          name: string;
          organization_id: string;
          state: string;
        };
        Insert: {
          bed_count: number;
          city: string;
          facility_type: string;
          id?: string;
          name: string;
          organization_id: string;
          state: string;
        };
        Update: Partial<Database["public"]["Tables"]["facilities"]["Insert"]>;
        Relationships: [];
      };
      financial_metrics: {
        Row: {
          current_display: string;
          facility_id: string | null;
          id: string;
          metric_name: string;
          note: string;
          organization_id: string;
          target_display: string;
        };
        Insert: {
          current_display: string;
          facility_id?: string | null;
          id?: string;
          metric_name: string;
          note: string;
          organization_id: string;
          target_display: string;
        };
        Update: Partial<Database["public"]["Tables"]["financial_metrics"]["Insert"]>;
        Relationships: [];
      };
      integration_connections: {
        Row: {
          category_name: string;
          id: string;
          last_sync_at: string;
          latency_minutes: number;
          organization_id: string;
          source_name: string;
          standard_name: string;
          status: "healthy" | "delayed" | "warning";
        };
        Insert: {
          category_name: string;
          id?: string;
          last_sync_at: string;
          latency_minutes: number;
          organization_id: string;
          source_name: string;
          standard_name: string;
          status: "healthy" | "delayed" | "warning";
        };
        Update: Partial<Database["public"]["Tables"]["integration_connections"]["Insert"]>;
        Relationships: [];
      };
      lab_results: {
        Row: {
          abnormal_flag: boolean;
          collected_at: string;
          id: string;
          patient_id: string;
          test_name: string;
          value_numeric: number;
        };
        Insert: {
          abnormal_flag?: boolean;
          collected_at: string;
          id?: string;
          patient_id: string;
          test_name: string;
          value_numeric: number;
        };
        Update: Partial<Database["public"]["Tables"]["lab_results"]["Insert"]>;
        Relationships: [];
      };
      organization_memberships: {
        Row: {
          default_facility_id: string | null;
          id: string;
          organization_id: string;
          role: "admin" | "executive" | "physician" | "analyst";
          user_id: string;
        };
        Insert: {
          default_facility_id?: string | null;
          id?: string;
          organization_id: string;
          role: "admin" | "executive" | "physician" | "analyst";
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["organization_memberships"]["Insert"]>;
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          payer_focus: string;
          plan_tier: "growth" | "professional" | "enterprise";
          slug: string;
        };
        Insert: {
          id?: string;
          name: string;
          payer_focus: string;
          plan_tier: "growth" | "professional" | "enterprise";
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      patients: {
        Row: {
          date_of_birth: string;
          facility_id: string;
          full_name: string;
          gender: string;
          id: string;
          organization_id: string;
          primary_condition: string;
          risk_level: "low" | "moderate" | "high";
        };
        Insert: {
          date_of_birth: string;
          facility_id: string;
          full_name: string;
          gender: string;
          id?: string;
          organization_id: string;
          primary_condition: string;
          risk_level: "low" | "moderate" | "high";
        };
        Update: Partial<Database["public"]["Tables"]["patients"]["Insert"]>;
        Relationships: [];
      };
      population_segments: {
        Row: {
          cohort_name: string;
          completion_rate: number;
          id: string;
          member_count: number;
          organization_id: string;
          risk_level: "low" | "moderate" | "high";
        };
        Insert: {
          cohort_name: string;
          completion_rate: number;
          id?: string;
          member_count: number;
          organization_id: string;
          risk_level: "low" | "moderate" | "high";
        };
        Update: Partial<Database["public"]["Tables"]["population_segments"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          full_name: string;
          id: string;
          title: string;
        };
        Insert: {
          full_name: string;
          id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      providers: {
        Row: {
          facility_id: string;
          full_name: string;
          id: string;
          npi: string;
          organization_id: string;
          specialty: string;
        };
        Insert: {
          facility_id: string;
          full_name: string;
          id?: string;
          npi: string;
          organization_id: string;
          specialty: string;
        };
        Update: Partial<Database["public"]["Tables"]["providers"]["Insert"]>;
        Relationships: [];
      };
      report_exports: {
        Row: {
          created_at: string;
          export_format: "pdf" | "csv" | "xlsx";
          id: string;
          organization_id: string;
          status: "ready" | "processing";
          storage_path: string | null;
          title: string;
        };
        Insert: {
          created_at?: string;
          export_format: "pdf" | "csv" | "xlsx";
          id?: string;
          organization_id: string;
          status: "ready" | "processing";
          storage_path?: string | null;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["report_exports"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
