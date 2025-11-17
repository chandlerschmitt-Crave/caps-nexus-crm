-- Add description field to tasks table for task details
ALTER TABLE public.tasks
ADD COLUMN description text;

-- Tasks already have RLS enabled with full access for authenticated users
-- No additional RLS changes needed