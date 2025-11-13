-- Add investor status field to accounts table
ALTER TABLE public.accounts
ADD COLUMN investor_status text DEFAULT 'In_Conversation';