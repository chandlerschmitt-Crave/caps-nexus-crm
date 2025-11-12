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
import { Separator } from '@/components/ui/separator';
import { Building2, Globe, Phone, MapPin, FileText, FolderKanban, Home, Link as LinkIcon, Users, CheckSquare, Mail, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface AccountDetailProps {
  accountId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

interface Account {
  id: string;
  name: string;
  type_of_account: string | null;
  website: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  notes: string | null;
}

interface Project {
  id: string;
  name: string;
  project_type: string;
  stage: string;
}

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  status: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  title: string | null;
  role: string | null;
}

interface Task {
  id: string;
  subject: string;
  due_date: string | null;
  priority: string;
  status: string;
}

export function AccountDetail({ accountId, open, onOpenChange, onRefresh }: AccountDetailProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkType, setLinkType] = useState<'project' | 'property' | 'contact' | 'task' | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<{ subject: string; due_date: string; priority: 'Low' | 'Med' | 'High' }>({ 
    subject: '', 
    due_date: '', 
    priority: 'Med' 
  });
  const { toast } = useToast();

  useEffect(() => {
    if (accountId && open) {
      loadAccountDetails();
    }
  }, [accountId, open]);

  const loadAccountDetails = async () => {
    if (!accountId) return;

    setLoading(true);
    try {
      // Load account details
      const { data: accountData } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .maybeSingle();

      setAccount(accountData);

      // Load related projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, project_type, stage')
        .eq('account_id', accountId);

      setProjects(projectsData || []);

      // Load available projects for linking (not already linked to this account)
      const { data: allProjectsData } = await supabase
        .from('projects')
        .select('id, name, project_type, stage')
        .neq('account_id', accountId)
        .order('name');

      setAllProjects(allProjectsData || []);

      // Load related properties through projects
      const projectIds = projectsData?.map(p => p.id) || [];
      if (projectIds.length > 0) {
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('id, address, city, state, status')
          .in('project_id', projectIds);

        setProperties(propertiesData || []);
      }

      // Load all properties for linking
      const { data: allPropertiesData } = await supabase
        .from('properties')
        .select('id, address, city, state, status')
        .order('address');

      setAllProperties(allPropertiesData || []);

      // Load contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, title, role')
        .eq('account_id', accountId)
        .order('last_name');

      setContacts(contactsData || []);

      // Load tasks related to this account
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, subject, due_date, priority, status')
        .eq('related_type', 'Account')
        .eq('related_id', accountId)
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

  const handleLinkProject = async () => {
    if (!selectedId || !accountId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ account_id: accountId })
        .eq('id', selectedId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project linked successfully',
      });

      setLinkDialogOpen(false);
      setSelectedId('');
      loadAccountDetails();
      onRefresh?.();
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

  const handleLinkProperty = async () => {
    if (!selectedId || !accountId) return;

    // For properties, we need to ensure they're linked through a project
    // First check if there's an existing project link
    const property = allProperties.find(p => p.id === selectedId);
    if (!property) return;

    toast({
      title: 'Info',
      description: 'Properties must be linked through a project. The property will appear once you link its associated project.',
    });
    setLinkDialogOpen(false);
  };

  const handleCreateTask = async () => {
    if (!accountId || !taskForm.subject) return;

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
          related_type: 'Account',
          related_id: accountId,
          owner_user_id: user?.id
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });

      setTaskForm({ subject: '', due_date: '', priority: 'Med' });
      setLinkDialogOpen(false);
      loadAccountDetails();
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
      loadAccountDetails();
    }
  };

  const openLinkDialog = (type: 'project' | 'property' | 'contact' | 'task') => {
    setLinkType(type);
    setSelectedId('');
    setTaskForm({ subject: '', due_date: '', priority: 'Med' });
    setLinkDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!accountId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Account deleted successfully',
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

  if (!account) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {account.name}
              </SheetTitle>
              <SheetDescription>
                Account details and relationships
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

        <div className="mt-6 space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {account.type_of_account && (
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">{account.type_of_account}</Badge>
                  </div>
                </div>
              )}

              {account.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {account.website}
                  </a>
                </div>
              )}

              {account.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{account.phone}</span>
                </div>
              )}

              {(account.city || account.state || account.country) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {[account.city, account.state, account.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {account.notes && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </Label>
                  <p className="text-sm mt-1">{account.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Contacts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contacts ({contacts.length})
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => openLinkDialog('contact')}>
                <LinkIcon className="h-3 w-3 mr-1" />
                Link Contact
              </Button>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No contacts linked to this account
                </p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-2 rounded-md border">
                      <div>
                        <p className="text-sm font-medium">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {contact.title && (
                            <p className="text-xs text-muted-foreground">{contact.title}</p>
                          )}
                          {contact.role && (
                            <Badge variant="outline" className="text-xs">{contact.role}</Badge>
                          )}
                        </div>
                      </div>
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Projects ({projects.length})
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => openLinkDialog('project')}>
                <LinkIcon className="h-3 w-3 mr-1" />
                Link Project
              </Button>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No projects linked to this account
                </p>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div key={project.id} className="p-3 rounded-md border">
                      <p className="text-sm font-medium">{project.name}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {project.project_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {project.stage}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Properties */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Home className="h-4 w-4" />
                Properties ({properties.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No properties linked through projects
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

          {/* Tasks */}
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
                  No tasks linked to this account
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
                          <Badge variant="outline" className="text-xs">
                            {task.priority}
                          </Badge>
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

        {/* Link Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {linkType === 'task' ? 'Create Task' : `Link ${linkType?.charAt(0).toUpperCase()}${linkType?.slice(1)}`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {linkType === 'task' ? (
                <>
                  <div className="space-y-2">
                    <Label>Task Subject *</Label>
                    <Input
                      value={taskForm.subject}
                      onChange={(e) => setTaskForm({ ...taskForm, subject: e.target.value })}
                      placeholder="e.g., Follow up with contact"
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
                </>
              ) : linkType === 'contact' ? (
                <p className="text-sm text-muted-foreground">
                  To link a contact, please create or edit the contact and select this account from the contact form.
                </p>
              ) : (
                <div className="space-y-2">
                  <Label>Select {linkType?.charAt(0).toUpperCase()}{linkType?.slice(1)}</Label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select a ${linkType}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {linkType === 'project' &&
                        allProjects
                          .filter(p => !projects.some(ep => ep.id === p.id))
                          .map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                      {linkType === 'property' &&
                        allProperties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.address}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setLinkDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                {linkType !== 'contact' && (
                  <Button
                    onClick={
                      linkType === 'task' ? handleCreateTask :
                      linkType === 'project' ? handleLinkProject : 
                      handleLinkProperty
                    }
                    disabled={(linkType === 'task' ? !taskForm.subject : !selectedId) || loading}
                  >
                    {loading ? 'Processing...' : linkType === 'task' ? 'Create' : 'Link'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{account.name}"? This action cannot be undone and will remove all related data.
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
