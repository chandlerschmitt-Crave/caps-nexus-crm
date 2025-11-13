import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const accountSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required').max(200),
  type_of_account: z.string().trim().max(100).optional().or(z.literal('')),
  website: z.string().trim().url('Invalid website URL').max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  city: z.string().trim().max(100).optional().or(z.literal('')),
  state: z.string().trim().length(2, 'State must be 2 characters').optional().or(z.literal('')),
  country: z.string().trim().max(100).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  capital_invested: z.string().trim().max(50).optional().or(z.literal('')),
  investment_type: z.string().trim().max(500).optional().or(z.literal('')),
  investment_term: z.string().trim().max(500).optional().or(z.literal('')),
  investment_rate: z.string().trim().max(500).optional().or(z.literal('')),
  financing_type: z.string().trim().max(500).optional().or(z.literal('')),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AccountForm({ open, onOpenChange, onSuccess }: AccountFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type_of_account: '',
      website: '',
      phone: '',
      city: '',
      state: '',
      country: '',
      notes: '',
      capital_invested: '',
      investment_type: '',
      investment_term: '',
      investment_rate: '',
      financing_type: '',
    },
  });

  const onSubmit = async (values: AccountFormValues) => {
    setLoading(true);
    try {
      const accountData = {
        name: values.name,
        type_of_account: values.type_of_account || null,
        website: values.website || null,
        phone: values.phone || null,
        city: values.city || null,
        state: values.state || null,
        country: values.country || null,
        notes: values.notes || null,
        capital_invested: values.capital_invested ? parseFloat(values.capital_invested) : null,
        investment_type: values.investment_type || null,
        investment_term: values.investment_term || null,
        investment_rate: values.investment_rate || null,
        financing_type: values.financing_type || null,
      };

      const { error } = await supabase.from('accounts').insert([accountData]);

      if (error) throw error;

      toast({
        title: 'Account created',
        description: 'The account has been successfully added.',
      });
      
      form.reset();
      onSuccess();
      onOpenChange(false);

      // Redirect to Investors page if it's an investor account
      if (values.type_of_account?.toLowerCase().includes('investor')) {
        window.location.href = '/investors';
      }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
          <DialogDescription>
            Create a new organization or partner account
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., TerraQore" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="type_of_account"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Account</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., DevCo, Investor, Lender" {...field} />
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
                      <Input placeholder="+1 (555) 000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Dallas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="TX" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="USA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="capital_invested"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capital Invested</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1000000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="investment_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Investment/Note</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Senior Secured Note, Preferred Equity..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="investment_term"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term of Investment</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., 24 months, 3 years..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="investment_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., 12% annual, LIBOR + 500bps..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="financing_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Financing</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Interest Only, Mezzanine Loan, Construction Loan..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional information..." rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
