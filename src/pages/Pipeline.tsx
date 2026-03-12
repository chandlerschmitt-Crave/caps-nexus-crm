import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DollarSign, TrendingUp, Home, Building2, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { differenceInDays } from 'date-fns';

interface Deal {
  id: string;
  name: string;
  amount_target: number;
  stage: string;
  instrument: string;
  close_date: string | null;
  probability: number | null;
  created_at: string;
  project?: { name: string; vertical: string | null } | null;
  owner?: { name: string } | null;
}

interface FinancialMetrics {
  totalHardCosts: number;
  totalSoftCosts: number;
  totalPurchaseCosts: number;
  totalARV: number;
  totalExitCosts: number;
  totalProjectedProfit: number;
}

interface ProjectStage {
  name: string;
  value: number;
}

const STAGES = ['Sourcing', 'Intro', 'Diligence', 'LOI_Out', 'Negotiation', 'Docs', 'Closed_Won', 'Closed_Lost'];
const INSTRUMENTS = ['Equity', 'Debt', 'Seller_Carry', 'SAFE', 'Rev_Share', 'Token'];
const VERTICALS = ['TerraQore', 'VoltQore', 'Malibu_Luxury_Estates', 'Digital_Assets', 'CAPS_Platform'];
const COLORS = ['#0C1C2E', '#C8A25E', '#5DA3B2', '#E5D9C4', '#8B7355', '#6B7078', '#A68E72'];

const VERTICAL_BADGE_COLORS: Record<string, string> = {
  TerraQore: 'bg-emerald-500/20 text-emerald-700',
  VoltQore: 'bg-blue-500/20 text-blue-700',
  Malibu_Luxury_Estates: 'bg-amber-500/20 text-amber-700',
  Digital_Assets: 'bg-purple-500/20 text-purple-700',
};

export default function Pipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalHardCosts: 0, totalSoftCosts: 0, totalPurchaseCosts: 0,
    totalARV: 0, totalExitCosts: 0, totalProjectedProfit: 0,
  });
  const [projectStages, setProjectStages] = useState<ProjectStage[]>([]);
  // Filters
  const [filterVertical, setFilterVertical] = useState('all');
  const [filterInstrument, setFilterInstrument] = useState('all');
  const [filterOwner, setFilterOwner] = useState('all');
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadDeals();
    loadMetrics();
    loadProjectStages();
    loadOwners();
  }, []);

  const loadDeals = async () => {
    const { data } = await supabase
      .from('deals')
      .select('*, project:projects(name, vertical), owner:profiles(name)')
      .order('created_at', { ascending: false });
    setDeals(data as any || []);
  };

  const loadOwners = async () => {
    const { data } = await supabase.from('profiles').select('id, name');
    setOwners(data || []);
  };

  const loadMetrics = async () => {
    const { data: properties } = await supabase
      .from('properties')
      .select('construction_hard, softs, purchase, arv, exit_costs, projected_profit');
    if (properties) {
      setMetrics({
        totalHardCosts: properties.reduce((s, p) => s + (Number(p.construction_hard) || 0), 0),
        totalSoftCosts: properties.reduce((s, p) => s + (Number(p.softs) || 0), 0),
        totalPurchaseCosts: properties.reduce((s, p) => s + (Number(p.purchase) || 0), 0),
        totalARV: properties.reduce((s, p) => s + (Number(p.arv) || 0), 0),
        totalExitCosts: properties.reduce((s, p) => s + (Number(p.exit_costs) || 0), 0),
        totalProjectedProfit: properties.reduce((s, p) => s + (Number(p.projected_profit) || 0), 0),
      });
    }
  };

  const loadProjectStages = async () => {
    const { data: projects } = await supabase.from('projects').select('stage');
    if (projects) {
      const stageCounts: Record<string, number> = {};
      projects.forEach(p => { stageCounts[p.stage] = (stageCounts[p.stage] || 0) + 1; });
      setProjectStages(Object.entries(stageCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })));
    }
  };

  // Apply filters
  const filteredDeals = deals.filter(d => {
    if (filterVertical !== 'all' && d.project?.vertical !== filterVertical) return false;
    if (filterInstrument !== 'all' && d.instrument !== filterInstrument) return false;
    if (filterOwner !== 'all') {
      const ownerName = d.owner?.name;
      if (ownerName !== owners.find(o => o.id === filterOwner)?.name) return false;
    }
    return true;
  });

  const getStageDeals = (stage: string) => filteredDeals.filter(d => d.stage === stage);

  const getTimeInStage = (deal: Deal) => {
    // Approximate: days since created (ideally would track stage change date)
    return differenceInDays(new Date(), new Date(deal.created_at));
  };

  const getTimeInStageColor = (days: number) => {
    if (days > 30) return 'text-destructive';
    if (days > 14) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const calculateGrossMargin = () => {
    const totalCosts = metrics.totalHardCosts + metrics.totalSoftCosts + metrics.totalPurchaseCosts;
    if (totalCosts === 0 || metrics.totalARV === 0) return 0;
    return ((metrics.totalARV - totalCosts) / metrics.totalARV) * 100;
  };

  const calculateROI = () => {
    const totalUses = metrics.totalHardCosts + metrics.totalSoftCosts + metrics.totalPurchaseCosts;
    if (totalUses === 0) return 0;
    return (metrics.totalProjectedProfit / totalUses) * 100;
  };

  // Pipeline Value Summary
  const pipelineSummary = STAGES.filter(s => s !== 'Closed_Lost').map(stage => {
    const stageDeals = getStageDeals(stage);
    const total = stageDeals.reduce((s, d) => s + (Number(d.amount_target) || 0), 0);
    return { stage, total, count: stageDeals.length };
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground">Financial overview and deal tracking</p>
        </div>

        {/* Financial Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Hard Costs</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalHardCosts)}</div>
              <p className="text-xs text-muted-foreground mt-1">Construction & development</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Soft Costs</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalSoftCosts)}</div>
              <p className="text-xs text-muted-foreground mt-1">Professional fees & permits</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Purchase Costs</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalPurchaseCosts)}</div>
              <p className="text-xs text-muted-foreground mt-1">Land & property acquisition</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total ARV</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalARV)}</div>
              <p className="text-xs text-muted-foreground mt-1">After repair value</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Exit Costs & Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-muted-foreground">Exit: {formatCurrency(metrics.totalExitCosts)}</div>
              <div className="text-2xl font-bold mt-1">{formatCurrency(metrics.totalProjectedProfit)}</div>
              <p className="text-xs text-muted-foreground mt-1">Projected profit</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div><div className="text-xs text-muted-foreground">Gross Margin</div><div className="text-xl font-bold">{calculateGrossMargin().toFixed(1)}%</div></div>
                <div><div className="text-xs text-muted-foreground">ROI on Uses</div><div className="text-xl font-bold">{calculateROI().toFixed(1)}%</div></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Stages Chart */}
        {projectStages.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Projects by Stage</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={projectStages} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} dataKey="value">
                    {projectStages.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Pipeline Value Summary Bar */}
        <Card>
          <CardHeader><CardTitle className="text-base">Pipeline Value by Stage</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {pipelineSummary.map(s => (
                <div key={s.stage} className="flex-shrink-0 text-center p-3 rounded-md bg-muted/50 min-w-[120px]">
                  <p className="text-xs text-muted-foreground font-medium">{s.stage.replace(/_/g, ' ')}</p>
                  <p className="text-lg font-bold">${(s.total / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-muted-foreground">{s.count} deal{s.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Select value={filterVertical} onValueChange={setFilterVertical}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Verticals" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verticals</SelectItem>
              {VERTICALS.map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterInstrument} onValueChange={setFilterInstrument}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Instruments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Instruments</SelectItem>
              {INSTRUMENTS.map(i => <SelectItem key={i} value={i}>{i.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterOwner} onValueChange={setFilterOwner}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Owners" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {owners.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Deals Kanban */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Deal Flow</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-x-auto">
            {STAGES.map((stage) => {
              const stageDeals = getStageDeals(stage);
              const totalValue = stageDeals.reduce((sum, deal) => sum + (Number(deal.amount_target) || 0), 0);

              return (
                <div key={stage} className="space-y-3">
                  <div className="sticky top-0 bg-background pb-2">
                    <h3 className="font-semibold text-sm">{stage.replace(/_/g, ' ')}</h3>
                    <p className="text-xs text-muted-foreground">
                      {stageDeals.length} deals • ${(totalValue / 1000000).toFixed(1)}M
                    </p>
                  </div>

                  <div className="space-y-2">
                    {stageDeals.map((deal) => {
                      const daysInStage = getTimeInStage(deal);
                      const timeColor = getTimeInStageColor(daysInStage);

                      return (
                        <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium">{deal.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-2">
                            <div className="text-lg font-bold text-primary">
                              ${(Number(deal.amount_target) / 1000000).toFixed(1)}M
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="secondary" className="text-xs">{deal.instrument}</Badge>
                              {deal.probability && <Badge variant="outline" className="text-xs">{deal.probability}%</Badge>}
                            </div>
                            {deal.project && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <p className="text-xs text-muted-foreground">{deal.project.name}</p>
                                {deal.project.vertical && (
                                  <Badge variant="outline" className={`text-[10px] py-0 ${VERTICAL_BADGE_COLORS[deal.project.vertical] || ''}`}>
                                    {deal.project.vertical.replace(/_/g, ' ')}
                                  </Badge>
                                )}
                              </div>
                            )}
                            {deal.owner && <p className="text-xs text-muted-foreground">Owner: {deal.owner.name}</p>}
                            {/* Time in stage */}
                            <div className={`flex items-center gap-1 text-xs ${timeColor}`}>
                              <Clock className="h-3 w-3" />
                              <span>{daysInStage}d in stage</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
