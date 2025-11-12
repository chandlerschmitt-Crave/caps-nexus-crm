import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ConstructionPackageFormProps {
  projectId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  phase: string;
  retainage_pct: string;
  start_date: string;
  substantial_completion: string;
  notes: string;
}

export function ConstructionPackageForm({ projectId, onSuccess, onCancel }: ConstructionPackageFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      name: '',
      phase: 'Precon',
      retainage_pct: '10',
      start_date: '',
      substantial_completion: '',
      notes: '',
    },
  });

  const phase = watch('phase');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('construction_packages').insert({
        project_id: projectId,
        name: data.name,
        phase: data.phase,
        retainage_pct: parseFloat(data.retainage_pct) || 10,
        start_date: data.start_date || null,
        substantial_completion: data.substantial_completion || null,
        notes: data.notes || null,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Construction package created successfully',
      });

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Package Name *</Label>
        <Input
          id="name"
          {...register('name', { required: true })}
          placeholder="e.g., Sea Star – RTI Build"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phase">Phase</Label>
        <Select value={phase} onValueChange={(value) => setValue('phase', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Precon">Precon</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Punchlist">Punchlist</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="retainage_pct">Retainage %</Label>
        <Input
          id="retainage_pct"
          type="number"
          step="0.01"
          {...register('retainage_pct')}
          placeholder="10"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            {...register('start_date')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="substantial_completion">Substantial Completion</Label>
          <Input
            id="substantial_completion"
            type="date"
            {...register('substantial_completion')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Package'}
        </Button>
      </div>
    </form>
  );
}
