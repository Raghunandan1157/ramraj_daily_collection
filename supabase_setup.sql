-- =============================================
-- RAMRAJ DAILY COLLECTION - SUPABASE SCHEMA
-- =============================================

-- 1. Daily Sales Table
CREATE TABLE IF NOT EXISTS daily_sales (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    sales NUMERIC(12,2) DEFAULT 0,
    no_of_bills INTEGER DEFAULT 0,
    sales_returns NUMERIC(12,2) DEFAULT 0,
    net_sales NUMERIC(12,2) DEFAULT 0,
    closing_stock NUMERIC(14,2) DEFAULT 0,
    bank_balance NUMERIC(14,2) DEFAULT 0,
    orders_placed_amount NUMERIC(12,2) DEFAULT 0,
    salary_paid NUMERIC(12,2) DEFAULT 0,
    electricity_paid NUMERIC(12,2) DEFAULT 0,
    admin_expenses NUMERIC(12,2) DEFAULT 0,
    total_expenses NUMERIC(12,2) DEFAULT 0,
    -- Website-specific fields
    open_time TIME DEFAULT '09:30',
    close_time TIME DEFAULT '21:30',
    quantity INTEGER DEFAULT 0,
    atv NUMERIC(10,2) DEFAULT 0,
    upt NUMERIC(10,2) DEFAULT 0,
    asp NUMERIC(10,2) DEFAULT 0,
    cy_mtd_sale NUMERIC(14,2) DEFAULT 0,
    cy_mtd_avg_sale NUMERIC(14,2) DEFAULT 0,
    sales_trend NUMERIC(14,2) DEFAULT 0,
    target NUMERIC(14,2) DEFAULT 0,
    target_achievement NUMERIC(6,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Monthly Consolidated Table
CREATE TABLE IF NOT EXISTS monthly_consolidated (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    month DATE NOT NULL UNIQUE,
    no_of_days INTEGER DEFAULT 0,
    sales NUMERIC(14,2) DEFAULT 0,
    sales_return NUMERIC(14,2) DEFAULT 0,
    net_sales NUMERIC(14,2) DEFAULT 0,
    avg_sales_monthly NUMERIC(14,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_consolidated ENABLE ROW LEVEL SECURITY;

-- 4. Allow public read/write (for anon key usage)
CREATE POLICY "Allow all access to daily_sales" ON daily_sales
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to monthly_consolidated" ON monthly_consolidated
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_sales_updated_at
    BEFORE UPDATE ON daily_sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER monthly_consolidated_updated_at
    BEFORE UPDATE ON monthly_consolidated
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
