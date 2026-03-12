import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AccountForm } from '@/components/forms/AccountForm';
import { AccountDetail } from '@/components/AccountDetail';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Plus, DollarSign, AlertTriangle, Calendar } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/formatters';

interface Obligation {
  id: string;
  account_id: string;
  due_date: string;
  status: string;
}

interface Investor {
  id: string;
  name: string;
  type_of_account: string | null;
  investor_status: string | null;
  investor_tier: string | null;
  total_committed_capital: number | null;
  total_called_capital: number | null;
  total_distributed_capital: number | null;
  relationship_owner_user_id: string | null;
  next_report_due_at: string | null;
  last_report_sent_at: string | null;
  capital_invested: number | null;
  city: string | null;
  state: string | null;
}

const OBLIGATION_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due_week', label: 'Due This Week' },
  { value: 'due_month', label: 'Due This Month' },
  { value: 'clear', label: 'All Clear' },
];

export default function Investors() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [obligationFilter, setObligationFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [invRes, oblRes] = await Promise.all([
      supabase
        .from('accounts')
        .select('*')
        .in('type_of_account', ['Investor', 'Fund', 'HoldCo'])
        .order('name'),
      supabase
        .from('investor_obligations' as any)
        .select('id, account_id, due_date, status')
        .neq('status', 'Completed'),
    ]);
    setInvestors(invRes.data || []);
    setObligations((oblRes.data as any) || []);
  };

  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86400000);
  const in14 = new Date(now.getTime() + 14 * 86400000);
  const in30 = new Date(now.getTime() + 30 * 86400000);

  const getInvestorObligations = (accountId: string) => obligations.filter(o => o.account_id === accountId);

  const hasOverdue = (accountId: string) => getInvestorObligations(accountId).some(o => new Date(o.due_date) < now);
  const hasDueThisWeek = (accountId: string) => getInvestorObligations(accountId).some(o => {
    const d = new Date(o.due_date);
    return d >= now && d <= in7;
  });
  const hasDueThisMonth = (accountId: string) => getInvestorObligations(accountId).some(o => {
    const d = new Date(o.due_date);
    return d >= now && d <= in30;
  });

  const nextDue = (accountId: string) => {
    const obs = getInvestorObligations(accountId).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    return obs[0] || null;
  };

  const dueDateColor = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (d < now) return 'text-red-600 font-bold';
    if (d <= in7) return 'text-red-500';
    if (d <= in14) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const filteredInvestors = investors.filter(inv => {
    if (obligationFilter === 'all') return true;
    if (obligationFilter === 'overdue') return hasOverdue(inv.id);
    if (obligationFilter === 'due_week') return hasDueThisWeek(inv.id);
    if (obligationFilter === 'due_month') return hasDueThisMonth(inv.id);
    if (obligationFilter === 'clear') return !hasOverdue(inv.id) && !hasDueThisWeek(inv.id);
    return true;
  });

  const totalCommitted = investors.reduce((s, i) => s + (Number(i.total_committed_capital) || Number(i.capital_invested) || 0), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Investors</h1>
            <p className="text-muted-foreground">Manage investor relationships & obligations</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Investor
          </Button>
        </div>

        {/* Summary */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Committed</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCommitted)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Investors</p>
                <p className="text-2xl font-bold">{investors.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-red-500" /> Overdue</p>
                <p className="text-2xl font-bold text-red-600">{obligations.filter(o => new Date(o.due_date) < now).length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due Next 7 Days</p>
                <p className="text-2xl font-bold text-amber-600">{obligations.filter(o => { const d = new Date(o.due_date); return d >= now && d <= in7; }).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Obligation Filter */}
        <Tabs value={obligationFilter} onValueChange={setObligationFilter}>
          <TabsList>
            {OBLIGATION_FILTERS.map(f => (
              <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <AccountForm open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={loadData} />
        <AccountDetail
          accountId={selectedInvestorId}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onRefresh={loadData}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvestors.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No investors match this filter</p>
              </CardContent>
            </Card>
          ) : (
            filteredInvestors.map((investor) => {
              const isOverdue = hasOverdue(investor.id);
              const next = nextDue(investor.id);
              return (
                <Card
                  key={investor.id}
                  className={`hover:shadow-md transition-shadow cursor-pointer ${isOverdue && obligationFilter === 'overdue' ? 'border-red-300 bg-red-50/50 dark:bg-red-950/10' : ''}`}
                  onClick={() => { setSelectedInvestorId(investor.id); setDetailOpen(true); }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{investor.name}</CardTitle>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {investor.type_of_account && <Badge variant="secondary" className="text-xs">{investor.type_of_account}</Badge>}
                          {investor.investor_tier && <Badge variant="outline" className="text-xs">{investor.investor_tier.replace(/_/g, ' ')}</Badge>}
                          {investor.investor_status && (
                            <Badge variant={investor.investor_status === 'Active_Investor' ? 'default' : 'outline'} className="text-xs">
                              {investor.investor_status.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Committed</p>
                        <p className="font-medium">{formatCurrency(Number(investor.total_committed_capital) || Number(investor.capital_invested) || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Called</p>
                        <p className="font-medium">{formatCurrency(Number(investor.total_called_capital) || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Distributed</p>
                        <p className="font-medium">{formatCurrency(Number(investor.total_distributed_capital) || 0)}</p>
                      </div>
                    </div>

                    {next && (
                      <div className="flex items-center gap-1.5 pt-1 border-t">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className={`text-xs ${dueDateColor(next.due_date)}`}>
                          Next due: {new Date(next.due_date).toLocaleDateString()}
                        </span>
                        {isOverdue && <Badge variant="destructive" className="text-[10px] h-4 px-1">OVERDUE</Badge>}
                      </div>
                    )}

                    {investor.city && (
                      <p className="text-xs text-muted-foreground">{[investor.city, investor.state].filter(Boolean).join(', ')}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
