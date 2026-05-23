export interface ChatMessage {
  id: string;
  business_id?: string | null;
  analysis_id?: string | null;
  role: 'user' | 'assistant';
  content: string;
  context_snapshot?: {
    hasProfile: boolean;
    hasAnalysis: boolean;
    analysisId?: string | null;
  } | null;
  created_at: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  data: ChatMessage[];
  error?: string;
}

export interface ChatBusinessResponse {
  success: boolean;
  reply: string;
  sources: {
    hasProfile: boolean;
    hasAnalysis: boolean;
    analysisDate: string | null;
    analysisId: string | null;
  };
  suggested_next_questions: string[];
  created_at: string;
  error?: string;
}
