import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Notes } from '@/components/Notes';

interface TaskDetailProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

interface Task {
  id: string;
  subject: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  created_at: string;
  owner?: { name: string; email: string };
}

export function TaskDetail({ taskId, open, onOpenChange, onRefresh }: TaskDetailProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (taskId && open) {
      loadTaskDetails();
    }
  }, [taskId, open]);

  const loadTaskDetails = async () => {
    if (!taskId) return;
    
    setLoading(true);
    try {
      const { data } = await supabase
        .from('tasks')
        .select('*, owner:profiles(name, email)')
        .eq('id', taskId)
        .single();

      setTask(data as any);
    } catch (error) {
      console.error('Error loading task:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      Low: 'bg-gray-100 text-gray-800',
      Med: 'bg-yellow-100 text-yellow-800',
      High: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Not_Started: 'bg-gray-100 text-gray-800',
      In_Progress: 'bg-blue-100 text-blue-800',
      Done: 'bg-green-100 text-green-800',
      Blocked: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!task && !loading) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Task Details</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : task ? (
          <div className="space-y-6 mt-6">
            {/* Task Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{task.subject}</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority} Priority
                  </Badge>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  {task.due_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Due Date</div>
                        <div className="font-medium">
                          {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  )}

                  {task.owner && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Assigned To</div>
                        <div className="font-medium">{task.owner.name}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Created</div>
                      <div className="font-medium">
                        {format(new Date(task.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Notes & Discussion</CardTitle>
              </CardHeader>
              <CardContent>
                <Notes relatedType="tasks" relatedId={task.id} />
              </CardContent>
            </Card>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
