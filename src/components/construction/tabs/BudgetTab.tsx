import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Plus, Save } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface BudgetTabProps {
  packageId: string;
  onUpdate?: () => void;
}

interface BudgetLine {
  id: string;
  code: string;
  name: string;
  original_budget: number;
  approved_co: number;
  revised_budget: number;
  committed: number;
  actuals: number;
  forecast_to_complete: number;
  eac: number;
  variance: number;
  percent_complete: number;
}

export function BudgetTab({ packageId, onUpdate }: BudgetTabProps) {
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newLine, setNewLine] = useState({ code: '', name: '', original_budget: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadBudgetLines();
  }, [packageId]);

  const loadBudgetLines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('budget_lines')
        .select('*')
        .eq('package_id', packageId)
        .order('code');

      if (error) throw error;
      setLines(data || []);
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

  const handleAddLine = async () => {
    if (!newLine.code || !newLine.name) {
      toast({
        title: 'Error',
        description: 'Code and Name are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('budget_lines').insert({
        package_id: packageId,
        code: newLine.code,
        name: newLine.name,
        original_budget: parseFloat(newLine.original_budget) || 0,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Budget line added',
      });

      setNewLine({ code: '', name: '', original_budget: '' });
      await loadBudgetLines();
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

  const handleUpdateLine = async (lineId: string, field: string, value: number) => {
    try {
      const { error } = await supabase
        .from('budget_lines')
        .update({ [field]: value })
        .eq('id', lineId);

      if (error) throw error;

      await loadBudgetLines();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Budget Lines</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setEditMode(!editMode)}>
          {editMode ? 'Done' : 'Edit'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Original</TableHead>
                <TableHead className="text-right">CO</TableHead>
                <TableHead className="text-right">Revised</TableHead>
                <TableHead className="text-right">Committed</TableHead>
                <TableHead className="text-right">Actuals</TableHead>
                <TableHead className="text-right">FTC</TableHead>
                <TableHead className="text-right">EAC</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">% Complete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-xs">{line.code}</TableCell>
                  <TableCell className="font-medium">{line.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(line.original_budget)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(line.approved_co)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(line.revised_budget)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(line.committed)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(line.actuals)}</TableCell>
                  <TableCell className="text-right">
                    {editMode ? (
                      <Input
                        type="number"
                        className="w-24 h-8 text-right"
                        defaultValue={line.forecast_to_complete}
                        onBlur={(e) => handleUpdateLine(line.id, 'forecast_to_complete', parseFloat(e.target.value) || 0)}
                      />
                    ) : (
                      formatCurrency(line.forecast_to_complete)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(line.eac)}</TableCell>
                  <TableCell className={`text-right font-semibold ${line.variance < 0 ? 'text-destructive' : 'text-[hsl(var(--success))]'}`}>
                    {formatCurrency(line.variance)}
                  </TableCell>
                  <TableCell className="text-right">
                    {editMode ? (
                      <Input
                        type="number"
                        className="w-20 h-8 text-right"
                        defaultValue={line.percent_complete}
                        onBlur={(e) => handleUpdateLine(line.id, 'percent_complete', parseFloat(e.target.value) || 0)}
                      />
                    ) : (
                      `${line.percent_complete.toFixed(1)}%`
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {editMode && (
                <TableRow>
                  <TableCell>
                    <Input
                      placeholder="Code"
                      className="h-8"
                      value={newLine.code}
                      onChange={(e) => setNewLine({ ...newLine, code: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Name"
                      className="h-8"
                      value={newLine.name}
                      onChange={(e) => setNewLine({ ...newLine, name: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="0"
                      className="h-8 text-right"
                      value={newLine.original_budget}
                      onChange={(e) => setNewLine({ ...newLine, original_budget: e.target.value })}
                    />
                  </TableCell>
                  <TableCell colSpan={8}>
                    <Button size="sm" onClick={handleAddLine} disabled={loading}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Line
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {lines.length === 0 && !editMode && (
          <p className="text-center text-muted-foreground py-8">
            No budget lines yet. Click Edit to add lines.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
