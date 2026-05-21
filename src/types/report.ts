export interface MonthlyRow {
  month: string;         // "2025-01"
  month_label: string;   // "Jan 2025"
  new_customers: number;
  returning_customers: number;
  retention_rate: number;
  total_visits: number;
  total_spend_eur: number;
  avg_spend_per_visit: number;
  redemptions: number;
  churn_count: number;
  churn_rate: number;
}

export interface DailyRow {
  date: string;          // "2025-01-15"
  day_of_week: string;   // "Monday"
  total_visits: number;
  new_customers: number;
  returning_customers: number;
  total_spend_eur: number;
  redemptions: number;
  retention_rate: number;
  is_weekend: boolean;
}

export interface CampaignRow {
  id: string;
  name: string;
  campaign_type: string;
  reward_description: string;
  start_date: string;
  status: string;
  enrolled: number;
  redeemed: number;
  completion_rate: number;
  points_issued: number;
  est_value_eur: number;
}

export interface ReportKPIs {
  total_active_customers: number;
  total_redemptions: number;
  avg_spend_per_visit: number;
  avg_retention_rate: number;
}

export interface ReportMeta {
  merchant_name: string;
  generated_at: string;
  period_start: string;
  period_end: string;
}

export interface ReportData {
  kpis: ReportKPIs;
  monthly: MonthlyRow[];
  daily: DailyRow[];
  campaigns: CampaignRow[];
  meta: ReportMeta;
}
