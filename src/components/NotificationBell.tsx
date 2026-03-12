import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Alert {
  id: string;
  type: 'task' | 'obligation' | 'compliance' | 'stuck_project';
  title: string;
  detail: string;
  link: string;
}

export function NotificationBell() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) loadAlerts();
  }, [user?.id]);

  const loadAlerts = async () => {
    const now = new Date().toISOString().split('T')[0];
    const twentyOneDaysAgo = new Date(Date.now() - 21 * 86400000).toISOString();
    const items: Alert[] = [];

    const [tasksRes, oblRes, compRes, stuckRes] = await Promise.all([
      supabase.from('tasks').select('id, subject, due_date').lt('due_date', now).neq('status', 'Done').limit(20),
      supabase.from('investor_obligations').select('id, title, due_date').lt('due_date', now).neq('status', 'Completed').limit(20),
      supabase.from('compliance_items').select('id, title, due_date').lt('due_date', now).neq('status', 'Completed').limit(20),
      supabase.from('project_stage_history').select('project_id, changed_at, to_stage, project:projects(name)').order('changed_at', { ascending: false }).limit(200),
    ]);

    tasksRes.data?.forEach(t => items.push({
      id: t.id, type: 'task', title: 'Overdue Task',
      detail: t.subject, link: '/tasks',
    }));
    (oblRes.data as any)?.forEach((o: any) => items.push({
      id: o.id, type: 'obligation', title: 'Overdue Obligation',
      detail: o.title, link: '/investors',
    }));
    compRes.data?.forEach(c => items.push({
      id: c.id, type: 'compliance', title: 'Overdue Compliance',
      detail: c.title, link: '/compliance',
    }));

    // Find stuck projects: last stage change > 21 days ago
    if (stuckRes.data) {
      const latestByProject = new Map<string, any>();
      for (const h of stuckRes.data) {
        if (!latestByProject.has(h.project_id)) latestByProject.set(h.project_id, h);
      }
      for (const [, h] of latestByProject) {
        if (h.changed_at < twentyOneDaysAgo) {
          const name = (h.project as any)?.name || 'Project';
          items.push({
            id: h.project_id, type: 'stuck_project',
            title: 'Stuck in Stage',
            detail: `${name} — ${h.to_stage?.replace(/_/g, ' ')}`,
            link: '/projects',
          });
        }
      }
    }

    setAlerts(items);
  };

  const count = alerts.length;

  const typeColors: Record<string, string> = {
    task: 'text-destructive',
    obligation: 'text-amber-600',
    compliance: 'text-orange-600',
    stuck_project: 'text-muted-foreground',
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold text-sm">Alerts ({count})</h4>
        </div>
        <ScrollArea className="max-h-80">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">All clear!</p>
          ) : (
            <div className="divide-y">
              {alerts.map((a, i) => (
                <button
                  key={`${a.type}-${a.id}-${i}`}
                  className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  onClick={() => { setOpen(false); navigate(a.link); }}
                >
                  <p className={`text-xs font-semibold ${typeColors[a.type] || ''}`}>{a.title}</p>
                  <p className="text-sm truncate">{a.detail}</p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
