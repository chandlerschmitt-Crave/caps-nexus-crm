import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, isToday, getDay } from 'date-fns';

interface ComplianceItem {
  id: string;
  project_id: string | null;
  vertical: string | null;
  item_type: string;
  title: string;
  description: string | null;
  due_date: string;
  completed_date: string | null;
  status: string;
  assigned_to_user_id: string | null;
  jurisdiction: string | null;
  filing_authority: string | null;
  document_url: string | null;
  reminder_days_before: number | null;
  notes: string | null;
  project?: { name: string } | null;
  profile?: { name: string } | null;
}

const ITEM_TYPES = ['Permit', 'Filing', 'License_Renewal', 'Incentive_Application', 'Regulatory_Deadline', 'Legal_Milestone', 'SPV_Formation', 'KYC_AML_Review', 'Tax_Filing'];
const STATUSES = ['Not_Started', 'In_Progress', 'Submitted', 'Approved', 'Overdue', 'Waived'];
const VERTICALS = ['TerraQore', 'VoltQore', 'Malibu_Luxury_Estates', 'Digital_Assets', 'CAPS_Platform'];

const emptyForm = {
  title: '', description: '', item_type: 'Permit', vertical: '', project_id: '', due_date: '', status: 'Not_Started',
  jurisdiction: '', filing_authority: '', document_url: '', reminder_days_before: '14', notes: '',
};

export default function Compliance() {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ComplianceItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [assignedTo, setAssignedTo] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sortField, setSortField] = useState<string>('due_date');
  const [filterVertical, setFilterVertical] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [itemsRes, projectsRes, profilesRes] = await Promise.all([
      supabase.from('compliance_items').select('*, project:projects(name)').order('due_date'),
      supabase.from('projects').select('id, name').order('name'),
      supabase.from('profiles').select('id, name'),
    ]);
    setItems((itemsRes.data || []) as any);
    setProjects(projectsRes.data || []);
    setProfiles(profilesRes.data || []);
  };

  const getStatusColor = (item: ComplianceItem) => {
    if (item.status === 'Approved' || item.status === 'Waived') return 'bg-green-500/20 text-green-700 border-green-300';
    const due = new Date(item.due_date);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (item.status === 'Overdue' || diffDays < 0) return 'bg-destructive/20 text-destructive border-destructive/30';
    if (diffDays <= 7) return 'bg-orange-500/20 text-orange-700 border-orange-300';
    if (diffDays <= 30) return 'bg-yellow-500/20 text-yellow-700 border-yellow-300';
    return 'bg-muted text-muted-foreground';
  };

  const getCalendarDotColor = (item: ComplianceItem) => {
    if (item.status === 'Approved' || item.status === 'Waived') return 'bg-green-500';
    const due = new Date(item.due_date);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (item.status === 'Overdue' || diffDays < 0) return 'bg-destructive';
    if (diffDays <= 7) return 'bg-orange-500';
    if (diffDays <= 30) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        title: form.title,
        description: form.description || null,
        item_type: form.item_type,
        vertical: form.vertical || null,
        project_id: form.project_id || null,
        due_date: form.due_date,
        status: form.status,
        jurisdiction: form.jurisdiction || null,
        filing_authority: form.filing_authority || null,
        document_url: form.document_url || null,
        reminder_days_before: parseInt(form.reminder_days_before) || 14,
        notes: form.notes || null,
        assigned_to_user_id: assignedTo || null,
      };

      if (editingItem) {
        const { error } = await supabase.from('compliance_items').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('compliance_items').insert(payload);
        if (error) throw error;
      }

      toast({ title: 'Success', description: editingItem ? 'Item updated' : 'Item created' });
      setDialogOpen(false);
      setEditingItem(null);
      setForm(emptyForm);
      setAssignedTo('');
      loadData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const openEdit = (item: ComplianceItem) => {
    setEditingItem(item);
    setForm({
      title: item.title, description: item.description || '', item_type: item.item_type,
      vertical: item.vertical || '', project_id: item.project_id || '', due_date: item.due_date,
      status: item.status, jurisdiction: item.jurisdiction || '', filing_authority: item.filing_authority || '',
      document_url: item.document_url || '', reminder_days_before: String(item.reminder_days_before || 14),
      notes: item.notes || '',
    });
    setAssignedTo(item.assigned_to_user_id || '');
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setAssignedTo('');
    setDialogOpen(true);
  };

  const filteredItems = items.filter(i => {
    if (filterVertical !== 'all' && i.vertical !== filterVertical) return false;
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    return true;
  });

  // Calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const getItemsForDay = (day: Date) => filteredItems.filter(i => isSameDay(new Date(i.due_date), day));

  const getProfileName = (userId: string | null) => {
    if (!userId) return '—';
    return profiles.find(p => p.id === userId)?.name || '—';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8" /> Compliance Calendar
            </h1>
            <p className="text-muted-foreground">Track permits, filings, and regulatory deadlines</p>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Item</Button>
        </div>

        <div className="flex gap-4">
          <Select value={filterVertical} onValueChange={setFilterVertical}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Verticals" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verticals</SelectItem>
              {VERTICALS.map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="calendar">
          <TabsList>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-px">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                  ))}
                  {Array.from({ length: startPadding }).map((_, i) => (
                    <div key={`pad-${i}`} className="min-h-[80px] bg-muted/30 rounded" />
                  ))}
                  {calendarDays.map(day => {
                    const dayItems = getItemsForDay(day);
                    return (
                      <div key={day.toISOString()} className={`min-h-[80px] border rounded p-1 ${isToday(day) ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <span className={`text-xs ${isToday(day) ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                          {format(day, 'd')}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {dayItems.slice(0, 3).map(item => (
                            <button
                              key={item.id}
                              onClick={() => openEdit(item)}
                              className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate ${getCalendarDotColor(item)} text-white`}
                            >
                              {item.title}
                            </button>
                          ))}
                          {dayItems.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{dayItems.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Vertical</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No compliance items found</TableCell></TableRow>
                    ) : (
                      filteredItems.map(item => (
                        <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(item)}>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>{(item as any).project?.name || '—'}</TableCell>
                          <TableCell>{item.vertical?.replace(/_/g, ' ') || '—'}</TableCell>
                          <TableCell>{item.item_type.replace(/_/g, ' ')}</TableCell>
                          <TableCell>{item.jurisdiction || '—'}</TableCell>
                          <TableCell>{format(new Date(item.due_date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{getProfileName(item.assigned_to_user_id)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(item)}>
                              {item.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Compliance Item' : 'Add Compliance Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select value={form.item_type} onValueChange={v => setForm(f => ({ ...f, item_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ITEM_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
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
              <div><Label>Due Date *</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Jurisdiction</Label><Input value={form.jurisdiction} onChange={e => setForm(f => ({ ...f, jurisdiction: e.target.value }))} /></div>
              <div><Label>Filing Authority</Label><Input value={form.filing_authority} onChange={e => setForm(f => ({ ...f, filing_authority: e.target.value }))} /></div>
            </div>
            <div><Label>Document URL</Label><Input value={form.document_url} onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <Button onClick={handleSave} className="w-full">{editingItem ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
