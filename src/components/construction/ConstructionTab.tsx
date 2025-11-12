import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, HardHat } from 'lucide-react';
import { ConstructionPackageForm } from '@/components/forms/ConstructionPackageForm';
import { ConstructionPackageDetail } from './ConstructionPackageDetail';

interface ConstructionTabProps {
  projectId: string;
}

interface ConstructionPackage {
  id: string;
  name: string;
  phase: string;
  start_date: string | null;
  substantial_completion: string | null;
  retainage_pct: number;
}

export function ConstructionTab({ projectId }: ConstructionTabProps) {
  const [packages, setPackages] = useState<ConstructionPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPackages();
  }, [projectId]);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('construction_packages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPackages(data || []);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardHat className="h-5 w-5 text-[hsl(var(--primary))]" />
          <h3 className="text-lg font-semibold">Construction Packages</h3>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Package
        </Button>
      </div>

      {packages.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No construction packages yet. Create one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-t-2 border-t-[hsl(var(--accent))]"
              onClick={() => {
                setSelectedPackageId(pkg.id);
                setDetailOpen(true);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{pkg.name}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className={getPhaseColor(pkg.phase)}>
                        {pkg.phase}
                      </Badge>
                      <Badge variant="outline">
                        Retainage: {pkg.retainage_pct}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {pkg.start_date && (
                    <div>
                      <span className="text-muted-foreground">Start: </span>
                      <span>{new Date(pkg.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {pkg.substantial_completion && (
                    <div>
                      <span className="text-muted-foreground">Completion: </span>
                      <span>{new Date(pkg.substantial_completion).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Construction Package</DialogTitle>
          </DialogHeader>
          <ConstructionPackageForm
            projectId={projectId}
            onSuccess={() => {
              setFormOpen(false);
              loadPackages();
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConstructionPackageDetail
        packageId={selectedPackageId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onRefresh={loadPackages}
      />
    </div>
  );
}
