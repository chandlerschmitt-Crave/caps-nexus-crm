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
  project_id: z.string().uuid('Please select a project'),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PropertyForm({ onSuccess, onCancel }: PropertyFormProps) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
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
      project_id: '',
    },
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .order('name');
    setProjects(data || []);
  };

  const onSubmit = async (values: PropertyFormValues) => {
    setLoading(true);
    try {
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
        project_id: values.project_id,
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
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
