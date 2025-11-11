import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

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

export default function Pipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    loadDeals();
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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground">Track deals across stages</p>
        </div>

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
    </Layout>
  );
}
