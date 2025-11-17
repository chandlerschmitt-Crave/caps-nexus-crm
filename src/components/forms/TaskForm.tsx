import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const taskSchema = z.object({
  subject: z.string().trim().min(1, 'Subject is required').max(255),
  description: z.string().optional(),
  assignee_email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
  priority: z.enum(['Low', 'Med', 'High']),
  status: z.enum(['Not_Started', 'In_Progress', 'Done', 'Blocked']),
  related_type: z.string().optional().or(z.literal('')),
  related_id: z.string().optional().or(z.literal('')),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TaskForm({ open, onOpenChange, onSuccess }: TaskFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      subject: '',
      description: '',
      assignee_email: '',
      due_date: '',
      priority: 'Med',
      status: 'Not_Started',
      related_type: '',
      related_id: '',
    },
  });

  const onSubmit = async (values: TaskFormValues) => {
    setLoading(true);
    try {
      // Determine the owner_user_id
      let ownerId = user?.id;

      // If assignee email is provided, look up that user
      if (values.assignee_email) {
        const { data: assignee, error: lookupError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', values.assignee_email)
          .maybeSingle();

        if (lookupError) throw lookupError;

        if (!assignee) {
          toast({
            title: 'User not found',
            description: `No user found with email ${values.assignee_email}`,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        ownerId = assignee.id;
      }

      const taskData = {
        subject: values.subject,
        description: values.description || null,
        owner_user_id: ownerId,
        due_date: values.due_date || null,
        priority: values.priority,
        status: values.status,
        related_type: values.related_type || null,
        related_id: values.related_id || null,
      };

      const { data: insertedTask, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;

      console.log('Task created:', insertedTask);

      toast({
        title: 'Task created',
        description: values.assignee_email 
          ? `Task assigned to ${values.assignee_email}` 
          : 'Task created and assigned to you',
      });

      form.reset();
      onOpenChange(false);
      
      // Call onSuccess after a brief delay to ensure the dialog is closed
      setTimeout(() => {
        onSuccess?.();
      }, 100);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a task and optionally assign it to a team member
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <FormControl>
                    <Input placeholder="Review project proposal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add task details and context..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignee_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To (Email)</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="teammate@capsenterprises.com (leave blank to assign to yourself)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a team member's email to assign this task to them
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Med">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Not_Started">Not Started</SelectItem>
                      <SelectItem value="In_Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
