import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface AccountFormData {
  name: string;
  type: 'DevCo' | 'HoldCo' | 'Fund' | 'Investor' | 'Lender' | 'Partner' | 'Agency';
  website?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  notes?: string;
}

export function AccountForm({ open, onOpenChange, onSuccess }: AccountFormProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<AccountFormData>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const accountType = watch('type');

  const onSubmit = async (data: AccountFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('accounts').insert([data]);

      if (error) throw error;

      toast({
        title: 'Account created',
        description: 'The account has been successfully added.',
      });
      
      reset();
      onSuccess();
      onOpenChange(false);
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                {...register('name', { required: true })}
                placeholder="e.g., TerraQore"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select onValueChange={(value) => setValue('type', value as AccountFormData['type'])} value={accountType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DevCo">DevCo</SelectItem>
                  <SelectItem value="HoldCo">HoldCo</SelectItem>
                  <SelectItem value="Fund">Fund</SelectItem>
                  <SelectItem value="Investor">Investor</SelectItem>
                  <SelectItem value="Lender">Lender</SelectItem>
                  <SelectItem value="Partner">Partner</SelectItem>
                  <SelectItem value="Agency">Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                {...register('website')}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Dallas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                {...register('state')}
                placeholder="TX"
                maxLength={2}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="USA"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional information..."
                rows={3}
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
      </DialogContent>
    </Dialog>
  );
}
