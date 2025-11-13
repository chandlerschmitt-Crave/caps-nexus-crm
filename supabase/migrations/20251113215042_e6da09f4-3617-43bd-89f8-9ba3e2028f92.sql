-- Add investment tracking fields to accounts table
ALTER TABLE public.accounts
ADD COLUMN capital_invested numeric,
ADD COLUMN investment_type text,
ADD COLUMN investment_term text,
ADD COLUMN investment_rate text,
ADD COLUMN financing_type text;