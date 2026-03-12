import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

const DECISION_TYPES = ['Operational_Routine', 'Operational_Significant', 'Strategic_Operational', 'CEO_Level', 'Board_Level'];
const typeColors: Record<string, string> = {
  Operational_Routine: 'bg-muted text-muted-foreground',
  Operational_Significant: 'bg-blue-500/20 text-blue-700',
  Strategic_Operational: 'bg-purple-500/20 text-purple-700',
  CEO_Level: 'bg-orange-500/20 text-orange-700',
  Board_Level: 'bg-destructive/20 text-destructive',
};

interface ProjectDecisionLogTabProps {
  projectId: string;
}

export function ProjectDecisionLogTab({ projectId }: ProjectDecisionLogTabProps) {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', decision_made: '', rationale: '', decision_type: 'Operational_Routine', decision_date: format(new Date(), 'yyyy-MM-dd'), outcome: '', tags: '' });
  const [madeBy, setMadeBy] = useState('');
  const { toast } = useToast();

  useEffect(() => { loadData(); }, [projectId]);

  const loadData = async () => {
    const [decisionsRes, profilesRes] = await Promise.all([
      supabase.from('decision_log').select('*').eq('project_id', projectId).order('decision_date', { ascending: false }),
      supabase.from('profiles').select('id, name'),
    ]);
    setDecisions(decisionsRes.data || []);
    setProfiles(profilesRes.data || []);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('decision_log').insert({
        title: form.title, decision_made: form.decision_made, rationale: form.rationale || null,
        decision_type: form.decision_type, decision_date: form.decision_date,
        project_id: projectId, made_by_user_id: madeBy || null,
        outcome: form.outcome || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      });
      if (error) throw error;
      toast({ title: 'Decision logged' });
      setDialogOpen(false);
      setForm({ title: '', decision_made: '', rationale: '', decision_type: 'Operational_Routine', decision_date: format(new Date(), 'yyyy-MM-dd'), outcome: '', tags: '' });
      setMadeBy('');
      loadData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Decision Log</h3>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Log Decision</Button>
      </div>

      {decisions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No decisions logged for this project.</p>
      ) : (
        decisions.map(d => (
          <Card key={d.id}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{d.title}</span>
                <Badge variant="outline" className={typeColors[d.decision_type] || ''}>{d.decision_type.replace(/_/g, ' ')}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                {format(new Date(d.decision_date), 'MMM d, yyyy')} · {profiles.find(p => p.id === d.made_by_user_id)?.name || 'Unknown'}
              </p>
              <p className="text-sm">{d.decision_made}</p>
              {d.rationale && <p className="text-xs text-muted-foreground mt-1">{d.rationale}</p>}
              {d.outcome && <p className="text-xs text-green-700 mt-1"><strong>Outcome:</strong> {d.outcome}</p>}
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Decision</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Decision *</Label><Textarea value={form.decision_made} onChange={e => setForm(f => ({ ...f, decision_made: e.target.value }))} /></div>
            <div><Label>Rationale</Label><Textarea value={form.rationale} onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.decision_type} onValueChange={v => setForm(f => ({ ...f, decision_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DECISION_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" value={form.decision_date} onChange={e => setForm(f => ({ ...f, decision_date: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Made By</Label>
              <Select value={madeBy} onValueChange={setMadeBy}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">Log Decision</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
