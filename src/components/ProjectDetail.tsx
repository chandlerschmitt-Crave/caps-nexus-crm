import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
  const [taskForm, setTaskForm] = useState<{ subject: string; due_date: string; priority: 'Low' | 'Med' | 'High' }>({ 
    subject: '', 
    due_date: '', 
    priority: 'Med' 
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    market: '',
    est_total_cost: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (projectId && open) {
      loadProjectDetails();
    }
  }, [projectId, open]);

  const loadProjectDetails = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data: projectData } = await supabase
        .from('projects')
        .select('*, account:accounts(name, type_of_account)')
        .eq('id', projectId)
        .maybeSingle();

      setProject(projectData);
      if (projectData) {
        setEditValues({
          market: projectData.market || '',
          est_total_cost: projectData.est_total_cost ? String(projectData.est_total_cost) : '',
          description: projectData.description || ''
        });
      }

      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id, address, city, state, status')
        .eq('project_id', projectId);

      setProperties(propertiesData || []);

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, subject, due_date, priority, status')
        .eq('related_type', 'Project')
        .eq('related_id', projectId)
        .order('due_date');

      setTasks(tasksData || []);

      const { data: dealsData } = await supabase
        .from('deals')
        .select('id, name, amount_target, stage, instrument')
        .eq('project_id', projectId);

      setDeals(dealsData || []);
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

  const handleCreateTask = async () => {
    if (!projectId || !taskForm.subject) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('tasks')
        .insert([{
          subject: taskForm.subject,
          due_date: taskForm.due_date || null,
          priority: taskForm.priority,
          status: 'Not_Started',
          related_type: 'Project',
          related_id: projectId,
          owner_user_id: user?.id
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });

      setTaskForm({ subject: '', due_date: '', priority: 'Med' });
      setLinkDialogOpen(false);
      loadProjectDetails();
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

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Done' ? 'Not_Started' : 'Done';
    
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (!error) {
      loadProjectDetails();
    }
  };

  const handleUpdateField = async (field: string) => {
    if (!projectId) return;

    let updateData: any = {};
    
    if (field === 'est_total_cost') {
      const value = parseFloat(editValues.est_total_cost);
      if (isNaN(value)) {
        toast({
          title: 'Error',
          description: 'Please enter a valid number',
          variant: 'destructive',
        });
        return;
      }
      updateData.est_total_cost = value;
    } else {
      updateData[field] = editValues[field as keyof typeof editValues];
    }

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (!error) {
      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });
      setEditingField(null);
      loadProjectDetails();
      onRefresh?.();
    } else {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const startEditing = (field: string) => {
    setEditingField(field);
  };

  const cancelEditing = () => {
    setEditingField(null);
    if (project) {
      setEditValues({
        market: project.market || '',
        est_total_cost: project.est_total_cost ? String(project.est_total_cost) : '',
        description: project.description || ''
      });
    }
  };

  const openLinkDialog = (type: 'task' | 'property' | 'deal') => {
    setLinkType(type);
    setTaskForm({ subject: '', due_date: '', priority: 'Med' });
    setLinkDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });

      onOpenChange(false);
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  if (!project) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                {project.name}
              </SheetTitle>
              <SheetDescription>
                Project details and relationships
              </SheetDescription>
            </div>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="deals">Deals</TabsTrigger>
              <TabsTrigger value="construction">Construction</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Type & Stage</Label>
                    <div className="flex gap-2 items-center">
                      <Badge variant="secondary">{project.project_type.replace('_', ' ')}</Badge>
                      <Select
                        value={project.stage}
                        onValueChange={async (value: string) => {
                          const { error } = await supabase
                            .from('projects')
                            .update({ stage: value as any })
                            .eq('id', projectId!);

                          if (!error) {
                            toast({
                              title: 'Success',
                              description: 'Project stage updated',
                            });
                            loadProjectDetails();
                            onRefresh?.();
                          } else {
                            toast({
                              title: 'Error',
                              description: error.message,
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
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
                  </div>

                  {project.account && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{project.account.name}</p>
                        {project.account.type_of_account && (
                          <p className="text-xs text-muted-foreground">{project.account.type_of_account}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {project.market || editingField === 'market' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-muted-foreground">Market</Label>
                        {editingField !== 'market' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing('market')}
                            className="h-6 px-2"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {editingField === 'market' ? (
                        <div className="flex gap-2">
                          <Input
                            value={editValues.market}
                            onChange={(e) => setEditValues(prev => ({ ...prev, market: e.target.value }))}
                            className="h-8"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateField('market')}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm mt-1">{project.market}</p>
                      )}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing('market')}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Market
                    </Button>
                  )}

                  {project.est_total_cost || editingField === 'est_total_cost' ? (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-muted-foreground">Est. Total Cost</Label>
                          {editingField !== 'est_total_cost' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing('est_total_cost')}
                              className="h-6 px-2"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {editingField === 'est_total_cost' ? (
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={editValues.est_total_cost}
                              onChange={(e) => setEditValues(prev => ({ ...prev, est_total_cost: e.target.value }))}
                              placeholder="Enter amount"
                              className="h-8"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateField('est_total_cost')}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditing}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm font-medium">
                            {formatCurrency(Number(project.est_total_cost))}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing('est_total_cost')}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Estimated Cost
                    </Button>
                  )}

                  {project.description || editingField === 'description' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-muted-foreground">Description</Label>
                        {editingField !== 'description' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing('description')}
                            className="h-6 px-2"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {editingField === 'description' ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editValues.description}
                            onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                            rows={4}
                            className="resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateField('description')}
                            >
                              <Check className="h-4 w-4 text-green-600 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditing}
                            >
                              <X className="h-4 w-4 text-red-600 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm mt-1">{project.description}</p>
                      )}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing('description')}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Description
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Tasks ({tasks.length})
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => openLinkDialog('task')}>
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Create Task
                  </Button>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tasks linked to this project
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 p-2 rounded-md border">
                          <Checkbox
                            checked={task.status === 'Done'}
                            onCheckedChange={() => handleToggleTask(task.id, task.status)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{task.subject}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{task.priority}</Badge>
                              {task.due_date && (
                                <span className="text-xs text-muted-foreground">
                                  Due: {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Properties ({properties.length})
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => openLinkDialog('property')}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Property
                  </Button>
                </CardHeader>
                <CardContent>
                  {properties.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No properties linked to this project
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {properties.map((property) => (
                        <div key={property.id} className="p-3 rounded-md border">
                          <p className="text-sm font-medium">{property.address}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">
                              {property.city}, {property.state}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {property.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deals" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Deals ({deals.length})
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => openLinkDialog('deal')}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Deal
                  </Button>
                </CardHeader>
                <CardContent>
                  {deals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No deals linked to this project
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {deals.map((deal) => (
                        <div key={deal.id} className="p-3 rounded-md border">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{deal.name}</p>
                            {deal.amount_target && (
                              <p className="text-sm font-bold">
                                {formatCurrency(deal.amount_target)}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{deal.instrument}</Badge>
                            <Badge variant="secondary" className="text-xs">{deal.stage}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="construction" className="mt-6">
              <ConstructionTab projectId={projectId!} />
            </TabsContent>
          </Tabs>
        </div>

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
                <div className="space-y-2">
                  <Label>Task Subject *</Label>
                  <Input
                    value={taskForm.subject}
                    onChange={(e) => setTaskForm({ ...taskForm, subject: e.target.value })}
                    placeholder="e.g., Review project timeline"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({ ...taskForm, priority: value as 'Low' | 'Med' | 'High' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Med">Med</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setLinkDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTask}
                    disabled={!taskForm.subject || loading}
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            )}
            {linkType === 'property' && (
              <PropertyForm
                projectId={projectId!}
                projectName={project?.name}
                onSuccess={() => {
                  setLinkDialogOpen(false);
                  loadProjectDetails();
                }}
                onCancel={() => setLinkDialogOpen(false)}
              />
            )}
            {linkType === 'deal' && (
              <DealForm
                projectId={projectId!}
                onSuccess={() => {
                  setLinkDialogOpen(false);
                  loadProjectDetails();
                }}
                onCancel={() => setLinkDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{project.name}"? This action cannot be undone and will remove all related data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
