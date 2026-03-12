import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, BookOpen, Download } from 'lucide-react';
import { format } from 'date-fns';

interface Decision {
  id: string;
  title: string;
  decision_made: string;
  rationale: string | null;
  decision_type: string;
  made_by_user_id: string | null;
  decision_date: string;
  project_id: string | null;
  vertical: string | null;
  related_investor_id: string | null;
  outcome: string | null;
  tags: string[] | null;
  project?: { name: string } | null;
  profile?: { name: string } | null;
  investor?: { name: string } | null;
}

const DECISION_TYPES = ['Operational_Routine', 'Operational_Significant', 'Strategic_Operational', 'CEO_Level', 'Board_Level'];
const VERTICALS = ['TerraQore', 'VoltQore', 'Malibu_Luxury_Estates', 'Digital_Assets', 'CAPS_Platform'];

const typeColors: Record<string, string> = {
  Operational_Routine: 'bg-muted text-muted-foreground',
  Operational_Significant: 'bg-blue-500/20 text-blue-700',
  Strategic_Operational: 'bg-purple-500/20 text-purple-700',
  CEO_Level: 'bg-orange-500/20 text-orange-700',
  Board_Level: 'bg-destructive/20 text-destructive',
};

const emptyForm = {
  title: '', decision_made: '', rationale: '', decision_type: 'Operational_Routine',
  decision_date: format(new Date(), 'yyyy-MM-dd'), project_id: '', vertical: '',
  related_investor_id: '', outcome: '', tags: '',
};

export default function DecisionLog() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [madeBy, setMadeBy] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterVertical, setFilterVertical] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [decisionsRes, projectsRes, accountsRes, profilesRes] = await Promise.all([
      supabase.from('decision_log').select('*, project:projects(name)').order('decision_date', { ascending: false }),
      supabase.from('projects').select('id, name').order('name'),
      supabase.from('accounts').select('id, name').in('type_of_account', ['Investor', 'Fund', 'HoldCo']).order('name'),
      supabase.from('profiles').select('id, name'),
    ]);
    setDecisions((decisionsRes.data || []) as any);
    setProjects(projectsRes.data || []);
    setAccounts(accountsRes.data || []);
    setProfiles(profilesRes.data || []);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        title: form.title,
        decision_made: form.decision_made,
        rationale: form.rationale || null,
        decision_type: form.decision_type,
        decision_date: form.decision_date,
        project_id: form.project_id || null,
        vertical: form.vertical || null,
        related_investor_id: form.related_investor_id || null,
        outcome: form.outcome || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        made_by_user_id: madeBy || null,
      };

      if (editingDecision) {
        const { error } = await supabase.from('decision_log').update(payload).eq('id', editingDecision.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('decision_log').insert(payload);
        if (error) throw error;
      }

      toast({ title: 'Success', description: editingDecision ? 'Decision updated' : 'Decision logged' });
      setDialogOpen(false);
      setEditingDecision(null);
      setForm(emptyForm);
      setMadeBy('');
      loadData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const openEdit = (d: Decision) => {
    setEditingDecision(d);
    setForm({
      title: d.title, decision_made: d.decision_made, rationale: d.rationale || '',
      decision_type: d.decision_type, decision_date: d.decision_date,
      project_id: d.project_id || '', vertical: d.vertical || '',
      related_investor_id: d.related_investor_id || '', outcome: d.outcome || '',
      tags: d.tags?.join(', ') || '',
    });
    setMadeBy(d.made_by_user_id || '');
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingDecision(null);
    setForm(emptyForm);
    setMadeBy('');
    setDialogOpen(true);
  };

  const exportCSV = () => {
    const headers = ['Date', 'Title', 'Type', 'Decision', 'Rationale', 'Made By', 'Project', 'Vertical', 'Outcome', 'Tags'];
    const rows = filteredDecisions.map(d => [
      d.decision_date,
      d.title,
      d.decision_type.replace(/_/g, ' '),
      `"${(d.decision_made || '').replace(/"/g, '""')}"`,
      `"${(d.rationale || '').replace(/"/g, '""')}"`,
      profiles.find(p => p.id === d.made_by_user_id)?.name || '',
      (d as any).project?.name || '',
      d.vertical || '',
      `"${(d.outcome || '').replace(/"/g, '""')}"`,
      d.tags?.join('; ') || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decision-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredDecisions = decisions.filter(d => {
    if (filterType !== 'all' && d.decision_type !== filterType) return false;
    if (filterVertical !== 'all' && d.vertical !== filterVertical) return false;
    if (filterProject !== 'all' && d.project_id !== filterProject) return false;
    return true;
  });

  const getProfileName = (userId: string | null) => profiles.find(p => p.id === userId)?.name || '—';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-8 w-8" /> Decision Log
            </h1>
            <p className="text-muted-foreground">Track and audit all strategic and operational decisions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Decision</Button>
          </div>
        </div>

        <div className="flex gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DECISION_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterVertical} onValueChange={setFilterVertical}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Verticals" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verticals</SelectItem>
              {VERTICALS.map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Projects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredDecisions.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No decisions logged yet.</CardContent></Card>
          ) : (
            filteredDecisions.map(d => (
              <Card key={d.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(d)}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{d.title}</h3>
                      <Badge variant="outline" className={typeColors[d.decision_type] || ''}>
                        {d.decision_type.replace(/_/g, ' ')}
                      </Badge>
                      {d.vertical && <Badge variant="secondary">{d.vertical.replace(/_/g, ' ')}</Badge>}
                      {(d as any).project?.name && <Badge variant="outline">{(d as any).project.name}</Badge>}
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                      {format(new Date(d.decision_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">By: {getProfileName(d.made_by_user_id)}</p>
                  <p className="text-sm mb-2"><strong>Decision:</strong> {d.decision_made}</p>
                  {d.rationale && <p className="text-sm text-muted-foreground"><strong>Rationale:</strong> {d.rationale}</p>}
                  {d.outcome && <p className="text-sm mt-2 text-green-700"><strong>Outcome:</strong> {d.outcome}</p>}
                  {d.tags && d.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">{d.tags.map((t, i) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}</div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDecision ? 'Edit Decision' : 'Log Decision'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Decision Made *</Label><Textarea value={form.decision_made} onChange={e => setForm(f => ({ ...f, decision_made: e.target.value }))} /></div>
            <div><Label>Rationale</Label><Textarea value={form.rationale} onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Decision Type *</Label>
                <Select value={form.decision_type} onValueChange={v => setForm(f => ({ ...f, decision_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DECISION_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date *</Label><Input type="date" value={form.decision_date} onChange={e => setForm(f => ({ ...f, decision_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Made By</Label>
                <Select value={madeBy} onValueChange={setMadeBy}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vertical</Label>
                <Select value={form.vertical} onValueChange={v => setForm(f => ({ ...f, vertical: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{VERTICALS.map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project</Label>
                <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Related Investor</Label>
                <Select value={form.related_investor_id} onValueChange={v => setForm(f => ({ ...f, related_investor_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Outcome (fill in later)</Label><Textarea value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} /></div>
            <div><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. financing, legal, strategic" /></div>
            <Button onClick={handleSave} className="w-full">{editingDecision ? 'Update' : 'Log Decision'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
