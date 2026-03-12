import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Calendar, User2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ProjectActivitiesTabProps {
  projectId: string;
}

const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'Note', 'Site_Visit'];

export function ProjectActivitiesTab({ projectId }: ProjectActivitiesTabProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '', type: 'Note', activity_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"), next_step: '', next_step_due: '' });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { loadData(); }, [projectId]);

  const loadData = async () => {
    const [actRes, profRes] = await Promise.all([
      supabase.from('activities').select('*').eq('what_type', 'Project').eq('what_id', projectId).order('activity_date', { ascending: false }),
      supabase.from('profiles').select('id, name'),
    ]);
    setActivities(actRes.data || []);
    setProfiles(profRes.data || []);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('activities').insert({
        subject: form.subject,
        body: form.body || null,
        type: form.type as any,
        activity_date: form.activity_date,
        what_type: 'Project',
        what_id: projectId,
        owner_user_id: user.id,
        next_step: form.next_step || null,
        next_step_due: form.next_step_due || null,
      });
      if (error) throw error;
      toast({ title: 'Activity logged' });
      setDialogOpen(false);
      setForm({ subject: '', body: '', type: 'Note', activity_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"), next_step: '', next_step_due: '' });
      loadData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const getProfileName = (id: string) => profiles.find(p => p.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Activities ({activities.length})</h3>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Log Activity</Button>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No activities logged for this project.</p>
      ) : (
        <div className="space-y-3">
          {activities.map(act => (
            <Card key={act.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{act.type}</Badge>
                      <span className="font-medium text-sm">{act.subject}</span>
                    </div>
                    {act.body && <p className="text-sm text-muted-foreground">{act.body}</p>}
                    {act.next_step && (
                      <p className="text-xs mt-1"><strong>Next:</strong> {act.next_step} {act.next_step_due && `(due ${format(new Date(act.next_step_due), 'MMM d')})`}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1"><User2 className="h-3 w-3" />{getProfileName(act.owner_user_id)}</div>
                    <div className="flex items-center gap-1 mt-1"><Calendar className="h-3 w-3" />{formatDistanceToNow(new Date(act.activity_date), { addSuffix: true })}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Subject *</Label><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date/Time</Label><Input type="datetime-local" value={form.activity_date} onChange={e => setForm(f => ({ ...f, activity_date: e.target.value }))} /></div>
            </div>
            <div><Label>Details</Label><Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Next Step</Label><Input value={form.next_step} onChange={e => setForm(f => ({ ...f, next_step: e.target.value }))} /></div>
              <div><Label>Next Step Due</Label><Input type="date" value={form.next_step_due} onChange={e => setForm(f => ({ ...f, next_step_due: e.target.value }))} /></div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={!form.subject}>Log Activity</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
