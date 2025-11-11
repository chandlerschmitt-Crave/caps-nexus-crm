import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Calendar, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  subject: string;
  due_date: string | null;
  priority: string;
  status: string;
  owner?: { name: string };
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, owner:profiles(name)')
      .eq('owner_user_id', user?.id)
      .order('due_date', { ascending: true });

    setTasks(data as any || []);
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Done' ? 'Not_Started' : 'Done';
    
    await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    loadTasks();
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      Low: 'bg-gray-100 text-gray-800',
      Med: 'bg-yellow-100 text-yellow-800',
      High: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">Your action items and to-dos</p>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => {
            const overdue = isOverdue(task.due_date);
            const isDone = task.status === 'Done';

            return (
              <Card key={task.id} className={isDone ? 'opacity-60' : ''}>
                <CardContent className="flex items-start gap-4 p-4">
                  <Checkbox
                    checked={isDone}
                    onCheckedChange={() => toggleTask(task.id, task.status)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`font-medium ${
                          isDone ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {task.subject}
                      </h3>
                      <Badge
                        className={`text-xs ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </Badge>
                    </div>

                    {task.due_date && (
                      <div
                        className={`flex items-center gap-2 text-sm ${
                          overdue && !isDone
                            ? 'text-destructive font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {overdue && !isDone ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Calendar className="h-4 w-4" />
                        )}
                        <span>
                          Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                          {overdue && !isDone && ' (Overdue)'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {tasks.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No tasks yet. Create your first task to get started.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
