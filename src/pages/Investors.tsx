import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AccountForm } from '@/components/forms/AccountForm';
import { supabase } from '@/integrations/supabase/client';
import { Building2, MapPin, Phone, Globe, Plus, Users } from 'lucide-react';

interface Investor {
  id: string;
  name: string;
  type_of_account: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  _count?: { contacts: number };
}

export default function Investors() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadInvestors();
  }, []);

  const loadInvestors = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .in('type_of_account', ['Investor', 'Fund', 'HoldCo'])
      .order('name');

    // Get contact counts for each investor
    if (data) {
      const investorsWithCounts = await Promise.all(
        data.map(async (investor) => {
          const { count } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('account_id', investor.id);
          
          return {
            ...investor,
            _count: { contacts: count || 0 }
          };
        })
      );
      setInvestors(investorsWithCounts);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Investors</h1>
            <p className="text-muted-foreground">Manage investor relationships</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Investor
          </Button>
        </div>

        <AccountForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={loadInvestors}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {investors.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No investors yet</p>
                <p className="text-muted-foreground mb-4">
                  Add your first investor to start tracking relationships
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Investor
                </Button>
              </CardContent>
            </Card>
          ) : (
            investors.map((investor) => (
              <Card key={investor.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1">
                      <CardTitle className="text-base mb-2">
                        {investor.name}
                      </CardTitle>
                      {investor.type_of_account && (
                        <Badge variant="secondary" className="text-xs">
                          {investor.type_of_account}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(investor.city || investor.state) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {investor.city && investor.state 
                          ? `${investor.city}, ${investor.state}`
                          : investor.city || investor.state}
                        {investor.country && ` (${investor.country})`}
                      </span>
                    </div>
                  )}

                  {investor.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${investor.phone}`} className="hover:underline">
                        {investor.phone}
                      </a>
                    </div>
                  )}

                  {investor.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a 
                        href={investor.website.startsWith('http') ? investor.website : `https://${investor.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-primary truncate"
                      >
                        {investor.website}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm pt-2 border-t">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {investor._count?.contacts || 0} contact{investor._count?.contacts !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {investor.notes && (
                    <div className="text-sm text-muted-foreground line-clamp-2 pt-2">
                      {investor.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
