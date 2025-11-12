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
  section: string | null;
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

  const handleUpdateLine = async (lineId: string, field: string, value: number | string) => {
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

  // Group lines by section
  const groupedLines = lines.reduce((acc, line) => {
    const section = line.section || 'Uncategorized';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(line);
    return acc;
  }, {} as Record<string, BudgetLine[]>);

  // Calculate section totals
  const getSectionTotals = (sectionLines: BudgetLine[]) => {
    return sectionLines.reduce((acc, line) => ({
      original_budget: acc.original_budget + (line.original_budget || 0),
      approved_co: acc.approved_co + (line.approved_co || 0),
      revised_budget: acc.revised_budget + (line.revised_budget || 0),
      committed: acc.committed + (line.committed || 0),
      actuals: acc.actuals + (line.actuals || 0),
      forecast_to_complete: acc.forecast_to_complete + (line.forecast_to_complete || 0),
      eac: acc.eac + (line.eac || 0),
      variance: acc.variance + (line.variance || 0),
    }), {
      original_budget: 0,
      approved_co: 0,
      revised_budget: 0,
      committed: 0,
      actuals: 0,
      forecast_to_complete: 0,
      eac: 0,
      variance: 0,
    });
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
        <div className="space-y-6">
          {Object.entries(groupedLines).map(([section, sectionLines]) => {
            const sectionTotals = getSectionTotals(sectionLines);
            
            return (
              <div key={section} className="space-y-2">
                <h4 className="font-semibold text-primary sticky top-0 bg-background py-2">
                  {section}
                </h4>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Section</TableHead>
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
                      {sectionLines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            {editMode ? (
                              <Input
                                type="text"
                                className="w-28 h-8"
                                defaultValue={line.section || ''}
                                onBlur={(e) => handleUpdateLine(line.id, 'section', e.target.value)}
                                placeholder="Section"
                              />
                            ) : (
                              line.section || '-'
                            )}
                          </TableCell>
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
                      {/* Section Subtotals */}
                      <TableRow className="bg-muted/50 font-semibold border-t-2">
                        <TableCell colSpan={3} className="text-right">
                          {section} Subtotal
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(sectionTotals.original_budget)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sectionTotals.approved_co)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sectionTotals.revised_budget)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sectionTotals.committed)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sectionTotals.actuals)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sectionTotals.forecast_to_complete)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sectionTotals.eac)}</TableCell>
                        <TableCell className={`text-right ${sectionTotals.variance < 0 ? 'text-destructive' : 'text-[hsl(var(--success))]'}`}>
                          {formatCurrency(sectionTotals.variance)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}

          {editMode && (
            <div className="rounded-md border p-4">
              <h4 className="font-semibold mb-3">Add New Line</h4>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  placeholder="Code"
                  value={newLine.code}
                  onChange={(e) => setNewLine({ ...newLine, code: e.target.value })}
                />
                <Input
                  placeholder="Name"
                  value={newLine.name}
                  onChange={(e) => setNewLine({ ...newLine, name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Original Budget"
                  value={newLine.original_budget}
                  onChange={(e) => setNewLine({ ...newLine, original_budget: e.target.value })}
                />
                <Button onClick={handleAddLine} disabled={loading} className="col-span-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>
            </div>
          )}
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
