import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Globe, Phone, Plus } from 'lucide-react';
import { AccountForm } from '@/components/forms/AccountForm';

interface Account {
  id: string;
  name: string;
  type: string;
  website: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formOpen, setFormOpen] = useState(false);

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
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>

        <AccountForm 
          open={formOpen} 
          onOpenChange={setFormOpen} 
          onSuccess={loadAccounts}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{account.name}</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {account.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {account.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <a
                        href={account.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary truncate"
                      >
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
                      <span>
                        {account.city}
                        {account.city && account.state && ', '}
                        {account.state}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
