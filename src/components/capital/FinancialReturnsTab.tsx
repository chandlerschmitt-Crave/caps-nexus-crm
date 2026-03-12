import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Save, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface Financials {
  id: string;
  project_id: string;
  target_irr_pct: number | null;
  projected_irr_pct: number | null;
  actual_irr_pct: number | null;
  target_equity_multiple: number | null;
  projected_equity_multiple: number | null;
  target_yield_on_cost_pct: number | null;
  projected_yield_on_cost_pct: number | null;
  target_noi: number | null;
  projected_noi: number | null;
  actual_noi_to_date: number | null;
  dscr: number | null;
  total_project_cost: number | null;
  total_equity_raised: number | null;
  total_debt_raised: number | null;
  capital_deployed_pct: number | null;
  hold_period_years: number | null;
  target_close_date: string | null;
  exit_date_projected: string | null;
  exit_strategy: string | null;
  notes: string | null;
}

interface Props {
  projectId: string;
}

const EXIT_STRATEGIES = [
  'Strategic_Sale', 'REIT_Aggregation', 'Refinance_Recap', 'Utility_Acquisition', 'Sell_Retail'
];

function ragColor(target: number | null, projected: number | null): string {
  if (target == null || projected == null) return 'text-muted-foreground';
  const ratio = projected / target;
  if (ratio >= 1) return 'text-green-600';
  if (ratio >= 0.9) return 'text-amber-500';
  return 'text-red-500';
}

function ragDot(target: number | null, projected: number | null): string {
  if (target == null || projected == null) return 'bg-muted';
  const ratio = projected / target;
  if (ratio >= 1) return 'bg-green-500';
  if (ratio >= 0.9) return 'bg-amber-500';
  return 'bg-red-500';
}

export function FinancialReturnsTab({ projectId }: Props) {
  const [fin, setFin] = useState<Financials | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFinancials();
  }, [projectId]);

  const loadFinancials = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('project_financials' as any)
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();
    if (data) {
      setFin(data as any);
      setForm(data as any);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (fin) {
        const { error } = await supabase
          .from('project_financials' as any)
          .update({ ...form, updated_at: new Date().toISOString() } as any)
          .eq('id', fin.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('project_financials' as any)
          .insert([{ ...form, project_id: projectId }] as any);
        if (error) throw error;
      }
      toast({ title: 'Financial returns saved' });
      setEditing(false);
      loadFinancials();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateNum = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value === '' ? null : parseFloat(value) }));
  const updateStr = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value || null }));

  if (loading && !fin) return <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>;

  if (!fin && !editing) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-sm text-muted-foreground">No financial returns data yet.</p>
        <Button onClick={() => { setForm({}); setEditing(true); }}>Add Financial Returns</Button>
      </div>
    );
  }

  const d = editing ? form : fin;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {editing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="h-3 w-3 mr-1" /> Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={loading}><Save className="h-3 w-3 mr-1" /> Save</Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => { setForm(fin || {}); setEditing(true); }}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
        )}
      </div>

      {/* Key Metrics Stat Blocks */}
      <div className="grid grid-cols-3 gap-4">
        {/* IRR */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-2.5 w-2.5 rounded-full ${ragDot(Number(d?.target_irr_pct), Number(d?.projected_irr_pct))}`} />
              <p className="text-xs text-muted-foreground font-medium">IRR</p>
            </div>
            {editing ? (
              <div className="space-y-2">
                <div><Label className="text-xs">Target %</Label><Input type="number" step="0.1" value={d?.target_irr_pct ?? ''} onChange={e => updateNum('target_irr_pct', e.target.value)} className="h-8" /></div>
                <div><Label className="text-xs">Projected %</Label><Input type="number" step="0.1" value={d?.projected_irr_pct ?? ''} onChange={e => updateNum('projected_irr_pct', e.target.value)} className="h-8" /></div>
                <div><Label className="text-xs">Actual %</Label><Input type="number" step="0.1" value={d?.actual_irr_pct ?? ''} onChange={e => updateNum('actual_irr_pct', e.target.value)} className="h-8" /></div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Target</span><span className="font-medium">{d?.target_irr_pct ?? '—'}%</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Projected</span><span className={`font-bold ${ragColor(Number(d?.target_irr_pct), Number(d?.projected_irr_pct))}`}>{d?.projected_irr_pct ?? '—'}%</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Actual</span><span className="font-medium">{d?.actual_irr_pct ?? '—'}%</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equity Multiple */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-2.5 w-2.5 rounded-full ${ragDot(Number(d?.target_equity_multiple), Number(d?.projected_equity_multiple))}`} />
              <p className="text-xs text-muted-foreground font-medium">Equity Multiple</p>
            </div>
            {editing ? (
              <div className="space-y-2">
                <div><Label className="text-xs">Target</Label><Input type="number" step="0.01" value={d?.target_equity_multiple ?? ''} onChange={e => updateNum('target_equity_multiple', e.target.value)} className="h-8" /></div>
                <div><Label className="text-xs">Projected</Label><Input type="number" step="0.01" value={d?.projected_equity_multiple ?? ''} onChange={e => updateNum('projected_equity_multiple', e.target.value)} className="h-8" /></div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Target</span><span className="font-medium">{d?.target_equity_multiple ?? '—'}x</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Projected</span><span className={`font-bold ${ragColor(Number(d?.target_equity_multiple), Number(d?.projected_equity_multiple))}`}>{d?.projected_equity_multiple ?? '—'}x</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yield on Cost */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-2.5 w-2.5 rounded-full ${ragDot(Number(d?.target_yield_on_cost_pct), Number(d?.projected_yield_on_cost_pct))}`} />
              <p className="text-xs text-muted-foreground font-medium">Yield on Cost</p>
            </div>
            {editing ? (
              <div className="space-y-2">
                <div><Label className="text-xs">Target %</Label><Input type="number" step="0.1" value={d?.target_yield_on_cost_pct ?? ''} onChange={e => updateNum('target_yield_on_cost_pct', e.target.value)} className="h-8" /></div>
                <div><Label className="text-xs">Projected %</Label><Input type="number" step="0.1" value={d?.projected_yield_on_cost_pct ?? ''} onChange={e => updateNum('projected_yield_on_cost_pct', e.target.value)} className="h-8" /></div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Target</span><span className="font-medium">{d?.target_yield_on_cost_pct ?? '—'}%</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Projected</span><span className={`font-bold ${ragColor(Number(d?.target_yield_on_cost_pct), Number(d?.projected_yield_on_cost_pct))}`}>{d?.projected_yield_on_cost_pct ?? '—'}%</span></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Other Financial Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Project Financial Details</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Total Project Cost ($)</Label><Input type="number" value={d?.total_project_cost ?? ''} onChange={e => updateNum('total_project_cost', e.target.value)} /></div>
              <div className="space-y-1"><Label>Total Equity Raised ($)</Label><Input type="number" value={d?.total_equity_raised ?? ''} onChange={e => updateNum('total_equity_raised', e.target.value)} /></div>
              <div className="space-y-1"><Label>Total Debt Raised ($)</Label><Input type="number" value={d?.total_debt_raised ?? ''} onChange={e => updateNum('total_debt_raised', e.target.value)} /></div>
              <div className="space-y-1"><Label>Capital Deployed (%)</Label><Input type="number" step="0.1" value={d?.capital_deployed_pct ?? ''} onChange={e => updateNum('capital_deployed_pct', e.target.value)} /></div>
              <div className="space-y-1"><Label>Target NOI ($)</Label><Input type="number" value={d?.target_noi ?? ''} onChange={e => updateNum('target_noi', e.target.value)} /></div>
              <div className="space-y-1"><Label>Projected NOI ($)</Label><Input type="number" value={d?.projected_noi ?? ''} onChange={e => updateNum('projected_noi', e.target.value)} /></div>
              <div className="space-y-1"><Label>Actual NOI to Date ($)</Label><Input type="number" value={d?.actual_noi_to_date ?? ''} onChange={e => updateNum('actual_noi_to_date', e.target.value)} /></div>
              <div className="space-y-1"><Label>DSCR</Label><Input type="number" step="0.01" value={d?.dscr ?? ''} onChange={e => updateNum('dscr', e.target.value)} /></div>
              <div className="space-y-1"><Label>Hold Period (years)</Label><Input type="number" step="0.5" value={d?.hold_period_years ?? ''} onChange={e => updateNum('hold_period_years', e.target.value)} /></div>
              <div className="space-y-1"><Label>Target Close Date</Label><Input type="date" value={d?.target_close_date ?? ''} onChange={e => updateStr('target_close_date', e.target.value)} /></div>
              <div className="space-y-1"><Label>Projected Exit Date</Label><Input type="date" value={d?.exit_date_projected ?? ''} onChange={e => updateStr('exit_date_projected', e.target.value)} /></div>
              <div className="space-y-1">
                <Label>Exit Strategy</Label>
                <Select value={d?.exit_strategy || ''} onValueChange={v => updateStr('exit_strategy', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {EXIT_STRATEGIES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Notes</Label>
                <Textarea value={d?.notes ?? ''} onChange={e => updateStr('notes', e.target.value)} rows={3} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><Label className="text-muted-foreground">Total Project Cost</Label><p className="font-medium">{formatCurrency(Number(d?.total_project_cost))}</p></div>
              <div><Label className="text-muted-foreground">Total Equity Raised</Label><p className="font-medium">{formatCurrency(Number(d?.total_equity_raised))}</p></div>
              <div><Label className="text-muted-foreground">Total Debt Raised</Label><p className="font-medium">{formatCurrency(Number(d?.total_debt_raised))}</p></div>
              <div><Label className="text-muted-foreground">Capital Deployed</Label><p className="font-medium">{d?.capital_deployed_pct ?? '—'}%</p></div>
              <div><Label className="text-muted-foreground">Target NOI</Label><p className="font-medium">{formatCurrency(Number(d?.target_noi))}</p></div>
              <div><Label className="text-muted-foreground">Projected NOI</Label><p className="font-medium">{formatCurrency(Number(d?.projected_noi))}</p></div>
              <div><Label className="text-muted-foreground">Actual NOI to Date</Label><p className="font-medium">{formatCurrency(Number(d?.actual_noi_to_date))}</p></div>
              <div><Label className="text-muted-foreground">DSCR</Label><p className="font-medium">{d?.dscr ?? '—'}x</p></div>
              <div><Label className="text-muted-foreground">Hold Period</Label><p className="font-medium">{d?.hold_period_years ?? '—'} years</p></div>
              <div><Label className="text-muted-foreground">Target Close</Label><p className="font-medium">{d?.target_close_date ? new Date(d.target_close_date).toLocaleDateString() : '—'}</p></div>
              <div><Label className="text-muted-foreground">Projected Exit</Label><p className="font-medium">{d?.exit_date_projected ? new Date(d.exit_date_projected).toLocaleDateString() : '—'}</p></div>
              <div><Label className="text-muted-foreground">Exit Strategy</Label><p className="font-medium">{d?.exit_strategy?.replace(/_/g, ' ') || '—'}</p></div>
              {d?.notes && <div className="col-span-2"><Label className="text-muted-foreground">Notes</Label><p className="font-medium">{d.notes}</p></div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
