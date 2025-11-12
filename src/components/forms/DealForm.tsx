import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

const dealSchema = z.object({
  name: z.string().trim().min(1, 'Deal name is required').max(200),
  account_name: z.string().trim().min(1, 'Account name is required'),
  amount_target: z.string().optional(),
  instrument: z.string().min(1, 'Instrument is required'),
  stage: z.string().min(1, 'Stage is required'),
  close_date: z.string().optional(),
  probability: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealFormProps {
  projectId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DealForm({ projectId, onSuccess, onCancel }: DealFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: '',
      account_name: '',
      amount_target: '',
      instrument: 'Equity',
      stage: 'Sourcing',
      close_date: '',
      probability: '',
      source: '',
      notes: '',
    },
  });

  const onSubmit = async (values: DealFormValues) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

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
          .insert([{ name: values.account_name, type_of_account: 'Partner' }])
          .select('id')
          .single();

        if (accountError) throw accountError;
        accountId = newAccount.id;
      }

      const dealData = {
        name: values.name,
        account_id: accountId,
        project_id: projectId || null,
        amount_target: values.amount_target ? parseFloat(values.amount_target) : null,
        instrument: values.instrument as any,
        stage: values.stage as any,
        close_date: values.close_date || null,
        probability: values.probability ? parseInt(values.probability) : null,
        source: values.source || null,
        notes: values.notes || null,
        owner_user_id: user?.id || null,
      };

      const { error } = await supabase.from('deals').insert([dealData]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Deal created successfully',
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deal Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Series A Financing" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="account_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Venture Capital Partners" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="instrument"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instrument *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Equity">Equity</SelectItem>
                    <SelectItem value="Debt">Debt</SelectItem>
                    <SelectItem value="Seller_Carry">Seller Carry</SelectItem>
                    <SelectItem value="SAFE">SAFE</SelectItem>
                    <SelectItem value="Rev_Share">Rev Share</SelectItem>
                    <SelectItem value="Token">Token</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Sourcing">Sourcing</SelectItem>
                    <SelectItem value="Prospecting">Prospecting</SelectItem>
                    <SelectItem value="Intro">Intro</SelectItem>
                    <SelectItem value="Diligence">Diligence</SelectItem>
                    <SelectItem value="LOI_Out">LOI Out</SelectItem>
                    <SelectItem value="Negotiation">Negotiation</SelectItem>
                    <SelectItem value="Docs">Docs</SelectItem>
                    <SelectItem value="Closed_Won">Closed Won</SelectItem>
                    <SelectItem value="Closed_Lost">Closed Lost</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount_target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount Target ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="5000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="probability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Probability (%)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="100" placeholder="75" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="close_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Close Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Referral, Cold Outreach" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes..." {...field} />
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
            {loading ? 'Creating...' : 'Create Deal'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
