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

const projectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(200),
  account_name: z.string().trim().min(1, 'Account name is required').max(200),
  project_type: z.enum(['AI_Data_Center', 'Luxury_Res', 'Tokenized_Fund'], {
    required_error: 'Project type is required',
  }),
  market: z.string().trim().max(100).optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  est_total_cost: z.number().positive('Cost must be positive').optional().or(z.literal(0)),
  stage: z.enum(['Ideation', 'Pre-Dev', 'Raising', 'Entitlements', 'Construction', 'Stabilization', 'Exit'], {
    required_error: 'Stage is required',
  }),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProjectForm({ open, onOpenChange, onSuccess }: ProjectFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      account_name: '',
      project_type: 'AI_Data_Center',
      market: '',
      description: '',
      est_total_cost: 0,
      stage: 'Ideation',
    },
  });

  const onSubmit = async (values: ProjectFormValues) => {
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
          .insert([{ name: values.account_name, type_of_account: 'DevCo' }])
          .select('id')
          .single();
        
        if (accountError) throw accountError;
        accountId = newAccount.id;
      }

      const projectData = {
        name: values.name,
        account_id: accountId,
        project_type: values.project_type,
        market: values.market || null,
        description: values.description || null,
        est_total_cost: values.est_total_cost || null,
        stage: values.stage,
      };

      const { error } = await supabase.from('projects').insert([projectData]);

      if (error) throw error;

      toast({
        title: 'Project created',
        description: 'The project has been successfully added.',
      });
      
      form.reset();
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
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Create a new development project or fund
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
                      <FormLabel>Project Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lancaster TX 240MW Campus" {...field} />
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
                    <FormLabel>Account/Company *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., TerraQore, CAPS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="project_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AI_Data_Center">AI Data Center</SelectItem>
                        <SelectItem value="Luxury_Res">Luxury Residential</SelectItem>
                        <SelectItem value="Tokenized_Fund">Tokenized Fund</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="market"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Market</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., DFW, Malibu" {...field} />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ideation">Ideation</SelectItem>
                        <SelectItem value="Pre-Dev">Pre-Dev</SelectItem>
                        <SelectItem value="Raising">Raising</SelectItem>
                        <SelectItem value="Entitlements">Entitlements</SelectItem>
                        <SelectItem value="Construction">Construction</SelectItem>
                        <SelectItem value="Stabilization">Stabilization</SelectItem>
                        <SelectItem value="Exit">Exit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="est_total_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Total Cost ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1191000000"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Project details, milestones, key information..." rows={4} {...field} />
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
                {loading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
