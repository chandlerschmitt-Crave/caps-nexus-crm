-- Change accounts.type from enum to text field and rename to type_of_account
ALTER TABLE public.accounts 
DROP COLUMN type;

ALTER TABLE public.accounts 
ADD COLUMN type_of_account text;

-- Add a default value for existing rows
UPDATE public.accounts 
SET type_of_account = 'General' 
WHERE type_of_account IS NULL;