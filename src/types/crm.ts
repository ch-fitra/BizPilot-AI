export interface CRMLead {
  id: string;
  business_id?: string | null;
  lead_name: string;
  company_name?: string | null;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  notes?: string | null;
  pipeline_stage: 'New Lead' | 'Contacted' | 'Qualified' | 'Negotiation' | 'Won' | 'Lost';
  estimated_value: number;
  lead_score: number;
  interest_level: 'Cold' | 'Warm' | 'Hot';
  tags?: string[] | null;
  next_follow_up?: string | null;
  last_activity?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
  isOfflineDraft?: boolean;
  syncStatus?: 'pending' | 'syncing' | 'failed';
}

export interface CRMActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  notes: string;
  created_at: string;
  isOfflineDraft?: boolean;
}


export interface CRMDashboardStats {
  totalLeads: number;
  hotLeads: number;
  pendingFollowup: number;
  closedDeals: number;
  totalEstimatedRevenue: number;
  conversionRate: number;
  upcomingFollowup: number;
}

export interface CRMResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CRMDashboardResponse {
  success: boolean;
  stats: CRMDashboardStats;
  error?: string;
}
