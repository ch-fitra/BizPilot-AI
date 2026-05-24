-- Migration 007: Cashflow & Expense Entries for P&L Reporting
-- Enables manual income/expense tracking per business workspace

CREATE TABLE IF NOT EXISTS cashflow_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL DEFAULT 'other',
    -- Common expense categories: bahan_baku, gaji, sewa, listrik, transport, marketing, peralatan, lainnya
    -- Common income categories: penjualan, jasa, investasi, lainnya
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_id UUID, -- optional link to analysis_histories.id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OCR Nota scan results cache (optional but useful for history)
CREATE TABLE IF NOT EXISTS nota_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
    scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    vendor_name TEXT,
    nota_date DATE,
    items JSONB NOT NULL DEFAULT '[]',
    -- items: [{name: string, qty: number, unit_price: number, subtotal: number}]
    subtotal NUMERIC,
    tax_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC,
    raw_extracted_text TEXT,
    status TEXT NOT NULL DEFAULT 'reviewed' CHECK (status IN ('pending', 'reviewed', 'applied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_cashflow_entries_business_id ON cashflow_entries(business_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_entries_entry_date ON cashflow_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_cashflow_entries_type ON cashflow_entries(type);
CREATE INDEX IF NOT EXISTS idx_nota_scans_business_id ON nota_scans(business_id);
CREATE INDEX IF NOT EXISTS idx_nota_scans_scan_date ON nota_scans(scan_date DESC);

-- Auto-update trigger for cashflow_entries
CREATE OR REPLACE TRIGGER update_cashflow_entries_modtime
    BEFORE UPDATE ON cashflow_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
