import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const contactSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  last_name: z.string().trim().min(1, 'Last name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  title: z.string().trim().max(100).optional().or(z.literal('')),
  linkedin_url: z.string().trim().url('Invalid LinkedIn URL').max(255).optional().or(z.literal('')),
  role: z.string().trim().max(100).optional().or(z.literal('')),
  communication_style: z.string().trim().max(500).optional().or(z.literal('')),
  account_name: z.string().trim().min(1, 'Company name is required').max(200),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contactId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ContactForm({ contactId, onSuccess, onCancel }: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      title: '',
      linkedin_url: '',
      role: '',
      communication_style: '',
      account_name: '',
    },
  });

  useEffect(() => {
    if (contactId) {
      loadContact();
    }
  }, [contactId]);

  const loadContact = async () => {
    if (!contactId) return;
    const { data } = await supabase
      .from('contacts')
      .select('*, accounts(name)')
      .eq('id', contactId)
      .single();
    
    if (data) {
      form.reset({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || '',
        phone: data.phone || '',
        title: data.title || '',
        linkedin_url: data.linkedin_url || '',
        role: data.role || '',
        communication_style: data.communication_style || '',
        account_name: (data.accounts as any)?.name || '',
      });
    }
  };

  const onSubmit = async (values: ContactFormValues) => {
    setLoading(true);
    try {
      // Find or create account
      let accountId: string;
      const { data: existingAccount } = await supabase
        .from('accounts')
        .select('id')
        .ilike('name', values.account_name)
        .single();

      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        const { data: newAccount, error: accountError } = await supabase
          .from('accounts')
          .insert([{ name: values.account_name, type_of_account: 'Investor' }])
          .select('id')
          .single();
        
        if (accountError) throw accountError;
        accountId = newAccount.id;
      }

      const contactData = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email || null,
        phone: values.phone || null,
        title: values.title || null,
        linkedin_url: values.linkedin_url || null,
        role: (values.role as any) || null,
        communication_style: values.communication_style || null,
        account_id: accountId,
      };

      let error;
      if (contactId) {
        ({ error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', contactId));
      } else {
        ({ error } = await supabase.from('contacts').insert([contactData]));
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Contact ${contactId ? 'updated' : 'created'} successfully`,
      });

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="account_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company/Firm *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., TerraQore, Goldman Sachs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1-555-123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Managing Partner" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Investor, LP, GP, Broker" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="linkedin_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn URL</FormLabel>
              <FormControl>
                <Input placeholder="https://linkedin.com/in/johndoe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="communication_style"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Communication Style & Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Prefers email, responds quickly, detail-oriented..."
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? (contactId ? 'Updating...' : 'Creating...') : (contactId ? 'Update Contact' : 'Create Contact')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
