import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Shield } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ComplianceItem {
  id: string;
  title: string;
  due_date: string;
  status: string;
  item_type: string;
  project?: { name: string } | null;
}

export function ComplianceWidget() {
  const [stats, setStats] = useState({ overdue: 0, thisWeek: 0, thisMonth: 0 });
  const [urgent, setUrgent] = useState<ComplianceItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCompliance();
  }, []);

  const loadCompliance = async () => {
    const { data } = await supabase
      .from('compliance_items')
      .select('id, title, due_date, status, item_type, project:projects(name)')
      .neq('status', 'Approved')
      .neq('status', 'Waived')
      .order('due_date');

    if (!data) return;

    const now = new Date();
    let overdue = 0, thisWeek = 0, thisMonth = 0;

    (data as any[]).forEach(item => {
      const due = new Date(item.due_date);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0 || item.status === 'Overdue') overdue++;
      else if (diffDays <= 7) thisWeek++;
      else if (diffDays <= 30) thisMonth++;
    });

    setStats({ overdue, thisWeek, thisMonth });

    // Get 3 most urgent (overdue first, then soonest due)
    const sorted = (data as any[])
      .filter(i => {
        const diffDays = Math.ceil((new Date(i.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 30 || i.status === 'Overdue';
      })
      .slice(0, 3);
    setUrgent(sorted);
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/compliance')}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Compliance Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">This Month</p>
          </div>
        </div>
        {urgent.length > 0 && (
          <div className="space-y-2">
            {urgent.map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="truncate flex-1">
                  <span className="font-medium">{item.title}</span>
                  {(item as any).project?.name && (
                    <span className="text-muted-foreground ml-1">· {(item as any).project.name}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground ml-2">{format(new Date(item.due_date), 'MMM d')}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
