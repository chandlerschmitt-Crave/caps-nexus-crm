import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HardHat, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { BudgetTab } from './tabs/BudgetTab';
import { DrawsTab } from './tabs/DrawsTab';
import { formatCurrency } from '@/lib/formatters';

interface ConstructionPackageDetailProps {
  packageId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

interface PackageData {
  id: string;
  name: string;
  phase: string;
  retainage_pct: number;
  start_date: string | null;
  substantial_completion: string | null;
  notes: string | null;
}

interface BudgetSummary {
  revised_budget: number;
  committed: number;
  actuals: number;
  eac: number;
  variance: number;
  percent_complete: number;
  retainage_held: number;
}

export function ConstructionPackageDetail({
  packageId,
  open,
  onOpenChange,
  onRefresh,
}: ConstructionPackageDetailProps) {
  const [pkg, setPkg] = useState<PackageData | null>(null);
  const [summary, setSummary] = useState<BudgetSummary>({
    revised_budget: 0,
    committed: 0,
    actuals: 0,
    eac: 0,
    variance: 0,
    percent_complete: 0,
    retainage_held: 0,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (packageId && open) {
      loadPackageDetails();
    }
  }, [packageId, open]);

  const loadPackageDetails = async () => {
    if (!packageId) return;

    setLoading(true);
    try {
      const { data: pkgData, error: pkgError } = await supabase
        .from('construction_packages')
        .select('*')
        .eq('id', packageId)
        .maybeSingle();

      if (pkgError) throw pkgError;
      setPkg(pkgData);

      // Load budget summary
      const { data: budgetLines } = await supabase
        .from('budget_lines')
        .select('*')
        .eq('package_id', packageId);

      const { data: invoices } = await supabase
        .from('invoices')
        .select('retainage_held')
        .eq('package_id', packageId)
        .in('status', ['Approved', 'Paid']);

      if (budgetLines && budgetLines.length > 0) {
        const totalRevisedBudget = budgetLines.reduce((sum, line) => sum + (Number(line.revised_budget) || 0), 0);
        const totalCommitted = budgetLines.reduce((sum, line) => sum + (Number(line.committed) || 0), 0);
        const totalActuals = budgetLines.reduce((sum, line) => sum + (Number(line.actuals) || 0), 0);
        const totalEac = budgetLines.reduce((sum, line) => sum + (Number(line.eac) || 0), 0);
        const totalVariance = budgetLines.reduce((sum, line) => sum + (Number(line.variance) || 0), 0);
        const weightedComplete = budgetLines.reduce(
          (sum, line) => sum + (Number(line.percent_complete) || 0) * (Number(line.revised_budget) || 0),
          0
        ) / (totalRevisedBudget || 1);

        const totalRetainage = invoices?.reduce((sum, inv) => sum + (Number(inv.retainage_held) || 0), 0) || 0;

        setSummary({
          revised_budget: totalRevisedBudget,
          committed: totalCommitted,
          actuals: totalActuals,
          eac: totalEac,
          variance: totalVariance,
          percent_complete: weightedComplete,
          retainage_held: totalRetainage,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (phase: string) => {
    const colors: Record<string, string> = {
      Precon: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
      Active: 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))]',
      Punchlist: 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]',
      Closed: 'bg-[hsl(var(--success))] text-white',
    };
    return colors[phase] || 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]';
  };

  if (!pkg) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <HardHat className="h-5 w-5" />
            <SheetTitle>{pkg.name}</SheetTitle>
          </div>
          <SheetDescription>Construction package details and tracking</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Header Summary */}
          <Card className="border-t-2 border-t-[hsl(var(--accent))]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Package Summary</CardTitle>
                <Badge className={getPhaseColor(pkg.phase)}>{pkg.phase}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">% Complete</div>
                  <div className="text-2xl font-bold text-[hsl(var(--primary))]">
                    {summary.percent_complete.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Revised Budget</div>
                  <div className="text-lg font-semibold">{formatCurrency(summary.revised_budget)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">EAC</div>
                  <div className="text-lg font-semibold">{formatCurrency(summary.eac)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    Variance
                    {summary.variance < 0 && <AlertTriangle className="h-3 w-3 text-destructive" />}
                  </div>
                  <div className={`text-lg font-semibold ${summary.variance < 0 ? 'text-destructive' : 'text-[hsl(var(--success))]'}`}>
                    {formatCurrency(summary.variance)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground">Committed</div>
                  <div className="text-sm font-medium">{formatCurrency(summary.committed)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Actuals</div>
                  <div className="text-sm font-medium">{formatCurrency(summary.actuals)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Retainage Held</div>
                  <div className="text-sm font-medium">{formatCurrency(summary.retainage_held)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="budget" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="budget">Budget</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="draws">Draws</TabsTrigger>
            </TabsList>
            
            <TabsContent value="budget" className="mt-4">
              <BudgetTab packageId={packageId} onUpdate={loadPackageDetails} />
            </TabsContent>
            
            <TabsContent value="invoices" className="mt-4">
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">Invoices coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="draws" className="mt-4">
              <DrawsTab packageId={packageId} onUpdate={loadPackageDetails} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
