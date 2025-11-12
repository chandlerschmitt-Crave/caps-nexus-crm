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
  purchase: z.string().optional(),
  construction_hard: z.string().optional(),
  softs: z.string().optional(),
  total_use_of_funds: z.string().optional(),
  arv: z.string().optional(),
  exit_costs: z.string().optional(),
  projected_profit: z.string().optional(),
  gross_margin: z.string().optional(),
  roi_on_uses: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  project_name: z.string().trim().min(1, 'Project name is required').max(200),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  projectId?: string;
  projectName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PropertyForm({ projectId, projectName, onSuccess, onCancel }: PropertyFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      address: '',
      city: '',
      state: '',
      apn: '',
      purchase: '',
      construction_hard: '',
      softs: '',
      total_use_of_funds: '',
      arv: '',
      exit_costs: '',
      projected_profit: '',
      gross_margin: '',
      roi_on_uses: '',
      status: 'Sourcing',
      project_name: projectName || '',
    },
  });

  const onSubmit = async (values: PropertyFormValues) => {
    setLoading(true);
    try {
      // Use provided projectId or find project by name
      let finalProjectId: string;
      if (projectId) {
        finalProjectId = projectId;
      } else {
        const { data: existingProject } = await supabase
          .from('projects')
          .select('id')
          .ilike('name', values.project_name)
          .single();

        if (existingProject) {
          finalProjectId = existingProject.id;
        } else {
          toast({
            title: 'Error',
            description: 'Project not found. Please create the project first.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      const propertyData = {
        address: values.address,
        city: values.city,
        state: values.state.toUpperCase(),
        apn: values.apn || null,
        purchase: values.purchase ? parseFloat(values.purchase) : null,
        construction_hard: values.construction_hard ? parseFloat(values.construction_hard) : null,
        softs: values.softs ? parseFloat(values.softs) : null,
        total_use_of_funds: values.total_use_of_funds ? parseFloat(values.total_use_of_funds) : null,
        arv: values.arv ? parseFloat(values.arv) : null,
        exit_costs: values.exit_costs ? parseFloat(values.exit_costs) : null,
        projected_profit: values.projected_profit ? parseFloat(values.projected_profit) : null,
        gross_margin: values.gross_margin ? parseFloat(values.gross_margin) : null,
        roi_on_uses: values.roi_on_uses ? parseFloat(values.roi_on_uses) : null,
        status: values.status as any,
        project_id: finalProjectId,
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

        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold text-sm">Financial Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="purchase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="construction_hard"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Construction (Hard) ($)</FormLabel>
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
              name="softs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Softs ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="total_use_of_funds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Use of Funds ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="14000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="arv"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ARV ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="18000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exit_costs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exit Costs ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="500000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="projected_profit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projected Profit ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="3500000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gross_margin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gross Margin (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="25" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roi_on_uses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ROI on Uses (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
