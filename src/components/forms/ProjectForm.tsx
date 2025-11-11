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
  account_id: string;
  project_type: 'AI_Data_Center' | 'Luxury_Res' | 'Tokenized_Fund';
  market?: string;
  description?: string;
  est_total_cost?: number;
  stage: 'Ideation' | 'Pre-Dev' | 'Raising' | 'Entitlements' | 'Construction' | 'Stabilization' | 'Exit';
}

interface Account {
  id: string;
  name: string;
}

export function ProjectForm({ open, onOpenChange, onSuccess }: ProjectFormProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<ProjectFormData>({
    defaultValues: { stage: 'Ideation' }
  });
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { toast } = useToast();
  
  const projectType = watch('project_type');
  const accountId = watch('account_id');
  const stage = watch('stage');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('id, name')
      .order('name');
    
    setAccounts(data || []);
  };

  const onSubmit = async (data: ProjectFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('projects').insert([data]);

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
              <Label htmlFor="account_id">Account *</Label>
              <Select onValueChange={(value) => setValue('account_id', value)} value={accountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
