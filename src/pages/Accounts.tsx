import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Globe, Phone, Plus, LayoutGrid, List } from 'lucide-react';
import { AccountForm } from '@/components/forms/AccountForm';
import { AccountDetail } from '@/components/AccountDetail';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useViewMode } from '@/hooks/use-view-mode';

interface Account {
  id: string;
  name: string;
  type_of_account: string | null;
  website: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useViewMode('accounts');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .order('name');

    setAccounts(data || []);
  };

  const handleAccountClick = (accountId: string) => {
    setSelectedAccountId(accountId);
    setDetailOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
            <p className="text-muted-foreground">
              Organizations and partners
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
            <div className="flex border rounded-md">
              <Button variant={viewMode === 'card' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('card')}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('table')}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

        <AccountForm 
          open={formOpen} 
          onOpenChange={setFormOpen} 
          onSuccess={loadAccounts}
        />

        <AccountDetail
          accountId={selectedAccountId}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onRefresh={loadAccounts}
        />

        {viewMode === 'table' ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleAccountClick(account.id)}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{account.type_of_account ? <Badge variant="secondary" className="text-xs">{account.type_of_account.replace(/_/g, ' ')}</Badge> : '—'}</TableCell>
                    <TableCell>{account.website ? <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm truncate max-w-[200px] block" onClick={e => e.stopPropagation()}>{account.website}</a> : '—'}</TableCell>
                    <TableCell>{account.phone || '—'}</TableCell>
                    <TableCell>{[account.city, account.state].filter(Boolean).join(', ') || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card 
                key={account.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleAccountClick(account.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">{account.name}</h3>
                      </div>
                      {account.type_of_account && (
                        <Badge variant="secondary" className="text-xs">
                          {account.type_of_account.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {account.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <a href={account.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate" onClick={e => e.stopPropagation()}>
                          {account.website}
                        </a>
                      </div>
                    )}
                    {account.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{account.phone}</span>
                      </div>
                    )}
                    {(account.city || account.state) && (
                      <div className="flex items-center gap-2">
                        <span>{account.city}{account.city && account.state && ', '}{account.state}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
