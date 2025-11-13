import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AccountForm } from '@/components/forms/AccountForm';
import { AccountDetail } from '@/components/AccountDetail';
import { supabase } from '@/integrations/supabase/client';
import { Building2, MapPin, Phone, Globe, Plus, Users, DollarSign } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Investor {
  id: string;
  name: string;
  type_of_account: string | null;
  investor_status: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  capital_invested: number | null;
  _count?: { contacts: number };
}

export default function Investors() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [totalCapital, setTotalCapital] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
      
      // Calculate total capital invested
      const total = investorsWithCounts.reduce((sum, inv) => 
        sum + (inv.capital_invested || 0), 0
      );
      setTotalCapital(total);
    }
  };

  const handleInvestorClick = (investorId: string) => {
    setSelectedInvestorId(investorId);
    setDetailOpen(true);
  };

  const filteredInvestors = statusFilter === 'all' 
    ? investors 
    : investors.filter(inv => inv.investor_status === statusFilter);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Investors</h1>
            <p className="text-muted-foreground">Manage investor relationships</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="In_Conversation">In Conversation</SelectItem>
                <SelectItem value="Discussing_Terms">Discussing Terms</SelectItem>
                <SelectItem value="Closing_Signatures">Closing Signatures</SelectItem>
                <SelectItem value="Active_Investor">Active Investor</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Investor
            </Button>
          </div>
        </div>

        {/* Total Capital Invested Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Total Invested Capital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${totalCapital.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <AccountForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={loadInvestors}
        />

        <AccountDetail
          accountId={selectedInvestorId}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onRefresh={loadInvestors}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvestors.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  {statusFilter === 'all' ? 'No investors yet' : 'No investors with this status'}
                </p>
                <p className="text-muted-foreground mb-4">
                  {statusFilter === 'all' 
                    ? 'Add your first investor to start tracking relationships'
                    : 'Try changing the status filter'}
                </p>
                {statusFilter === 'all' && (
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Investor
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredInvestors.map((investor) => (
              <Card 
                key={investor.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleInvestorClick(investor.id)}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1">
                      <CardTitle className="text-base mb-2">
                        {investor.name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        {investor.type_of_account && (
                          <Badge variant="secondary" className="text-xs">
                            {investor.type_of_account}
                          </Badge>
                        )}
                        {investor.investor_status && (
                          <Badge 
                            variant={investor.investor_status === 'Active_Investor' ? 'default' : 'outline'} 
                            className="text-xs"
                          >
                            {investor.investor_status.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
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
