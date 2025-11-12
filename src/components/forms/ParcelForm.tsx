import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ParcelFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParcelFormData {
  name: string;
  apn: string;
  address: string;
  city: string;
  state: string;
  county: string;
  zip: string;
  acreage: string;
  asking_price: string;
  zoning_code: string;
  listing_url: string;
  prospect_notes: string;
}

export function ParcelForm({ open, onOpenChange, onSuccess }: ParcelFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<ParcelFormData>({
    defaultValues: {
      name: '',
      apn: '',
      address: '',
      city: '',
      state: '',
      county: '',
      zip: '',
      acreage: '',
      asking_price: '',
      zoning_code: '',
      listing_url: '',
      prospect_notes: '',
    },
  });

  const onSubmit = async (data: ParcelFormData) => {
    setLoading(true);
    try {
      // Insert parcel
      const { data: parcel, error: parcelError } = await supabase
        .from('parcels')
        .insert({
          name: data.name,
          apn: data.apn,
          address: data.address,
          city: data.city,
          state: data.state.toUpperCase(),
          county: data.county,
          zip: data.zip,
          acreage: data.acreage ? parseFloat(data.acreage) : null,
          asking_price: data.asking_price ? parseFloat(data.asking_price) : null,
          price_per_acre: data.acreage && data.asking_price 
            ? parseFloat(data.asking_price) / parseFloat(data.acreage) 
            : null,
          zoning_code: data.zoning_code,
          listing_url: data.listing_url,
          prospect_notes: data.prospect_notes,
          status: 'Prospecting',
          prospect_owner: user?.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (parcelError) throw parcelError;

      // Trigger enrichment
      await supabase.functions.invoke('enrich-parcel', {
        body: { parcel_id: parcel.id },
      });

      toast({
        title: 'Parcel created',
        description: 'Enrichment and scoring in progress...',
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
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
          <DialogTitle>Add Parcel</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parcel Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Lancaster TX 240MW Site" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="apn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>APN</FormLabel>
                    <FormControl>
                      <Input placeholder="123-456-789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acreage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Acreage</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="80" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="1234 Main St" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="Lancaster" {...field} required />
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
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="TX" maxLength={2} {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP</FormLabel>
                    <FormControl>
                      <Input placeholder="75134" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="county"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>County</FormLabel>
                    <FormControl>
                      <Input placeholder="Dallas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zoning_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zoning Code</FormLabel>
                    <FormControl>
                      <Input placeholder="M-2 (Industrial)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="asking_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asking Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="5000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="listing_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Listing URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="prospect_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prospect Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Key insights, contacts, next steps..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Parcel'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
