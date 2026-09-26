-- Run once in the Supabase SQL editor for existing databases.
-- (New installs get these columns from supabase_setup.sql.)
-- Closing Bank uses the existing bank_balance column; Qty Sold uses the existing quantity column.
ALTER TABLE daily_sales
    ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS margin NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cash_sales NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bank_sales NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS upi_sales NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS loyalty NUMERIC(12,2) DEFAULT 0;
