import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface ProjectFinRow {
  project_id: string;
  projected_irr_pct: number | null;
  target_irr_pct: number | null;
  projected_equity_multiple: number | null;
  target_equity_multiple: number | null;
  project?: { name: string } | null;
}

interface CapStackRow {
  project_id: string;
  committed_amount: number | null;
  called_amount: number | null;
  uncalled_amount: number | null;
}

export function PortfolioFinancialSummary() {
  const [capData, setCapData] = useState<CapStackRow[]>([]);
  const [finData, setFinData] = useState<ProjectFinRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const [capRes, finRes] = await Promise.all([
        supabase.from('capital_stacks' as any).select('project_id, committed_amount, called_amount, uncalled_amount'),
        supabase.from('project_financials' as any).select('project_id, projected_irr_pct, target_irr_pct, projected_equity_multiple, target_equity_multiple, project:projects(name)'),
      ]);
      setCapData((capRes.data as any) || []);
      setFinData((finRes.data as any) || []);
    };
    load();
  }, []);

  const totalCommitted = capData.reduce((s, r) => s + (Number(r.committed_amount) || 0), 0);
  const totalCalled = capData.reduce((s, r) => s + (Number(r.called_amount) || 0), 0);
  const totalUncalled = capData.reduce((s, r) => s + (Number(r.uncalled_amount) || 0), 0);

  const projectsWithIRR = finData.filter(f => f.projected_irr_pct != null);
  const weightedIRR = projectsWithIRR.length > 0
    ? projectsWithIRR.reduce((s, f) => s + (Number(f.projected_irr_pct) || 0), 0) / projectsWithIRR.length
    : 0;

  if (capData.length === 0 && finData.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Portfolio Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Committed</p>
            <p className="text-lg font-bold">{formatCurrency(totalCommitted)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Called</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalCalled)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Uncalled</p>
            <p className="text-lg font-bold text-amber-600">{formatCurrency(totalUncalled)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Wtd Avg Proj. IRR</p>
            <p className="text-lg font-bold">{weightedIRR.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Projects Tracked</p>
            <p className="text-lg font-bold">{finData.length}</p>
          </div>
        </div>

        {finData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {finData.map((f) => {
              const irrOk = f.projected_irr_pct != null && f.target_irr_pct != null && f.projected_irr_pct >= f.target_irr_pct;
              const emOk = f.projected_equity_multiple != null && f.target_equity_multiple != null && f.projected_equity_multiple >= f.target_equity_multiple;
              return (
                <div key={f.project_id} className="border rounded-md p-3">
                  <p className="text-sm font-medium mb-2 truncate">{(f as any).project?.name || 'Project'}</p>
                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">IRR </span>
                      <span className={`font-bold ${irrOk ? 'text-green-600' : 'text-amber-500'}`}>{f.projected_irr_pct ?? '—'}%</span>
                      <span className="text-muted-foreground"> / {f.target_irr_pct ?? '—'}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">EM </span>
                      <span className={`font-bold ${emOk ? 'text-green-600' : 'text-amber-500'}`}>{f.projected_equity_multiple ?? '—'}x</span>
                      <span className="text-muted-foreground"> / {f.target_equity_multiple ?? '—'}x</span>
                    </div>
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
