import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface CapitalLayer {
  id: string;
  project_id: string;
  layer: string;
  provider_name: string | null;
  committed_amount: number | null;
  called_amount: number | null;
  uncalled_amount: number | null;
  preferred_return_pct: number | null;
  interest_rate_pct: number | null;
  maturity_date: string | null;
  ltv_pct: number | null;
  ltc_pct: number | null;
  promote_pct: number | null;
  gp_split_above_hurdle_pct: number | null;
  lp_split_above_hurdle_pct: number | null;
  notes: string | null;
  sort_order: number | null;
}

const LAYERS = [
  { value: 'Senior_Debt', label: 'Senior Debt', color: 'bg-blue-500' },
  { value: 'Mezzanine', label: 'Mezzanine', color: 'bg-teal-500' },
  { value: 'Preferred_Equity', label: 'Preferred Equity', color: 'bg-cyan-500' },
  { value: 'LP_Equity', label: 'LP Equity', color: 'bg-green-500' },
  { value: 'GP_Equity', label: 'GP Equity', color: 'bg-amber-500' },
  { value: 'Incentive_Grant', label: 'Incentive/Grant', color: 'bg-purple-500' },
];

const layerMeta = (layer: string) => LAYERS.find(l => l.value === layer) || LAYERS[0];

interface Props {
  projectId: string;
}

const emptyForm = {
  layer: 'Senior_Debt',
  provider_name: '',
  committed_amount: '',
  called_amount: '',
  uncalled_amount: '',
  preferred_return_pct: '',
  interest_rate_pct: '',
  maturity_date: '',
  ltv_pct: '',
  ltc_pct: '',
  promote_pct: '',
  gp_split_above_hurdle_pct: '',
  lp_split_above_hurdle_pct: '',
  notes: '',
  sort_order: '',
};

export function CapitalStackTab({ projectId }: Props) {
  const [layers, setLayers] = useState<CapitalLayer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLayers();
  }, [projectId]);

  const loadLayers = async () => {
    const { data } = await supabase
      .from('capital_stacks' as any)
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });
    setLayers((data as any) || []);
  };

  const handleAdd = async () => {
    setLoading(true);
    try {
      const row = {
        project_id: projectId,
        layer: form.layer,
        provider_name: form.provider_name || null,
        committed_amount: parseFloat(form.committed_amount) || 0,
        called_amount: parseFloat(form.called_amount) || 0,
        uncalled_amount: parseFloat(form.uncalled_amount) || (parseFloat(form.committed_amount) || 0) - (parseFloat(form.called_amount) || 0),
        preferred_return_pct: form.preferred_return_pct ? parseFloat(form.preferred_return_pct) : null,
        interest_rate_pct: form.interest_rate_pct ? parseFloat(form.interest_rate_pct) : null,
        maturity_date: form.maturity_date || null,
        ltv_pct: form.ltv_pct ? parseFloat(form.ltv_pct) : null,
        ltc_pct: form.ltc_pct ? parseFloat(form.ltc_pct) : null,
        promote_pct: form.promote_pct ? parseFloat(form.promote_pct) : null,
        gp_split_above_hurdle_pct: form.gp_split_above_hurdle_pct ? parseFloat(form.gp_split_above_hurdle_pct) : null,
        lp_split_above_hurdle_pct: form.lp_split_above_hurdle_pct ? parseFloat(form.lp_split_above_hurdle_pct) : null,
        notes: form.notes || null,
        sort_order: form.sort_order ? parseInt(form.sort_order) : layers.length,
      };
      const { error } = await supabase.from('capital_stacks' as any).insert([row] as any);
      if (error) throw error;
      toast({ title: 'Capital layer added' });
      setForm(emptyForm);
      setDialogOpen(false);
      loadLayers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('capital_stacks' as any).delete().eq('id', id);
    if (!error) loadLayers();
  };

  const totalCommitted = layers.reduce((s, l) => s + (Number(l.committed_amount) || 0), 0);
  const totalCalled = layers.reduce((s, l) => s + (Number(l.called_amount) || 0), 0);
  const totalUncalled = layers.reduce((s, l) => s + (Number(l.uncalled_amount) || 0), 0);

  // Waterfall distribution logic
  const lpLayers = layers.filter(l => l.layer === 'LP_Equity' || l.layer === 'Preferred_Equity');
  const gpLayers = layers.filter(l => l.layer === 'GP_Equity');
  const lpCommitted = lpLayers.reduce((s, l) => s + (Number(l.committed_amount) || 0), 0);
  const gpCommitted = gpLayers.reduce((s, l) => s + (Number(l.committed_amount) || 0), 0);
  const avgLpPref = lpLayers.length > 0
    ? lpLayers.reduce((s, l) => s + (Number(l.preferred_return_pct) || 0), 0) / lpLayers.length
    : 8;
  const gpPromote = gpLayers.length > 0 ? Number(gpLayers[0]?.promote_pct) || 20 : 20;
  const gpSplit = gpLayers.length > 0 ? Number(gpLayers[0]?.gp_split_above_hurdle_pct) || gpPromote : gpPromote;
  const lpSplit = 100 - gpSplit;

  const updateForm = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Committed</p>
            <p className="text-xl font-bold">{formatCurrency(totalCommitted)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Called</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalCalled)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Uncalled</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(totalUncalled)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Waterfall Bar */}
      {layers.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Capital Stack Waterfall</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add Layer
            </Button>
          </CardHeader>
          <CardContent>
            {/* Stacked bar */}
            <div className="flex rounded-md overflow-hidden h-10 mb-4">
              {layers.map(layer => {
                const pct = totalCommitted > 0 ? ((Number(layer.committed_amount) || 0) / totalCommitted) * 100 : 0;
                const meta = layerMeta(layer.layer);
                return (
                  <div
                    key={layer.id}
                    className={`${meta.color} flex items-center justify-center text-white text-xs font-medium`}
                    style={{ width: `${Math.max(pct, 5)}%` }}
                    title={`${meta.label}: ${formatCurrency(Number(layer.committed_amount))}`}
                  >
                    {pct > 12 ? meta.label : ''}
                  </div>
                );
              })}
            </div>

            {/* Layer details */}
            <div className="space-y-3">
              {layers.map(layer => {
                const meta = layerMeta(layer.layer);
                const calledPct = Number(layer.committed_amount) > 0
                  ? ((Number(layer.called_amount) || 0) / Number(layer.committed_amount)) * 100
                  : 0;
                return (
                  <div key={layer.id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${meta.color}`} />
                        <span className="text-sm font-medium">{meta.label}</span>
                        {layer.provider_name && (
                          <span className="text-xs text-muted-foreground">— {layer.provider_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{formatCurrency(Number(layer.committed_amount))}</span>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleDelete(layer.id)}>
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    {/* Called progress */}
                    <div className="h-2 bg-muted rounded-full mb-2">
                      <div className={`h-2 ${meta.color} rounded-full`} style={{ width: `${calledPct}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Called: {formatCurrency(Number(layer.called_amount))}</span>
                      <span>Uncalled: {formatCurrency(Number(layer.uncalled_amount))}</span>
                      {layer.interest_rate_pct != null && <span>Rate: {layer.interest_rate_pct}%</span>}
                      {layer.preferred_return_pct != null && <span>Pref: {layer.preferred_return_pct}%</span>}
                      {layer.maturity_date && <span>Maturity: {new Date(layer.maturity_date).toLocaleDateString()}</span>}
                      {layer.ltv_pct != null && <span>LTV: {layer.ltv_pct}%</span>}
                      {layer.ltc_pct != null && <span>LTC: {layer.ltc_pct}%</span>}
                      {layer.promote_pct != null && <span>Promote: {layer.promote_pct}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {layers.length === 0 && (
        <div className="text-center py-8 space-y-3">
          <DollarSign className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No capital layers configured.</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-3 w-3 mr-1" /> Add Layer
          </Button>
        </div>
      )}

      {/* Waterfall Distribution Preview */}
      {layers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Waterfall Distribution Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0">1</Badge>
              <p><span className="font-medium">Return of Capital:</span> All invested capital ({formatCurrency(lpCommitted + gpCommitted)}) is returned to LP and GP investors pro-rata before any profit distributions.</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0">2</Badge>
              <p><span className="font-medium">LP Preferred Return:</span> LP investors receive a {avgLpPref.toFixed(1)}% preferred return on their {formatCurrency(lpCommitted)} investment before GP participates in profits.</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0">3</Badge>
              <p><span className="font-medium">GP Co-Invest Return:</span> GP receives return on their {formatCurrency(gpCommitted)} co-investment at the same preferred rate.</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0">4</Badge>
              <p><span className="font-medium">Residual Split:</span> Remaining profits split {gpSplit}% GP / {lpSplit}% LP per the promote structure ({gpPromote}% promote above hurdle).</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Layer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Capital Layer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Layer Type *</Label>
                <Select value={form.layer} onValueChange={v => updateForm('layer', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LAYERS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Provider Name</Label>
                <Input value={form.provider_name} onChange={e => updateForm('provider_name', e.target.value)} placeholder="e.g., JPMorgan" />
              </div>
              <div className="space-y-1">
                <Label>Committed ($)</Label>
                <Input type="number" value={form.committed_amount} onChange={e => updateForm('committed_amount', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Called ($)</Label>
                <Input type="number" value={form.called_amount} onChange={e => updateForm('called_amount', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Interest Rate (%)</Label>
                <Input type="number" step="0.01" value={form.interest_rate_pct} onChange={e => updateForm('interest_rate_pct', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Preferred Return (%)</Label>
                <Input type="number" step="0.01" value={form.preferred_return_pct} onChange={e => updateForm('preferred_return_pct', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>LTV (%)</Label>
                <Input type="number" step="0.1" value={form.ltv_pct} onChange={e => updateForm('ltv_pct', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>LTC (%)</Label>
                <Input type="number" step="0.1" value={form.ltc_pct} onChange={e => updateForm('ltc_pct', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Promote (%)</Label>
                <Input type="number" step="0.1" value={form.promote_pct} onChange={e => updateForm('promote_pct', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>GP Split Above Hurdle (%)</Label>
                <Input type="number" step="0.1" value={form.gp_split_above_hurdle_pct} onChange={e => updateForm('gp_split_above_hurdle_pct', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>LP Split Above Hurdle (%)</Label>
                <Input type="number" step="0.1" value={form.lp_split_above_hurdle_pct} onChange={e => updateForm('lp_split_above_hurdle_pct', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Maturity Date</Label>
                <Input type="date" value={form.maturity_date} onChange={e => updateForm('maturity_date', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => updateForm('notes', e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={loading}>{loading ? 'Adding...' : 'Add Layer'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
