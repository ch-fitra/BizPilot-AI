-- Migration to create the CRM Leads table for BizPilot AI Lead management
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
    lead_name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    email TEXT,
    source TEXT,
    notes TEXT,
    pipeline_stage TEXT NOT NULL DEFAULT 'New Lead' CHECK (pipeline_stage IN ('New Lead', 'Contacted', 'Qualified', 'Negotiation', 'Won', 'Lost')),
    estimated_value NUMERIC NOT NULL DEFAULT 0,
    lead_score INTEGER NOT NULL DEFAULT 50 CHECK (lead_score >= 0 AND lead_score <= 100),
    interest_level TEXT NOT NULL DEFAULT 'Warm' CHECK (interest_level IN ('Cold', 'Warm', 'Hot')),
    tags JSONB,
    next_follow_up TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimize lead access by performance stage and scoring tier
CREATE INDEX IF NOT EXISTS idx_crm_leads_business_id ON crm_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_pipeline_stage ON crm_leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_lead_score ON crm_leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_next_follow_up ON crm_leads(next_follow_up ASC);
