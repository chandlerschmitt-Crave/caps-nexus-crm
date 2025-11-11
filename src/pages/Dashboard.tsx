import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, Building2, FolderKanban, Home, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    accounts: 0,
    projects: 0,
    deals: 0,
    properties: 0,
    totalDealsValue: 0,
  });

  useEffect(() => {
    loadStats();
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
