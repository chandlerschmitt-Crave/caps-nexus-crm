import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SiteRow {
  site_name: string | null;
  stalls_operational: number | null;
  stalls_in_development: number | null;
  noi_monthly: number | null;
  utilization_rate_pct: number | null;
  status: string | null;
}

export function VoltQorePortfolioCard() {
  const [sites, setSites] = useState<SiteRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('voltqore_site_metrics' as any)
        .select('site_name, stalls_operational, stalls_in_development, noi_monthly, utilization_rate_pct, status');
      setSites((data as any) || []);
    };
    load();
  }, []);

  const totalOps = sites.reduce((s, r) => s + (Number(r.stalls_operational) || 0), 0);
  const totalDev = sites.reduce((s, r) => s + (Number(r.stalls_in_development) || 0), 0);
  const totalNOI = sites.reduce((s, r) => s + (Number(r.noi_monthly) || 0), 0);
  const avgUtil = sites.length > 0
    ? sites.reduce((s, r) => s + (Number(r.utilization_rate_pct) || 0), 0) / sites.length
    : 0;

  const statusColor = (status: string | null) => {
    switch (status) {
      case 'Stabilized': return 'bg-green-500';
      case 'Energized': return 'bg-yellow-500';
      case 'Under_Construction': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  if (sites.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4" />
          VoltQore Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Stalls Operational</p>
            <p className="text-2xl font-bold">{totalOps}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">In Development</p>
            <p className="text-2xl font-bold text-amber-600">{totalDev}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Portfolio NOI (Mo)</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalNOI)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Utilization</p>
            <p className="text-2xl font-bold">{avgUtil.toFixed(1)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Sites:</span>
          <TooltipProvider>
            {sites.map((site, i) => (
              <Tooltip key={i}>
                <TooltipTrigger>
                  <div className={`h-3 w-3 rounded-full ${statusColor(site.status)}`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-medium">{site.site_name || `Site ${i + 1}`}</p>
                  <p className="text-xs text-muted-foreground">{site.status?.replace('_', ' ')}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
