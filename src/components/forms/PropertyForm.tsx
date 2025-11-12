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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const propertySchema = z.object({
  address: z.string().trim().min(1, 'Address is required').max(200),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().length(2, 'State must be 2-letter code (e.g., CA, TX)'),
  apn: z.string().trim().max(50).optional().or(z.literal('')),
  land_cost: z.string().optional(),
  construction_budget: z.string().optional(),
  total_cost: z.string().optional(),
  target_resale_value: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  project_name: z.string().trim().min(1, 'Project name is required').max(200),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PropertyForm({ onSuccess, onCancel }: PropertyFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      address: '',
      city: '',
      state: '',
      apn: '',
      land_cost: '',
      construction_budget: '',
      total_cost: '',
      target_resale_value: '',
      status: 'Sourcing',
      project_name: '',
    },
  });

  const onSubmit = async (values: PropertyFormValues) => {
    setLoading(true);
    try {
      // Find or create project
      let projectId: string;
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .ilike('name', values.project_name)
        .single();

      if (existingProject) {
        projectId = existingProject.id;
      } else {
        toast({
          title: 'Error',
          description: 'Project not found. Please create the project first.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const propertyData = {
        address: values.address,
        city: values.city,
        state: values.state.toUpperCase(),
        apn: values.apn || null,
        land_cost: values.land_cost ? parseFloat(values.land_cost) : null,
        construction_budget: values.construction_budget ? parseFloat(values.construction_budget) : null,
        total_cost: values.total_cost ? parseFloat(values.total_cost) : null,
        target_resale_value: values.target_resale_value ? parseFloat(values.target_resale_value) : null,
        status: values.status as any,
        project_id: projectId,
      };

      const { error } = await supabase.from('properties').insert([propertyData]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Property created successfully',
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City *</FormLabel>
                <FormControl>
                  <Input placeholder="Malibu" {...field} />
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
                  <Input placeholder="CA" maxLength={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="apn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>APN (Assessor Parcel Number)</FormLabel>
              <FormControl>
                <Input placeholder="4467-001-023" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="project_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Malibu Phoenix Fund" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Sourcing">Sourcing</SelectItem>
                  <SelectItem value="Under_Contract">Under Contract</SelectItem>
                  <SelectItem value="Owned">Owned</SelectItem>
                  <SelectItem value="In_Development">In Development</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="land_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Land Cost ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="5000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="construction_budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Construction Budget ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="8000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="total_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Cost ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="13000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="target_resale_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Resale Value ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="18000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Property'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
