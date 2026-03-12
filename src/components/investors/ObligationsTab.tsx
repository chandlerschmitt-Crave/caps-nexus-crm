import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Calendar, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface Obligation {
  id: string;
  account_id: string;
  project_id: string | null;
  obligation_type: string;
  title: string;
  due_date: string;
  completed_date: string | null;
  status: string;
  assigned_to_user_id: string | null;
  document_url: string | null;
  notes: string | null;
  recurrence: string | null;
}

interface Props {
  accountId: string;
}

const OBLIGATION_TYPES = [
  'Quarterly_Report', 'Annual_Report', 'Capital_Call', 'Distribution',
  'K1_Tax_Doc', 'LP_Update', 'Board_Meeting', 'Compliance_Filing', 'Ad_Hoc'
];

const RECURRENCES = ['None', 'Monthly', 'Quarterly', 'Annual'];

export function ObligationsTab({ accountId }: Props) {
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    obligation_type: 'Quarterly_Report',
    title: '',
    due_date: '',
    notes: '',
    recurrence: 'None',
    document_url: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadObligations();
  }, [accountId]);

  const loadObligations = async () => {
    const { data } = await supabase
      .from('investor_obligations' as any)
      .select('*')
      .eq('account_id', accountId)
      .order('due_date', { ascending: true });
    setObligations((data as any) || []);
  };

  const handleAdd = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const row = {
        account_id: accountId,
        obligation_type: form.obligation_type,
        title: form.title,
        due_date: form.due_date,
        notes: form.notes || null,
        recurrence: form.recurrence,
        document_url: form.document_url || null,
        status: 'Upcoming',
        assigned_to_user_id: user?.id,
      };
      const { error } = await supabase.from('investor_obligations' as any).insert([row] as any);
      if (error) throw error;
      toast({ title: 'Obligation added' });
      setForm({ obligation_type: 'Quarterly_Report', title: '', due_date: '', notes: '', recurrence: 'None', document_url: '' });
      setDialogOpen(false);
      loadObligations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const markCompleted = async (id: string) => {
    await supabase
      .from('investor_obligations' as any)
      .update({ status: 'Completed', completed_date: new Date().toISOString().split('T')[0] } as any)
      .eq('id', id);
    loadObligations();
  };

  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3 w-3 mr-1" /> Add Obligation
        </Button>
      </div>

      {obligations.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No obligations tracked yet.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {obligations.map(obl => {
              const isOverdue = obl.status !== 'Completed' && new Date(obl.due_date) < now;
              const isCompleted = obl.status === 'Completed';
              return (
                <div key={obl.id} className="relative pl-10">
                  <div className={`absolute left-2.5 top-2 h-3 w-3 rounded-full border-2 ${isCompleted ? 'bg-green-500 border-green-500' : isOverdue ? 'bg-red-500 border-red-500' : 'bg-background border-primary'}`} />
                  <Card className={isOverdue ? 'border-red-300 bg-red-50/50 dark:bg-red-950/10' : ''}>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">{obl.title}</p>
                            <Badge variant="outline" className="text-[10px]">{obl.obligation_type.replace(/_/g, ' ')}</Badge>
                            {isOverdue && <Badge variant="destructive" className="text-[10px]">OVERDUE</Badge>}
                            {isCompleted && <Badge className="text-[10px] bg-green-100 text-green-800">COMPLETED</Badge>}
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>Due: {new Date(obl.due_date).toLocaleDateString()}</span>
                            {obl.recurrence !== 'None' && <span>Recurs: {obl.recurrence}</span>}
                            {obl.completed_date && <span>Completed: {new Date(obl.completed_date).toLocaleDateString()}</span>}
                          </div>
                          {obl.notes && <p className="text-xs text-muted-foreground mt-1">{obl.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          {obl.document_url && (
                            <a href={obl.document_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><FileText className="h-3.5 w-3.5" /></Button>
                            </a>
                          )}
                          {!isCompleted && (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => markCompleted(obl.id)}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Obligation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Type *</Label>
                <Select value={form.obligation_type} onValueChange={v => setForm(p => ({ ...p, obligation_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OBLIGATION_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Recurrence</Label>
                <Select value={form.recurrence} onValueChange={v => setForm(p => ({ ...p, recurrence: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECURRENCES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Q1 2026 LP Update" />
            </div>
            <div className="space-y-1">
              <Label>Due Date *</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Document URL</Label>
              <Input value={form.document_url} onChange={e => setForm(p => ({ ...p, document_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!form.title || !form.due_date || loading}>
                {loading ? 'Adding...' : 'Add Obligation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
