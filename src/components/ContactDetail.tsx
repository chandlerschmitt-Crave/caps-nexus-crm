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
import { User, Mail, Phone, Linkedin, Building2, CheckSquare, Link as LinkIcon, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface ContactDetailProps {
  contactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  role: string | null;
  linkedin_url: string | null;
  communication_style: string | null;
  account: { name: string; type_of_account: string | null } | null;
}

interface Task {
  id: string;
  subject: string;
  due_date: string | null;
  priority: string;
  status: string;
}

interface Activity {
  id: string;
  type: string;
  subject: string;
  activity_date: string;
}

export function ContactDetail({ contactId, open, onOpenChange, onRefresh }: ContactDetailProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<{ subject: string; due_date: string; priority: 'Low' | 'Med' | 'High' }>({ 
    subject: '', 
    due_date: '', 
    priority: 'Med' 
  });
  const { toast } = useToast();

  useEffect(() => {
    if (contactId && open) {
      loadContactDetails();
    }
  }, [contactId, open]);

  const loadContactDetails = async () => {
    if (!contactId) return;

    setLoading(true);
    try {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*, account:accounts(name, type_of_account)')
        .eq('id', contactId)
        .maybeSingle();

      setContact(contactData);

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, subject, due_date, priority, status')
        .eq('related_type', 'Contact')
        .eq('related_id', contactId)
        .order('due_date');

      setTasks(tasksData || []);

      const { data: activitiesData } = await supabase
        .from('activities')
        .select('id, type, subject, activity_date')
        .eq('who_contact_id', contactId)
        .order('activity_date', { ascending: false })
        .limit(10);

      setActivities(activitiesData || []);
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
    if (!contactId || !taskForm.subject) return;

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
          related_type: 'Contact',
          related_id: contactId,
          owner_user_id: user?.id
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });

      setTaskForm({ subject: '', due_date: '', priority: 'Med' });
      setLinkDialogOpen(false);
      loadContactDetails();
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
      loadContactDetails();
    }
  };

  if (!contact) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {contact.first_name} {contact.last_name}
          </SheetTitle>
          <SheetDescription>
            Contact details and relationships
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.title && (
                <div>
                  <Label className="text-muted-foreground">Title</Label>
                  <p className="text-sm mt-1">{contact.title}</p>
                </div>
              )}

              {contact.role && (
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">{contact.role}</Badge>
                  </div>
                </div>
              )}

              {contact.account && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{contact.account.name}</p>
                    {contact.account.type_of_account && (
                      <p className="text-xs text-muted-foreground">{contact.account.type_of_account}</p>
                    )}
                  </div>
                </div>
              )}

              {contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>
              )}

              {contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-sm hover:underline"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}

              {contact.linkedin_url && (
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}

              {contact.communication_style && (
                <div>
                  <Label className="text-muted-foreground">Communication Style</Label>
                  <p className="text-sm mt-1">{contact.communication_style}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Recent Activities ({activities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activities recorded
                </p>
              ) : (
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div key={activity.id} className="p-3 rounded-md border">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{activity.subject}</p>
                        <Badge variant="outline" className="text-xs">{activity.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.activity_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
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
                  No tasks linked to this contact
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
                  placeholder="e.g., Follow up call"
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
