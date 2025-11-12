import { useState, useEffect } from 'react';
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

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ProjectFormData {
  name: string;
  account_name: string;
  project_type: 'AI_Data_Center' | 'Luxury_Res' | 'Tokenized_Fund';
  market?: string;
  description?: string;
  est_total_cost?: number;
  stage: 'Ideation' | 'Pre-Dev' | 'Raising' | 'Entitlements' | 'Construction' | 'Stabilization' | 'Exit';
}

export function ProjectForm({ open, onOpenChange, onSuccess }: ProjectFormProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<ProjectFormData>({
    defaultValues: { stage: 'Ideation' }
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const projectType = watch('project_type');
  const stage = watch('stage');

  const onSubmit = async (data: ProjectFormData) => {
    setLoading(true);
    try {
      // Find or create account
      let accountId: string;
      const { data: existingAccount } = await supabase
        .from('accounts')
        .select('id')
        .ilike('name', data.account_name)
        .single();

      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        const { data: newAccount, error: accountError } = await supabase
          .from('accounts')
          .insert([{ name: data.account_name, type_of_account: 'DevCo' }])
          .select('id')
          .single();
        
        if (accountError) throw accountError;
        accountId = newAccount.id;
      }

      const projectData = {
        name: data.name,
        account_id: accountId,
        project_type: data.project_type,
        market: data.market,
        description: data.description,
        est_total_cost: data.est_total_cost,
        stage: data.stage,
      };

      const { error } = await supabase.from('projects').insert([projectData]);

      if (error) throw error;

      toast({
        title: 'Project created',
        description: 'The project has been successfully added.',
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
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Create a new development project or fund
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                {...register('name', { required: true })}
                placeholder="e.g., Lancaster TX 240MW Campus"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name">Account/Company *</Label>
              <Input
                id="account_name"
                {...register('account_name', { required: true })}
                placeholder="e.g., TerraQore, CAPS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_type">Type *</Label>
              <Select onValueChange={(value) => setValue('project_type', value as ProjectFormData['project_type'])} value={projectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AI_Data_Center">AI Data Center</SelectItem>
                  <SelectItem value="Luxury_Res">Luxury Residential</SelectItem>
                  <SelectItem value="Tokenized_Fund">Tokenized Fund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="market">Market</Label>
              <Input
                id="market"
                {...register('market')}
                placeholder="e.g., DFW, Malibu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Stage *</Label>
              <Select onValueChange={(value) => setValue('stage', value as ProjectFormData['stage'])} value={stage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
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
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="est_total_cost">Estimated Total Cost ($)</Label>
              <Input
                id="est_total_cost"
                {...register('est_total_cost', { valueAsNumber: true })}
                type="number"
                placeholder="1191000000"
                step="0.01"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Project details, milestones, key information..."
                rows={4}
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
      </DialogContent>
    </Dialog>
  );
}
