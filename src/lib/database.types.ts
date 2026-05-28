export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string;
          auth_user_id: string | null;
          name: string;
          email: string;
          role: string;
          avatar: string;
          department: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          name: string;
          email: string;
          role: string;
          avatar: string;
          department: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          name?: string;
          email?: string;
          role?: string;
          avatar?: string;
          department?: string;
          is_admin?: boolean;
        };
      };
      tasks: {
        Row: {
          id: string;
          name: string;
          description: string;
          owner: string;
          department: string;
          priority: string;
          status: string;
          deadline: string;
          notes: string;
          dependencies: string[];
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          owner: string;
          department: string;
          priority?: string;
          status?: string;
          deadline: string;
          notes?: string;
          dependencies?: string[];
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          owner?: string;
          department?: string;
          priority?: string;
          status?: string;
          deadline?: string;
          notes?: string;
          dependencies?: string[];
          tags?: string[];
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          user_name: string;
          action: string;
          task_id: string;
          task_name: string;
          details: string;
          department: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_name: string;
          action: string;
          task_id: string;
          task_name: string;
          details: string;
          department: string;
          created_at?: string;
        };
        Update: never;
      };
      whatsapp_config: {
        Row: {
          id: string;
          enabled: boolean;
          send_time: string;
          phone_number: string;
          group_name: string;
          twilio_account_sid: string;
          twilio_auth_token: string;
          twilio_from_number: string;
          last_sent: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          enabled?: boolean;
          send_time?: string;
          phone_number?: string;
          group_name?: string;
          twilio_account_sid?: string;
          twilio_auth_token?: string;
          twilio_from_number?: string;
        };
        Update: {
          enabled?: boolean;
          send_time?: string;
          phone_number?: string;
          group_name?: string;
          twilio_account_sid?: string;
          twilio_auth_token?: string;
          twilio_from_number?: string;
          last_sent?: string | null;
        };
      };
    };
  };
}
