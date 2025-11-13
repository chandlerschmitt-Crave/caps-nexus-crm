import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DollarSign, TrendingUp, Home, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface Deal {
  id: string;
  name: string;
  amount_target: number;
  stage: string;
  instrument: string;
  close_date: string | null;
  probability: number | null;
  project?: { name: string };
  owner?: { name: string };
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

export default function Pipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalHardCosts: 0,
    totalSoftCosts: 0,
    totalPurchaseCosts: 0,
    totalARV: 0,
    totalExitCosts: 0,
    totalProjectedProfit: 0,
  });
  const [projectStages, setProjectStages] = useState<ProjectStage[]>([]);

  useEffect(() => {
    loadDeals();
    loadMetrics();
    loadProjectStages();
  }, []);

  const loadDeals = async () => {
    const { data } = await supabase
      .from('deals')
      .select(`
        *,
        project:projects(name),
        owner:profiles(name)
      `)
      .order('created_at', { ascending: false });

    setDeals(data as any || []);
  };

  const loadMetrics = async () => {
    const { data: properties } = await supabase
      .from('properties')
      .select('construction_hard, softs, purchase, arv, exit_costs, projected_profit');

    if (properties) {
      const metrics: FinancialMetrics = {
        totalHardCosts: properties.reduce((sum, p) => sum + (Number(p.construction_hard) || 0), 0),
        totalSoftCosts: properties.reduce((sum, p) => sum + (Number(p.softs) || 0), 0),
        totalPurchaseCosts: properties.reduce((sum, p) => sum + (Number(p.purchase) || 0), 0),
        totalARV: properties.reduce((sum, p) => sum + (Number(p.arv) || 0), 0),
        totalExitCosts: properties.reduce((sum, p) => sum + (Number(p.exit_costs) || 0), 0),
        totalProjectedProfit: properties.reduce((sum, p) => sum + (Number(p.projected_profit) || 0), 0),
      };
      setMetrics(metrics);
    }
  };

  const loadProjectStages = async () => {
    const { data: projects } = await supabase
      .from('projects')
      .select('stage');

    if (projects) {
      const stageCounts: Record<string, number> = {};
      projects.forEach(p => {
        stageCounts[p.stage] = (stageCounts[p.stage] || 0) + 1;
      });

      const stageData = Object.entries(stageCounts).map(([name, value]) => ({
        name: name.replace('_', ' '),
        value,
      }));
      setProjectStages(stageData);
    }
  };

  const stages = [
    'Sourcing',
    'Intro',
    'Diligence',
    'LOI_Out',
    'Negotiation',
    'Docs',
    'Closed_Won',
    'Closed_Lost',
  ];

  const getStageDeals = (stage: string) => deals.filter((d) => d.stage === stage);

  const COLORS = ['#0C1C2E', '#C8A25E', '#5DA3B2', '#E5D9C4', '#8B7355', '#6B7078', '#A68E72'];

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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground">Financial overview and deal tracking</p>
        </div>

        {/* Financial Metrics Dashboard */}
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
              <div className="text-sm font-medium text-muted-foreground">Exit Costs: {formatCurrency(metrics.totalExitCosts)}</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(metrics.totalProjectedProfit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Projected profit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">Gross Margin</div>
                  <div className="text-xl font-bold">{calculateGrossMargin().toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">ROI on Uses</div>
                  <div className="text-xl font-bold">{calculateROI().toFixed(1)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Stages Chart */}
        {projectStages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Projects by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectStages}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {projectStages.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Deals Kanban */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Deal Flow</h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-x-auto">
          {stages.map((stage) => {
            const stageDeals = getStageDeals(stage);
            const totalValue = stageDeals.reduce(
              (sum, deal) => sum + (Number(deal.amount_target) || 0),
              0
            );

            return (
              <div key={stage} className="space-y-3">
                <div className="sticky top-0 bg-background pb-2">
                  <h3 className="font-semibold text-sm">
                    {stage.replace('_', ' ')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {stageDeals.length} deals • $
                    {(totalValue / 1000000).toFixed(1)}M
                  </p>
                </div>

                <div className="space-y-2">
                  {stageDeals.map((deal) => (
                    <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {deal.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        <div className="text-lg font-bold text-primary">
                          ${(Number(deal.amount_target) / 1000000).toFixed(1)}M
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {deal.instrument}
                          </Badge>
                          {deal.probability && (
                            <Badge variant="outline" className="text-xs">
                              {deal.probability}%
                            </Badge>
                          )}
                        </div>
                        {deal.project && (
                          <p className="text-xs text-muted-foreground">
                            {deal.project.name}
                          </p>
                        )}
                        {deal.owner && (
                          <p className="text-xs text-muted-foreground">
                            Owner: {deal.owner.name}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
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
