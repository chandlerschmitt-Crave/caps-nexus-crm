import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, Building2, FolderKanban, Home, TrendingUp, DollarSign, Users, PieChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface InvestorDeal {
  id: string;
  name: string;
  amount_target: number;
  close_date: string | null;
  instrument: string;
  account: { name: string } | null;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    accounts: 0,
    projects: 0,
    deals: 0,
    properties: 0,
    totalDealsValue: 0,
  });
  const [investorStats, setInvestorStats] = useState({
    totalInvested: 0,
    investorCount: 0,
    avgInvestment: 0,
    recentDeals: [] as InvestorDeal[],
  });

  useEffect(() => {
    loadStats();
    loadInvestorStats();
  }, []);

  const loadStats = async () => {
    const [accountsRes, projectsRes, dealsRes, propertiesRes] = await Promise.all([
      supabase.from('accounts').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('deals').select('amount_target'),
      supabase.from('properties').select('*', { count: 'exact', head: true }),
    ]);

    const totalDealsValue = dealsRes.data?.reduce((sum, deal) => 
      sum + (Number(deal.amount_target) || 0), 0
    ) || 0;

    setStats({
      accounts: accountsRes.count || 0,
      projects: projectsRes.count || 0,
      deals: dealsRes.data?.length || 0,
      properties: propertiesRes.count || 0,
      totalDealsValue,
    });
  };

  const loadInvestorStats = async () => {
    // Get all closed won deals from investor accounts
    const { data: closedDeals } = await supabase
      .from('deals')
      .select('id, name, amount_target, close_date, instrument, account:accounts!inner(name, type_of_account)')
      .eq('stage', 'Closed_Won')
      .in('account.type_of_account', ['Investor', 'Fund', 'HoldCo'])
      .order('close_date', { ascending: false })
      .limit(5);

    const totalInvested = closedDeals?.reduce((sum, deal) => 
      sum + (Number(deal.amount_target) || 0), 0
    ) || 0;

    // Get unique investor count
    const { data: investors } = await supabase
      .from('accounts')
      .select('id')
      .in('type_of_account', ['Investor', 'Fund', 'HoldCo']);

    const investorCount = investors?.length || 0;
    const avgInvestment = investorCount > 0 ? totalInvested / investorCount : 0;

    setInvestorStats({
      totalInvested,
      investorCount,
      avgInvestment,
      recentDeals: (closedDeals || []) as InvestorDeal[],
    });
  };

  const statCards = [
    {
      title: 'Total Accounts',
      value: stats.accounts,
      icon: Building2,
      description: 'Organizations tracked',
    },
    {
      title: 'Active Projects',
      value: stats.projects,
      icon: FolderKanban,
      description: 'Development initiatives',
    },
    {
      title: 'Pipeline Value',
      value: `$${(stats.totalDealsValue / 1000000).toFixed(1)}M`,
      icon: TrendingUp,
      description: `${stats.deals} active deals`,
    },
    {
      title: 'Properties',
      value: stats.properties,
      icon: Home,
      description: 'Real estate assets',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Caps Capital Enterprises CRM
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Invested Capital
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(investorStats.totalInvested / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                From closed deals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Investors
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{investorStats.investorCount}</div>
              <p className="text-xs text-muted-foreground">
                Investors, Funds & HoldCos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Investment
              </CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(investorStats.avgInvestment / 1000000).toFixed(2)}M
              </div>
              <p className="text-xs text-muted-foreground">
                Per investor
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Investments</CardTitle>
          </CardHeader>
          <CardContent>
            {investorStats.recentDeals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No closed investments yet. Track your first deal to see it here.
              </p>
            ) : (
              <div className="space-y-3">
                {investorStats.recentDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{deal.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {deal.account?.name}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {deal.instrument}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        ${(Number(deal.amount_target) / 1000000).toFixed(2)}M
                      </p>
                      {deal.close_date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(deal.close_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Your CRM is set up and ready to use. Get started by:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Adding accounts (organizations like TerraQore, Malibu Luxury Estates)</li>
              <li>Creating projects (AI Data Center, Luxury Residential)</li>
              <li>Tracking deals in the Pipeline view</li>
              <li>Managing properties in Malibu and other markets</li>
              <li>Recording activities and tasks for follow-ups</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
