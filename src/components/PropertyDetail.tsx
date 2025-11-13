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
import { Home, FolderKanban, CheckSquare, DollarSign, Link as LinkIcon, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface PropertyDetailProps {
  propertyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  status: string;
  apn: string | null;
  purchase: number | null;
  construction_hard: number | null;
  softs: number | null;
  total_use_of_funds: number | null;
  land_cost: number | null;
  construction_budget: number | null;
  total_cost: number | null;
  arv: number | null;
  exit_costs: number | null;
  projected_profit: number | null;
  gross_margin: number | null;
  roi_on_uses: number | null;
  target_resale_value: number | null;
  project: { name: string; project_type: string } | null;
}

interface Task {
  id: string;
  subject: string;
  due_date: string | null;
  priority: string;
  status: string;
}

export function PropertyDetail({ propertyId, open, onOpenChange, onRefresh }: PropertyDetailProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<{ subject: string; due_date: string; priority: 'Low' | 'Med' | 'High' }>({ 
    subject: '', 
    due_date: '', 
    priority: 'Med' 
  });
  const { toast } = useToast();

  useEffect(() => {
    if (propertyId && open) {
      loadPropertyDetails();
    }
  }, [propertyId, open]);

  const loadPropertyDetails = async () => {
    if (!propertyId) return;

    setLoading(true);
    try {
      const { data: propertyData } = await supabase
        .from('properties')
        .select('*, project:projects(name, project_type)')
        .eq('id', propertyId)
        .maybeSingle();

      setProperty(propertyData);

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, subject, due_date, priority, status')
        .eq('related_type', 'Property')
        .eq('related_id', propertyId)
        .order('due_date');

      setTasks(tasksData || []);
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
    if (!propertyId || !taskForm.subject) return;

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
          related_type: 'Property',
          related_id: propertyId,
          owner_user_id: user?.id
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });

      setTaskForm({ subject: '', due_date: '', priority: 'Med' });
      setLinkDialogOpen(false);
      loadPropertyDetails();
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
      loadPropertyDetails();
    }
  };

  const calculateSpread = () => {
    if (!property?.target_resale_value || !property?.total_cost) return null;
    return Number(property.target_resale_value) - Number(property.total_cost);
  };

  if (!property) {
    return null;
  }

  const spread = calculateSpread();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            {property.address}
          </SheetTitle>
          <SheetDescription>
            Property details and relationships
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Property Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{property.city}, {property.state}</span>
              </div>

              <div className="flex gap-2">
                <Badge variant="secondary">{property.status}</Badge>
              </div>

              {property.apn && (
                <div>
                  <Label className="text-muted-foreground">APN</Label>
                  <p className="text-sm mt-1">{property.apn}</p>
                </div>
              )}

              {property.project && (
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{property.project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {property.project.project_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-2 border-t">
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-accent">Cost Breakdown</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {property.purchase && (
                      <div>
                        <Label className="text-muted-foreground">Purchase Price</Label>
                        <p className="text-sm font-medium">
                          ${Number(property.purchase).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {property.construction_hard && (
                      <div>
                        <Label className="text-muted-foreground">Hard Costs</Label>
                        <p className="text-sm font-medium">
                          ${Number(property.construction_hard).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {property.softs && (
                      <div>
                        <Label className="text-muted-foreground">Soft Costs</Label>
                        <p className="text-sm font-medium">
                          ${Number(property.softs).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {property.total_use_of_funds && (
                      <div>
                        <Label className="text-muted-foreground">Total Use of Funds</Label>
                        <p className="text-sm font-medium">
                          ${Number(property.total_use_of_funds).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {property.land_cost && (
                      <div>
                        <Label className="text-muted-foreground">Land Cost</Label>
                        <p className="text-sm font-medium">
                          ${Number(property.land_cost).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {property.construction_budget && (
                      <div>
                        <Label className="text-muted-foreground">Construction Budget</Label>
                        <p className="text-sm font-medium">
                          ${Number(property.construction_budget).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {property.total_cost && (
                      <div>
                        <Label className="text-muted-foreground">Total Cost</Label>
                        <p className="text-sm font-medium">
                          ${Number(property.total_cost).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3 text-accent">Returns Analysis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {property.arv && (
                      <div>
                        <Label className="text-muted-foreground">ARV (After Repair Value)</Label>
                        <p className="text-sm font-medium">
                          ${Number(property.arv).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {property.target_resale_value && (
                      <div>
                        <Label className="text-muted-foreground">Target Resale Value</Label>
                        <p className="text-sm font-medium">
                          ${Number(property.target_resale_value).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {property.exit_costs && (
                      <div>
                        <Label className="text-muted-foreground">Exit Costs</Label>
                        <p className="text-sm font-medium">
                          ${Number(property.exit_costs).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {property.projected_profit && (
                      <div>
                        <Label className="text-muted-foreground">Projected Profit</Label>
                        <p className={`text-sm font-bold ${Number(property.projected_profit) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${Number(property.projected_profit).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {property.gross_margin !== null && property.gross_margin !== undefined && (
                      <div>
                        <Label className="text-muted-foreground">Gross Margin</Label>
                        <p className="text-sm font-medium">
                          {Number(property.gross_margin).toFixed(2)}%
                        </p>
                      </div>
                    )}
                    {property.roi_on_uses !== null && property.roi_on_uses !== undefined && (
                      <div>
                        <Label className="text-muted-foreground">ROI on Uses</Label>
                        <p className="text-sm font-medium">
                          {Number(property.roi_on_uses).toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tasks ({tasks.length})
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setLinkDialogOpen(true)}>
                <LinkIcon className="h-3 w-3 mr-1" />
                Create Task
              </Button>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks linked to this property
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
        </div>

        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Task Subject *</Label>
                <Input
                  value={taskForm.subject}
                  onChange={(e) => setTaskForm({ ...taskForm, subject: e.target.value })}
                  placeholder="e.g., Schedule property inspection"
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
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
