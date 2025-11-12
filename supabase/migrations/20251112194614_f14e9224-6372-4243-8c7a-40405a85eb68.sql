-- Add new financial fields to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS purchase numeric,
ADD COLUMN IF NOT EXISTS construction_hard numeric,
ADD COLUMN IF NOT EXISTS softs numeric,
ADD COLUMN IF NOT EXISTS total_use_of_funds numeric,
ADD COLUMN IF NOT EXISTS arv numeric,
ADD COLUMN IF NOT EXISTS exit_costs numeric,
ADD COLUMN IF NOT EXISTS projected_profit numeric,
ADD COLUMN IF NOT EXISTS gross_margin numeric,
ADD COLUMN IF NOT EXISTS roi_on_uses numeric;