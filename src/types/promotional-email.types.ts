/**
 * Promotional Email System Types
 * Based on backend implementation
 */

// Email Campaign Template
export interface EmailCampaignTemplate {
  id: number;
  name: string;
  slug: string;
  description: string;
  email_type: 'promotional' | 'reward' | 'announcement';
  required_fields: string[];
  optional_fields: string[];
  field_descriptions: Record<string, string>;
  category: 'general' | 'referral' | 'loyalty' | 'reward' | 'event';
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Promotional Email Campaign
export interface PromotionalEmailCampaign {
  id: number;
  template_id: number;
  created_by: number;
  campaign_name: string;
  campaign_description?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  template_data: Record<string, any>;
  target_criteria: TargetCriteria;
  target_user_count: number;
  scheduled_at?: string;
  sent_at?: string;
  sent_count: number;
  failed_count: number;
  opened_count: number;
  clicked_count: number;
  error_log?: string;
  created_at: string;
  updated_at: string;
  template?: EmailCampaignTemplate;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  success_rate?: number;
}

// Email Delivery Log
export interface PromotionalEmailLog {
  id: number;
  campaign_id: number;
  user_id: number;
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'opened' | 'clicked' | 'failed';
  email_address: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  click_link?: string;
  created_at: string;
  updated_at: string;
}

// Target Criteria
export interface TargetCriteria {
  type: 'all_users' | 'tier_level' | 'first_time_users' | 'inactive_users' | 'high_value_users';
  tier_id?: number;
  days?: number;
  min_transactions?: number;
}

// Campaign Statistics
export interface CampaignStatistics {
  total_recipients: number;
  total_sent: number;
  total_failed: number;
  total_opened: number;
  total_clicked: number;
  success_rate: number;
  open_rate: number;
  click_rate: number;
}

// Campaign Analytics Response
export interface CampaignAnalytics {
  stats: CampaignStatistics;
  logs: {
    data: PromotionalEmailLog[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

// Create Campaign Request
export interface CreateCampaignRequest {
  template_id: number;
  campaign_name: string;
  campaign_description?: string;
  template_data: Record<string, any>;
  target_criteria: TargetCriteria;
}

// Campaign Response with pagination
export interface CampaignListResponse {
  data: PromotionalEmailCampaign[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

// Template Response
export interface TemplateResponse {
  templates: EmailCampaignTemplate[];
  categories: string[];
}

// Send/Schedule Response
export interface SendCampaignResponse {
  message: string;
  campaign: PromotionalEmailCampaign;
}

// Preview Response
export interface PreviewResponse {
  html: string;
}

// Field Type
export type FieldType = 'text' | 'url' | 'textarea' | 'date' | 'array' | 'email' | 'number';

// Template Field Config
export interface TemplateFieldConfig {
  name: string;
  type: FieldType;
  required: boolean;
  description?: string;
  placeholder?: string;
  validation?: string;
}
