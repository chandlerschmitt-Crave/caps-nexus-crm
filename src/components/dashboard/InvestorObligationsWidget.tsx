import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';

interface ObligationRow {
  id: string;
  account_id: string;
  obligation_type: string;
  title: string;
  due_date: string;
  status: string;
  assigned_to_user_id: string | null;
  account?: { name: string } | null;
  assigned_user?: { name: string } | null;
}

export function InvestorObligationsWidget() {
  const [obligations, setObligations] = useState<ObligationRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('investor_obligations' as any)
        .select('id, account_id, obligation_type, title, due_date, status, assigned_to_user_id, account:accounts(name), assigned_user:profiles!investor_obligations_assigned_to_user_id_fkey(name)')
        .neq('status', 'Completed')
        .order('due_date', { ascending: true })
        .limit(50);
      setObligations((data as any) || []);
    };
    load();
  }, []);

  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86400000);
  const in30 = new Date(now.getTime() + 30 * 86400000);

  const overdue = obligations.filter(o => new Date(o.due_date) < now);
  const dueIn7 = obligations.filter(o => { const d = new Date(o.due_date); return d >= now && d <= in7; });
  const dueIn30 = obligations.filter(o => { const d = new Date(o.due_date); return d >= now && d <= in30; });
  const top5 = [...overdue, ...dueIn7, ...obligations.filter(o => !overdue.includes(o) && !dueIn7.includes(o))].slice(0, 5);

  if (obligations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4" />
          Investor Obligations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-2 rounded-md bg-red-50 dark:bg-red-950/20">
            <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center p-2 rounded-md bg-amber-50 dark:bg-amber-950/20">
            <p className="text-2xl font-bold text-amber-600">{dueIn7.length}</p>
            <p className="text-xs text-muted-foreground">Next 7 Days</p>
          </div>
          <div className="text-center p-2 rounded-md bg-blue-50 dark:bg-blue-950/20">
            <p className="text-2xl font-bold text-blue-600">{dueIn30.length}</p>
            <p className="text-xs text-muted-foreground">Next 30 Days</p>
          </div>
        </div>

        {top5.length > 0 && (
          <div className="space-y-2">
            {top5.map(o => {
              const isOverdue = new Date(o.due_date) < now;
              return (
                <div key={o.id} className={`flex items-center justify-between p-2 rounded-md border text-sm ${isOverdue ? 'border-red-300 bg-red-50/50 dark:bg-red-950/10' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{(o as any).account?.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{o.obligation_type.replace(/_/g, ' ')}</Badge>
                      <span>{o.title}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {new Date(o.due_date).toLocaleDateString()}
                    </p>
                    {(o as any).assigned_user?.name && (
                      <p className="text-[10px] text-muted-foreground">{(o as any).assigned_user.name}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
