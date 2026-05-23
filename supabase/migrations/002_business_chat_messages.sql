-- Migration to create the Business Chat Messages table for custom AI UMKM Chat
CREATE TABLE IF NOT EXISTS business_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES analysis_histories(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    context_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimize message access by creation order and business profiling
CREATE INDEX IF NOT EXISTS idx_business_chat_messages_business_id ON business_chat_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_business_chat_messages_created_at ON business_chat_messages(created_at ASC);
