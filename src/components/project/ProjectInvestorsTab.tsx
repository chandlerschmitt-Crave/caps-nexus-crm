import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';

interface InvestorRow {
  id: string;
  provider_name: string | null;
  layer: string;
  committed_amount: number | null;
  called_amount: number | null;
  preferred_return_pct: number | null;
}

interface Obligation {
  id: string;
  title: string;
  due_date: string;
  status: string;
  account?: { name: string } | null;
}

interface ProjectInvestorsTabProps {
  projectId: string;
}

export function ProjectInvestorsTab({ projectId }: ProjectInvestorsTabProps) {
  const [investors, setInvestors] = useState<InvestorRow[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    const [stackRes, oblRes] = await Promise.all([
      supabase.from('capital_stacks').select('id, provider_name, layer, committed_amount, called_amount, preferred_return_pct').eq('project_id', projectId).order('sort_order'),
      supabase.from('investor_obligations').select('id, title, due_date, status, account:accounts(name)').eq('project_id', projectId).neq('status', 'Completed').order('due_date').limit(10),
    ]);
    setInvestors(stackRes.data || []);
    setObligations((oblRes.data || []) as any);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Investors via Capital Stack
          </CardTitle>
        </CardHeader>
        <CardContent>
          {investors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No capital stack entries. Add investors via the Capital Stack tab.</p>
          ) : (
            <div className="space-y-3">
              {investors.map(inv => (
                <div key={inv.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{inv.provider_name || 'Unnamed'}</p>
                    <Badge variant="outline" className="text-xs mt-1">{inv.layer.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="text-right text-sm">
                    <p>Committed: <span className="font-semibold">{formatCurrency(inv.committed_amount || 0)}</span></p>
                    <p className="text-muted-foreground">Called: {formatCurrency(inv.called_amount || 0)}</p>
                    {inv.preferred_return_pct != null && (
                      <p className="text-xs text-muted-foreground">Pref: {inv.preferred_return_pct}%</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {obligations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Reporting Obligations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {obligations.map(obl => (
                <div key={obl.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{obl.title}</p>
                    <p className="text-xs text-muted-foreground">{(obl as any).account?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs">{format(new Date(obl.due_date), 'MMM d, yyyy')}</p>
                    <Badge variant="outline" className={`text-xs ${obl.status === 'Overdue' ? 'bg-destructive/20 text-destructive' : ''}`}>
                      {obl.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
