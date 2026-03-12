
-- Table to store recap email configuration/preferences
CREATE TABLE public.recap_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  send_time TIME NOT NULL DEFAULT '17:00:00',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  excluded_project_ids UUID[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.recap_preferences ENABLE ROW LEVEL SECURITY;

-- Only admins can manage preferences
CREATE POLICY "Admins can manage recap preferences"
  ON public.recap_preferences FOR ALL
  USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Authenticated users can view recap preferences"
  ON public.recap_preferences FOR SELECT
  USING (auth.role() = 'authenticated');

-- Table to log sent recap emails
CREATE TABLE public.recap_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  subject TEXT NOT NULL,
  html_body TEXT,
  narrative TEXT,
  stats JSONB,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.recap_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage recap logs"
  ON public.recap_logs FOR ALL
  USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Authenticated users can view recap logs"
  ON public.recap_logs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Insert default preferences row
INSERT INTO public.recap_preferences (send_time, is_enabled) VALUES ('17:00:00', true);
