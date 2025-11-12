import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { DrawDetail } from '../DrawDetail';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DrawsTabProps {
  packageId: string;
  onUpdate?: () => void;
}

interface Draw {
  id: string;
  draw_no: number;
  status: string;
  period_start: string | null;
  period_end: string | null;
  requested: number;
  approved: number;
  funded: number;
  file_url: string | null;
}

export function DrawsTab({ packageId, onUpdate }: DrawsTabProps) {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDrawId, setSelectedDrawId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newDraw, setNewDraw] = useState({
    period_start: '',
    period_end: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadDraws();
  }, [packageId]);

  const loadDraws = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('draws')
        .select('*')
        .eq('package_id', packageId)
        .order('draw_no', { ascending: false });

      if (error) throw error;
      setDraws(data || []);
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

  const handleCreateDraw = async () => {
    setLoading(true);
    try {
      // Get next draw number
      const maxDrawNo = draws.length > 0 ? Math.max(...draws.map(d => d.draw_no)) : 0;
      
      const { error } = await supabase.from('draws').insert({
        package_id: packageId,
        draw_no: maxDrawNo + 1,
        status: 'In_Prep',
        period_start: newDraw.period_start || null,
        period_end: newDraw.period_end || null,
        requested: 0,
        approved: 0,
        funded: 0,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Draw created',
      });

      setNewDraw({ period_start: '', period_end: '' });
      setCreateDialogOpen(false);
      await loadDraws();
      onUpdate?.();
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      In_Prep: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
      Submitted: 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]',
      Approved: 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))]',
      Funded: 'bg-[hsl(var(--success))] text-white',
      Rejected: 'bg-destructive text-white',
    };
    return colors[status] || 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]';
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Draw Requisitions</CardTitle>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Draw
          </Button>
        </CardHeader>
        <CardContent>
          {draws.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No draws yet. Click "New Draw" to create one.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Draw #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Requested</TableHead>
                    <TableHead className="text-right">Approved</TableHead>
                    <TableHead className="text-right">Funded</TableHead>
                    <TableHead>File</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draws.map((draw) => (
                    <TableRow
                      key={draw.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedDrawId(draw.id);
                        setDetailOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">Draw {draw.draw_no}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(draw.status)}>
                          {draw.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {draw.period_start && draw.period_end
                          ? `${new Date(draw.period_start).toLocaleDateString()} - ${new Date(draw.period_end).toLocaleDateString()}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(draw.requested)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(draw.approved)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(draw.funded)}</TableCell>
                      <TableCell>
                        {draw.file_url && (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Draw Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Draw</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Period Start</Label>
              <Input
                type="date"
                value={newDraw.period_start}
                onChange={(e) => setNewDraw({ ...newDraw, period_start: e.target.value })}
              />
            </div>
            <div>
              <Label>Period End</Label>
              <Input
                type="date"
                value={newDraw.period_end}
                onChange={(e) => setNewDraw({ ...newDraw, period_end: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDraw} disabled={loading}>
              Create Draw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Draw Detail */}
      <DrawDetail
        drawId={selectedDrawId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onSuccess={() => {
          loadDraws();
          onUpdate?.();
        }}
      />
    </>
  );
}
