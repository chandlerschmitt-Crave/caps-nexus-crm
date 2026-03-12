import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderKanban, Building2, Home, CheckSquare, DollarSign, Link as LinkIcon, Plus, Trash2, HardHat, Pencil, Check, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { PropertyForm } from '@/components/forms/PropertyForm';
import { DealForm } from '@/components/forms/DealForm';
import { ConstructionTab } from '@/components/construction/ConstructionTab';
import { VoltQoreSiteMetricsTab } from '@/components/voltqore/VoltQoreSiteMetricsTab';
import { CapitalStackTab } from '@/components/capital/CapitalStackTab';
import { FinancialReturnsTab } from '@/components/capital/FinancialReturnsTab';
import { ProjectDecisionLogTab } from '@/components/project/ProjectDecisionLogTab';
import { ProjectInvestorsTab } from '@/components/project/ProjectInvestorsTab';
import { ProjectComplianceTab } from '@/components/project/ProjectComplianceTab';
import { ProjectActivitiesTab } from '@/components/project/ProjectActivitiesTab';
import { ProjectDocumentsTab } from '@/components/project/ProjectDocumentsTab';
import { ProjectOverviewCard } from '@/components/project/ProjectOverviewCard';
import { Notes } from '@/components/Notes';
import { CycleBadge } from '@/components/ui/cycle-badge';
import { formatCurrency } from '@/lib/formatters';

interface ProjectDetailProps {
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

interface Project {
  id: string;
  name: string;
  project_type: string;
  stage: string;
  market: string | null;
  description: string | null;
  est_total_cost: number | null;
  vertical: string | null;
  account: { name: string; type_of_account: string | null } | null;
}

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  status: string;
}

interface Task {
  id: string;
  subject: string;
  due_date: string | null;
  priority: string;
  status: string;
}

interface Deal {
  id: string;
  name: string;
  amount_target: number | null;
  stage: string;
  instrument: string;
}

export function ProjectDetail({ projectId, open, onOpenChange, onRefresh }: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkType, setLinkType] = useState<'task' | 'property' | 'deal' | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [taskForm, setTaskForm] = useState<{ subject: string; due_date: string; priority: 'Low' | 'Med' | 'High' }>({ 
    subject: '', due_date: '', priority: 'Med' 
  });
  const { toast } = useToast();

  useEffect(() => {
    if (projectId && open) {
      loadProjectDetails();
      setActiveTab('overview');
    }
  }, [projectId, open]);

  const loadProjectDetails = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [projectRes, propertiesRes, tasksRes, dealsRes] = await Promise.all([
        supabase.from('projects').select('*, account:accounts(name, type_of_account)').eq('id', projectId).maybeSingle(),
        supabase.from('properties').select('id, address, city, state, status').eq('project_id', projectId),
        supabase.from('tasks').select('id, subject, due_date, priority, status').eq('related_type', 'Project').eq('related_id', projectId).order('due_date'),
        supabase.from('deals').select('id, name, amount_target, stage, instrument').eq('project_id', projectId),
      ]);
      setProject(projectRes.data);
      setProperties(propertiesRes.data || []);
      setTasks(tasksRes.data || []);
      setDeals(dealsRes.data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (!projectId || !project) return;
    const oldStage = project.stage;
    
    const [updateRes, _historyRes] = await Promise.all([
      supabase.from('projects').update({ stage: newStage as any }).eq('id', projectId),
      supabase.auth.getUser().then(({ data: { user } }) =>
        supabase.from('project_stage_history').insert({
          project_id: projectId,
          from_stage: oldStage,
          to_stage: newStage,
          changed_by_user_id: user?.id || null,
        })
      ),
    ]);

    if (!updateRes.error) {
      toast({ title: 'Stage updated' });
      loadProjectDetails();
      onRefresh?.();
    }
  };

  const handleCreateTask = async () => {
    if (!projectId || !taskForm.subject) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('tasks').insert([{
        subject: taskForm.subject, due_date: taskForm.due_date || null,
        priority: taskForm.priority, status: 'Not_Started',
        related_type: 'Project', related_id: projectId, owner_user_id: user?.id
      }]);
      if (error) throw error;
      toast({ title: 'Task created' });
      setTaskForm({ subject: '', due_date: '', priority: 'Med' });
      setLinkDialogOpen(false);
      loadProjectDetails();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Done' ? 'Not_Started' : 'Done';
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (!error) loadProjectDetails();
  };

  const handleDelete = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      toast({ title: 'Project deleted' });
      onOpenChange(false);
      onRefresh?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const openLinkDialog = (type: 'task' | 'property' | 'deal') => {
    setLinkType(type);
    setTaskForm({ subject: '', due_date: '', priority: 'Med' });
    setLinkDialogOpen(true);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'task': openLinkDialog('task'); break;
      case 'activity': setActiveTab('activities'); break;
      case 'document': setActiveTab('documents'); break;
      case 'decision': setActiveTab('decisions'); break;
      case 'note': setActiveTab('notes'); break;
    }
  };

  if (!project) return null;

  const stageOptions = project.vertical === 'VoltQore'
    ? ['Site_Identified', 'Underwriting', 'LOI_Ground_Lease', 'Permits', 'Incentive_Applications', 'Shovel_Ready', 'Construction', 'Energized', 'Stabilized_Operations']
    : ['Ideation', 'Pre-Dev', 'Raising', 'Entitlements', 'Construction', 'Stabilization', 'Exit'];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                {project.name}
              </SheetTitle>
              <SheetDescription>Project details and relationships</SheetDescription>
            </div>
            <Button variant="destructive" size="icon" onClick={() => setDeleteDialogOpen(true)} disabled={loading}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap w-full h-auto gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="capital-stack">Capital Stack</TabsTrigger>
              <TabsTrigger value="financials">Returns</TabsTrigger>
              {project.vertical === 'VoltQore' && <TabsTrigger value="site-metrics">Site Metrics</TabsTrigger>}
              <TabsTrigger value="construction">Construction</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="decisions">Decisions</TabsTrigger>
              <TabsTrigger value="investors">Investors</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              <ProjectOverviewCard project={project} onQuickAction={handleQuickAction} />

              {/* Stage selector */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Label className="text-muted-foreground whitespace-nowrap">Change Stage:</Label>
                    <Select value={project.stage} onValueChange={handleStageChange}>
                      <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {stageOptions.map(s => (
                          <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {project.account && (
                    <div className="flex items-center gap-2 mt-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{project.account.name}</span>
                      {project.account.type_of_account && (
                        <Badge variant="outline" className="text-xs">{project.account.type_of_account}</Badge>
                      )}
                    </div>
                  )}
                  {project.description && <p className="text-sm text-muted-foreground mt-3">{project.description}</p>}
                </CardContent>
              </Card>

              {/* Properties summary */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Home className="h-4 w-4" />Properties ({properties.length})</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => openLinkDialog('property')}><Plus className="h-3 w-3 mr-1" />Add</Button>
                </CardHeader>
                <CardContent>
                  {properties.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No properties linked</p>
                  ) : (
                    <div className="space-y-2">
                      {properties.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-2 border rounded">
                          <div><p className="text-sm font-medium">{p.address}</p><p className="text-xs text-muted-foreground">{p.city}, {p.state}</p></div>
                          <Badge variant="outline" className="text-xs">{p.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Deals summary */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Deals ({deals.length})</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => openLinkDialog('deal')}><Plus className="h-3 w-3 mr-1" />Add</Button>
                </CardHeader>
                <CardContent>
                  {deals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No deals linked</p>
                  ) : (
                    <div className="space-y-2">
                      {deals.map(d => (
                        <div key={d.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <p className="text-sm font-medium">{d.name}</p>
                            <div className="flex gap-1 mt-0.5"><Badge variant="outline" className="text-xs">{d.instrument}</Badge><Badge variant="secondary" className="text-xs">{d.stage}</Badge></div>
                          </div>
                          {d.amount_target && <p className="text-sm font-bold">{formatCurrency(d.amount_target)}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Capital Stack */}
            <TabsContent value="capital-stack" className="mt-6">
              <CapitalStackTab projectId={projectId!} />
            </TabsContent>

            {/* Financial Returns */}
            <TabsContent value="financials" className="mt-6">
              <FinancialReturnsTab projectId={projectId!} />
            </TabsContent>

            {/* VoltQore Site Metrics */}
            {project.vertical === 'VoltQore' && (
              <TabsContent value="site-metrics" className="mt-6">
                <VoltQoreSiteMetricsTab projectId={projectId!} />
              </TabsContent>
            )}

            {/* Construction */}
            <TabsContent value="construction" className="mt-6">
              <ConstructionTab projectId={projectId!} />
            </TabsContent>

            {/* Tasks */}
            <TabsContent value="tasks" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><CheckSquare className="h-4 w-4" />Tasks ({tasks.length})</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => openLinkDialog('task')}><Plus className="h-3 w-3 mr-1" />Create Task</Button>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No tasks linked</p>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-2 rounded-md border">
                          <Checkbox checked={task.status === 'Done'} onCheckedChange={() => handleToggleTask(task.id, task.status)} />
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${task.status === 'Done' ? 'line-through text-muted-foreground' : ''}`}>{task.subject}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{task.priority}</Badge>
                              <Badge variant="secondary" className="text-xs">{task.status.replace(/_/g, ' ')}</Badge>
                              {task.due_date && <span className="text-xs text-muted-foreground">Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activities */}
            <TabsContent value="activities" className="mt-6">
              <ProjectActivitiesTab projectId={projectId!} />
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="mt-6">
              <ProjectDocumentsTab projectId={projectId!} />
            </TabsContent>

            {/* Notes */}
            <TabsContent value="notes" className="mt-6">
              <Notes relatedType="Project" relatedId={projectId!} />
            </TabsContent>

            {/* Compliance */}
            <TabsContent value="compliance" className="mt-6">
              <ProjectComplianceTab projectId={projectId!} />
            </TabsContent>

            {/* Decisions */}
            <TabsContent value="decisions" className="mt-6">
              <ProjectDecisionLogTab projectId={projectId!} />
            </TabsContent>

            {/* Investors */}
            <TabsContent value="investors" className="mt-6">
              <ProjectInvestorsTab projectId={projectId!} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Create Task / Property / Deal Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {linkType === 'task' && 'Create Task'}
                {linkType === 'property' && 'Add Property'}
                {linkType === 'deal' && 'Add Deal'}
              </DialogTitle>
            </DialogHeader>
            {linkType === 'task' && (
              <div className="space-y-4">
                <div><Label>Task Subject *</Label><Input value={taskForm.subject} onChange={e => setTaskForm({ ...taskForm, subject: e.target.value })} placeholder="e.g., Review project timeline" /></div>
                <div><Label>Due Date</Label><Input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} /></div>
                <div>
                  <Label>Priority</Label>
                  <Select value={taskForm.priority} onValueChange={v => setTaskForm({ ...taskForm, priority: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Med">Med</SelectItem><SelectItem value="High">High</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTask} disabled={!taskForm.subject || loading}>{loading ? 'Creating...' : 'Create'}</Button>
                </div>
              </div>
            )}
            {linkType === 'property' && (
              <PropertyForm projectId={projectId!} projectName={project?.name} onSuccess={() => { setLinkDialogOpen(false); loadProjectDetails(); }} onCancel={() => setLinkDialogOpen(false)} />
            )}
            {linkType === 'deal' && (
              <DealForm projectId={projectId!} onSuccess={() => { setLinkDialogOpen(false); loadProjectDetails(); }} onCancel={() => setLinkDialogOpen(false)} />
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to delete "{project.name}"? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
