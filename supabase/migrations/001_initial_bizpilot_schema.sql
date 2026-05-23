-- Migration to create Initial BizPilot schema with Business Profile and Analysis History
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Business Profiles Table
CREATE TABLE IF NOT EXISTS business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    business_type TEXT,
    owner_name TEXT,
    location TEXT,
    currency TEXT DEFAULT 'IDR',
    phone TEXT,
    email TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Analysis Histories Table
CREATE TABLE IF NOT EXISTS analysis_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
    input_source TEXT,
    uploaded_file_name TEXT,
    raw_input_summary TEXT,
    ai_result JSONB NOT NULL,
    health_score INTEGER,
    total_sales NUMERIC,
    total_transactions INTEGER,
    top_products JSONB,
    inventory_alerts JSONB,
    customer_sentiment JSONB,
    action_plan JSONB,
    risk_level TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Business Settings Table (Optional but highly beneficial)
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, setting_key)
);

-- Create Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_analysis_histories_business_id ON analysis_histories(business_id);
CREATE INDEX IF NOT EXISTS idx_analysis_histories_created_at ON analysis_histories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_settings_business_id ON business_settings(business_id);

-- Create simple automatic update mechanism for updated_at fields
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_profiles_modtime
    BEFORE UPDATE ON business_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_analysis_histories_modtime
    BEFORE UPDATE ON analysis_histories
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_business_settings_modtime
    BEFORE UPDATE ON business_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
