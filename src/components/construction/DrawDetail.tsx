import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface DrawDetailProps {
  drawId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ContinuationLine {
  budget_line_id: string;
  section: string;
  code: string;
  name: string;
  revised_budget: number;
  prior_to_date: number;
  this_period: number;
  to_date: number;
  remaining: number;
  percent_complete: number;
}

interface Draw {
  id: string;
  draw_no: number;
  status: string;
  period_start: string | null;
  period_end: string | null;
  requested: number;
  file_url: string | null;
  package: {
    name: string;
  };
}

export function DrawDetail({ drawId, open, onOpenChange, onSuccess }: DrawDetailProps) {
  const [draw, setDraw] = useState<Draw | null>(null);
  const [continuationLines, setContinuationLines] = useState<ContinuationLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (drawId && open) {
      loadDrawDetails();
    }
  }, [drawId, open]);

  const loadDrawDetails = async () => {
    if (!drawId) return;

    setLoading(true);
    try {
      // Load draw details
      const { data: drawData } = await supabase
        .from('draws')
        .select('*, package:construction_packages(name)')
        .eq('id', drawId)
        .single();

      setDraw(drawData as any);

      // Load continuation sheet lines
      const { data: linesData } = await supabase
        .from('v_draw_continuation')
        .select('*')
        .eq('draw_id', drawId);

      setContinuationLines(linesData as any || []);
    } finally {
      setLoading(false);
    }
  };

  const handleThisPeriodChange = async (budgetLineId: string, value: number) => {
    // Find the line
    const line = continuationLines.find(l => l.budget_line_id === budgetLineId);
    if (!line) return;

    // Calculate new to_date
    const newToDate = line.prior_to_date + value;
    const newRemaining = line.revised_budget - newToDate;

    // Check if overdrawing
    if (newToDate > line.revised_budget) {
      const overAmount = newToDate - line.revised_budget;
      const confirmed = window.confirm(
        `This draw exceeds the revised budget for "${line.name}" by $${overAmount.toLocaleString()}.\n\nAllow override?`
      );
      if (!confirmed) return;
    }

    // Update draw_line
    const { error } = await supabase
      .from('draw_lines')
      .upsert({
        draw_id: drawId,
        budget_line_id: budgetLineId,
        this_period: value,
        prior_to_date: line.prior_to_date,
        to_date_after: newToDate,
      }, {
        onConflict: 'draw_id,budget_line_id'
      });

    if (error) {
      toast.error('Failed to update draw line');
      return;
    }

    // Reload
    loadDrawDetails();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !drawId) return;

    setUploading(true);
    try {
      // For now, just store the file name as a placeholder
      // In production, you would upload to storage and get a URL
      const { error } = await supabase
        .from('draws')
        .update({ file_url: file.name })
        .eq('id', drawId);

      if (error) throw error;

      toast.success('File uploaded successfully');
      loadDrawDetails();
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Group lines by section
  const groupedLines = continuationLines.reduce((acc, line) => {
    const section = line.section || 'Uncategorized';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(line);
    return acc;
  }, {} as Record<string, ContinuationLine[]>);

  // Calculate section totals
  const getSectionTotals = (lines: ContinuationLine[]) => {
    return lines.reduce((acc, line) => ({
      revised_budget: acc.revised_budget + (line.revised_budget || 0),
      prior_to_date: acc.prior_to_date + (line.prior_to_date || 0),
      this_period: acc.this_period + (line.this_period || 0),
      to_date: acc.to_date + (line.to_date || 0),
      remaining: acc.remaining + (line.remaining || 0),
    }), {
      revised_budget: 0,
      prior_to_date: 0,
      this_period: 0,
      to_date: 0,
      remaining: 0,
    });
  };

  // Calculate package totals
  const packageTotals = getSectionTotals(continuationLines);

  if (!draw) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-6xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            Draw #{draw.draw_no} - {draw.package?.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Header Info */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge>{draw.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Period</p>
              <p className="font-medium">
                {draw.period_start && draw.period_end
                  ? `${new Date(draw.period_start).toLocaleDateString()} - ${new Date(draw.period_end).toLocaleDateString()}`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Draw</p>
              <p className="font-medium text-lg">${packageTotals.this_period.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="font-medium text-lg">${packageTotals.remaining.toLocaleString()}</p>
            </div>
          </div>

          {/* File Upload */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => document.getElementById('draw-file-upload')?.click()}
              disabled={uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Draw Package'}
            </Button>
            <input
              id="draw-file-upload"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xlsx"
            />
            {draw.file_url && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {draw.file_url}
              </div>
            )}
          </div>

          {/* Continuation Sheet */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Continuation Sheet</h3>
            
            {Object.entries(groupedLines).map(([section, lines]) => {
              const sectionTotals = getSectionTotals(lines);
              
              return (
                <div key={section} className="space-y-2">
                  <h4 className="font-medium text-primary">{section}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Revised Budget</TableHead>
                        <TableHead className="text-right">Prior to Date</TableHead>
                        <TableHead className="text-right">This Draw</TableHead>
                        <TableHead className="text-right">To Date</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead className="text-right">% Complete</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line) => (
                        <TableRow key={line.budget_line_id}>
                          <TableCell className="font-mono text-sm">{line.code}</TableCell>
                          <TableCell>{line.name}</TableCell>
                          <TableCell className="text-right">
                            ${line.revised_budget.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            ${line.prior_to_date.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={line.this_period || 0}
                              onChange={(e) =>
                                handleThisPeriodChange(line.budget_line_id, parseFloat(e.target.value) || 0)
                              }
                              className="w-32 text-right"
                              min="0"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${line.to_date.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            ${line.remaining.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2">
                              <Progress value={line.percent_complete} className="w-16" />
                              <span className="text-sm">{line.percent_complete}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Section Subtotals */}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={2} className="text-right">
                          {section} Subtotal
                        </TableCell>
                        <TableCell className="text-right">
                          ${sectionTotals.revised_budget.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${sectionTotals.prior_to_date.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${sectionTotals.this_period.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${sectionTotals.to_date.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${sectionTotals.remaining.toLocaleString()}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              );
            })}

            {/* Package Totals */}
            <div className="border-t-2 border-primary pt-4">
              <Table>
                <TableBody>
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell colSpan={2} className="text-right">
                      PACKAGE TOTALS
                    </TableCell>
                    <TableCell className="text-right">
                      ${packageTotals.revised_budget.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${packageTotals.prior_to_date.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${packageTotals.this_period.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${packageTotals.to_date.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${packageTotals.remaining.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {packageTotals.revised_budget > 0
                        ? Math.round((packageTotals.to_date / packageTotals.revised_budget) * 100)
                        : 0}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
