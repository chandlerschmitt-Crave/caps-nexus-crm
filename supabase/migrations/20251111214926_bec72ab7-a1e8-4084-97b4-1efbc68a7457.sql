-- Add communication_style field to contacts table
ALTER TABLE public.contacts 
ADD COLUMN communication_style text;

-- Add index for better query performance
CREATE INDEX idx_contacts_account_id ON public.contacts(account_id);

COMMENT ON COLUMN public.contacts.communication_style IS 'Preferred communication style and notes for this contact';