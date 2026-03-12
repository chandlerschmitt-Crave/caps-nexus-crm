import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Calendar, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { TaskForm } from '@/components/forms/TaskForm';
import { TaskDetail } from '@/components/TaskDetail';
import { CycleBadge } from '@/components/ui/cycle-badge';
import { InlineEdit } from '@/components/ui/inline-edit';

interface Task {
  id: string;
  subject: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  owner?: { name: string };
}

const STATUS_OPTIONS = ['Not_Started', 'In_Progress', 'Blocked', 'Done'];
const PRIORITY_OPTIONS = ['Low', 'Med', 'High'];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => { loadTasks(); }, [user]);

  const loadTasks = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('tasks')
      .select('*, owner:profiles(name)')
      .order('due_date', { ascending: true });
    setTasks(data as any || []);
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Done' ? 'Not_Started' : 'Done';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    loadTasks();
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId);
    loadTasks();
  };

  const handleInlineSubjectSave = async (taskId: string, newSubject: string) => {
    await supabase.from('tasks').update({ subject: newSubject }).eq('id', taskId);
    loadTasks();
  };

  const handleInlineDateSave = async (taskId: string, newDate: string) => {
    await supabase.from('tasks').update({ due_date: newDate || null }).eq('id', taskId);
    loadTasks();
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Tasks</h1>
            <p className="text-muted-foreground">Team action items and to-dos</p>
          </div>
          <Button onClick={() => setShowTaskForm(true)}>
            <Plus className="mr-2 h-4 w-4" />Add Task
          </Button>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => {
            const overdue = isOverdue(task.due_date);
            const isDone = task.status === 'Done';

            return (
              <Card key={task.id} className={`${isDone ? 'opacity-60' : ''}`}>
                <CardContent className="flex items-start gap-4 p-4">
                  <Checkbox
                    checked={isDone}
                    onCheckedChange={() => toggleTask(task.id, task.status)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <InlineEdit
                          value={task.subject}
                          onSave={(v) => handleInlineSubjectSave(task.id, v)}
                          className={`font-medium ${isDone ? 'line-through text-muted-foreground' : ''}`}
                        />
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <CycleBadge
                          value={task.priority}
                          options={PRIORITY_OPTIONS}
                          table="tasks"
                          id={task.id}
                          field="priority"
                          onUpdate={loadTasks}
                        />
                        <CycleBadge
                          value={task.status}
                          options={STATUS_OPTIONS}
                          table="tasks"
                          id={task.id}
                          field="status"
                          onUpdate={loadTasks}
                        />
                        <Button
                          variant="ghost" size="icon"
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.due_date ? (
                        <div className={`flex items-center gap-1 text-sm ${overdue && !isDone ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {overdue && !isDone ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                          <InlineEdit
                            value={task.due_date}
                            onSave={(v) => handleInlineDateSave(task.id, v)}
                            inputType="date"
                            className="text-sm"
                          />
                          {overdue && !isDone && <span className="text-xs">(Overdue)</span>}
                        </div>
                      ) : (
                        <span
                          className="text-xs text-muted-foreground cursor-pointer hover:underline"
                          onClick={() => {
                            const today = format(new Date(), 'yyyy-MM-dd');
                            handleInlineDateSave(task.id, today);
                          }}
                        >
                          + Add due date
                        </span>
                      )}
                    </div>
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

        <TaskForm open={showTaskForm} onOpenChange={setShowTaskForm} onSuccess={loadTasks} />
        <TaskDetail
          taskId={selectedTaskId}
          open={!!selectedTaskId}
          onOpenChange={(open) => !open && setSelectedTaskId(null)}
          onRefresh={loadTasks}
        />
      </div>
    </Layout>
  );
}
