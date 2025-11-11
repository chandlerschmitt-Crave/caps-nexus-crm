-- Create emails table to store synced Gmail messages
CREATE TABLE public.emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gmail_message_id TEXT NOT NULL UNIQUE,
  gmail_thread_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[],
  bcc_emails TEXT[],
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_sent BOOLEAN NOT NULL DEFAULT false,
  has_attachments BOOLEAN NOT NULL DEFAULT false
);

-- Add indexes for performance
CREATE INDEX idx_emails_contact_id ON public.emails(contact_id);
CREATE INDEX idx_emails_gmail_thread_id ON public.emails(gmail_thread_id);
CREATE INDEX idx_emails_sent_at ON public.emails(sent_at DESC);
CREATE INDEX idx_emails_from_email ON public.emails(from_email);

-- Enable Row Level Security
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Create policies for email access
CREATE POLICY "All authenticated users can view emails" 
ON public.emails 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "All authenticated users can insert emails" 
ON public.emails 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "All authenticated users can update emails" 
ON public.emails 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Admin users can delete emails" 
ON public.emails 
FOR DELETE 
USING (has_role(auth.uid(), 'Admin'::app_role));