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
import { Switch } from '@/components/ui/switch';
import { Pencil, Save, X, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface SiteMetrics {
  id: string;
  project_id: string;
  site_name: string | null;
  location_city: string | null;
  location_state: string | null;
  market_type: string | null;
  total_stalls: number | null;
  stalls_operational: number | null;
  stalls_in_development: number | null;
  gross_capex: number | null;
  net_capex: number | null;
  incentives_secured: number | null;
  utilization_rate_pct: number | null;
  utilization_target_pct: number | null;
  avg_session_price_kwh: number | null;
  monthly_gross_revenue: number | null;
  tesla_om_cost_monthly: number | null;
  utilities_network_fees_monthly: number | null;
  ground_lease_monthly: number | null;
  noi_monthly: number | null;
  lcfs_credits_monthly: number | null;
  ebitda_margin_pct: number | null;
  yield_on_cost_pct: number | null;
  status: string | null;
  tesla_om_agreement: boolean | null;
  ground_lease_executed: boolean | null;
  itc_application_status: string | null;
  lcfs_registration_status: string | null;
  spv_formed: boolean | null;
  notes: string | null;
}

interface Props {
  projectId: string;
}

const MARKET_TYPES = [
  'High-Growth Commuter', 'Medical Corridor', 'Urban Infill',
  'Retail/Mall', 'Office Park', 'Hospitality', 'Grocery'
];

const SITE_STATUSES = ['Shovel_Ready', 'Under_Construction', 'Energized', 'Stabilized'];

export function VoltQoreSiteMetricsTab({ projectId }: Props) {
  const [metrics, setMetrics] = useState<SiteMetrics | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<SiteMetrics>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
  }, [projectId]);

  const loadMetrics = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('voltqore_site_metrics' as any)
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();
    
    if (data) {
      setMetrics(data as any);
      setForm(data as any);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (metrics) {
        const { error } = await supabase
          .from('voltqore_site_metrics' as any)
          .update({ ...form, updated_at: new Date().toISOString() } as any)
          .eq('id', metrics.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('voltqore_site_metrics' as any)
          .insert([{ ...form, project_id: projectId }] as any);
        if (error) throw error;
      }
      toast({ title: 'Site metrics saved' });
      setEditing(false);
      loadMetrics();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setForm(metrics || {});
    setEditing(true);
  };

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const numField = (field: string, value: string) => {
    updateField(field, value === '' ? null : parseFloat(value));
  };

  const intField = (field: string, value: string) => {
    updateField(field, value === '' ? null : parseInt(value, 10));
  };

  if (loading && !metrics) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading site metrics...</p>;
  }

  if (!metrics && !editing) {
    return (
      <div className="text-center py-8 space-y-3">
        <Zap className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">No site metrics configured yet.</p>
        <Button onClick={startEditing}>Add Site Metrics</Button>
      </div>
    );
  }

  const StatusIndicator = ({ value, label }: { value: boolean | null; label: string }) => (
    <div className="flex items-center gap-2">
      {value ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-400" />
      )}
      <span className="text-sm">{label}</span>
    </div>
  );

  const m = editing ? form : metrics;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {editing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={loading}>
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              <Save className="h-3 w-3 mr-1" /> Save
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={startEditing}>
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
        )}
      </div>

      {/* Site Overview */}
      <Card>
        <CardHeader><CardTitle className="text-base">Site Overview</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {editing ? (
            <>
              <div className="space-y-1">
                <Label>Site Name</Label>
                <Input value={m?.site_name || ''} onChange={e => updateField('site_name', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input value={m?.location_city || ''} onChange={e => updateField('location_city', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>State</Label>
                <Input value={m?.location_state || ''} onChange={e => updateField('location_state', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Market Type</Label>
                <Select value={m?.market_type || ''} onValueChange={v => updateField('market_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {MARKET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={m?.status || 'Shovel_Ready'} onValueChange={v => updateField('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SITE_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div><Label className="text-muted-foreground">Site Name</Label><p className="text-sm font-medium">{m?.site_name || '—'}</p></div>
              <div><Label className="text-muted-foreground">Location</Label><p className="text-sm font-medium">{[m?.location_city, m?.location_state].filter(Boolean).join(', ') || '—'}</p></div>
              <div><Label className="text-muted-foreground">Market Type</Label><p className="text-sm font-medium">{m?.market_type || '—'}</p></div>
              <div><Label className="text-muted-foreground">Status</Label><Badge variant="outline">{m?.status?.replace('_', ' ') || '—'}</Badge></div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stall Configuration */}
      <Card>
        <CardHeader><CardTitle className="text-base">Stall Configuration</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          {editing ? (
            <>
              <div className="space-y-1"><Label>Total Stalls</Label><Input type="number" value={m?.total_stalls ?? ''} onChange={e => intField('total_stalls', e.target.value)} /></div>
              <div className="space-y-1"><Label>Operational</Label><Input type="number" value={m?.stalls_operational ?? ''} onChange={e => intField('stalls_operational', e.target.value)} /></div>
              <div className="space-y-1"><Label>In Development</Label><Input type="number" value={m?.stalls_in_development ?? ''} onChange={e => intField('stalls_in_development', e.target.value)} /></div>
            </>
          ) : (
            <>
              <div><Label className="text-muted-foreground">Total</Label><p className="text-2xl font-bold">{m?.total_stalls ?? 0}</p></div>
              <div><Label className="text-muted-foreground">Operational</Label><p className="text-2xl font-bold text-green-600">{m?.stalls_operational ?? 0}</p></div>
              <div><Label className="text-muted-foreground">In Development</Label><p className="text-2xl font-bold text-amber-600">{m?.stalls_in_development ?? 0}</p></div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Capital Summary */}
      <Card>
        <CardHeader><CardTitle className="text-base">Capital Summary</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          {editing ? (
            <>
              <div className="space-y-1"><Label>Gross CapEx ($)</Label><Input type="number" value={m?.gross_capex ?? ''} onChange={e => numField('gross_capex', e.target.value)} /></div>
              <div className="space-y-1"><Label>Net CapEx ($)</Label><Input type="number" value={m?.net_capex ?? ''} onChange={e => numField('net_capex', e.target.value)} /></div>
              <div className="space-y-1"><Label>Incentives ($)</Label><Input type="number" value={m?.incentives_secured ?? ''} onChange={e => numField('incentives_secured', e.target.value)} /></div>
            </>
          ) : (
            <>
              <div><Label className="text-muted-foreground">Gross CapEx</Label><p className="text-sm font-bold">{formatCurrency(Number(m?.gross_capex))}</p></div>
              <div><Label className="text-muted-foreground">Net CapEx</Label><p className="text-sm font-bold">{formatCurrency(Number(m?.net_capex))}</p></div>
              <div><Label className="text-muted-foreground">Incentives Secured</Label><p className="text-sm font-bold text-green-600">{formatCurrency(Number(m?.incentives_secured))}</p></div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Operating Performance */}
      <Card>
        <CardHeader><CardTitle className="text-base">Operating Performance</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Utilization Rate (%)</Label><Input type="number" step="0.1" value={m?.utilization_rate_pct ?? ''} onChange={e => numField('utilization_rate_pct', e.target.value)} /></div>
              <div className="space-y-1"><Label>Target Utilization (%)</Label><Input type="number" step="0.1" value={m?.utilization_target_pct ?? ''} onChange={e => numField('utilization_target_pct', e.target.value)} /></div>
              <div className="space-y-1"><Label>Avg Session Price ($/kWh)</Label><Input type="number" step="0.01" value={m?.avg_session_price_kwh ?? ''} onChange={e => numField('avg_session_price_kwh', e.target.value)} /></div>
              <div className="space-y-1"><Label>Monthly Gross Revenue ($)</Label><Input type="number" value={m?.monthly_gross_revenue ?? ''} onChange={e => numField('monthly_gross_revenue', e.target.value)} /></div>
              <div className="space-y-1"><Label>Tesla O&M Monthly ($)</Label><Input type="number" value={m?.tesla_om_cost_monthly ?? ''} onChange={e => numField('tesla_om_cost_monthly', e.target.value)} /></div>
              <div className="space-y-1"><Label>Utilities/Network ($)</Label><Input type="number" value={m?.utilities_network_fees_monthly ?? ''} onChange={e => numField('utilities_network_fees_monthly', e.target.value)} /></div>
              <div className="space-y-1"><Label>Ground Lease Monthly ($)</Label><Input type="number" value={m?.ground_lease_monthly ?? ''} onChange={e => numField('ground_lease_monthly', e.target.value)} /></div>
              <div className="space-y-1"><Label>NOI Monthly ($)</Label><Input type="number" value={m?.noi_monthly ?? ''} onChange={e => numField('noi_monthly', e.target.value)} /></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Utilization</Label>
                  <p className="text-sm font-bold">{m?.utilization_rate_pct ?? 0}% <span className="text-muted-foreground font-normal">/ {m?.utilization_target_pct ?? 0}% target</span></p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Avg Session Price</Label>
                  <p className="text-sm font-bold">${m?.avg_session_price_kwh ?? 0.45}/kWh</p>
                </div>
              </div>
              {/* Revenue Waterfall */}
              <div className="space-y-2 border rounded-md p-3">
                <div className="flex justify-between text-sm">
                  <span>Gross Revenue</span>
                  <span className="font-medium">{formatCurrency(Number(m?.monthly_gross_revenue))}</span>
                </div>
                <div className="flex justify-between text-sm text-red-500">
                  <span>− Tesla O&M</span>
                  <span>({formatCurrency(Number(m?.tesla_om_cost_monthly))})</span>
                </div>
                <div className="flex justify-between text-sm text-red-500">
                  <span>− Utilities / Network</span>
                  <span>({formatCurrency(Number(m?.utilities_network_fees_monthly))})</span>
                </div>
                <div className="flex justify-between text-sm text-red-500">
                  <span>− Ground Lease</span>
                  <span>({formatCurrency(Number(m?.ground_lease_monthly))})</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm font-bold">
                  <span>NOI (Monthly)</span>
                  <span className="text-green-600">{formatCurrency(Number(m?.noi_monthly))}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Returns */}
      <Card>
        <CardHeader><CardTitle className="text-base">Financial Returns</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          {editing ? (
            <>
              <div className="space-y-1"><Label>LCFS Credits ($/mo)</Label><Input type="number" value={m?.lcfs_credits_monthly ?? ''} onChange={e => numField('lcfs_credits_monthly', e.target.value)} /></div>
              <div className="space-y-1"><Label>EBITDA Margin (%)</Label><Input type="number" step="0.1" value={m?.ebitda_margin_pct ?? ''} onChange={e => numField('ebitda_margin_pct', e.target.value)} /></div>
              <div className="space-y-1"><Label>Yield on Cost (%)</Label><Input type="number" step="0.1" value={m?.yield_on_cost_pct ?? ''} onChange={e => numField('yield_on_cost_pct', e.target.value)} /></div>
            </>
          ) : (
            <>
              <div><Label className="text-muted-foreground">LCFS Credits</Label><p className="text-sm font-bold">{formatCurrency(Number(m?.lcfs_credits_monthly))}/mo</p></div>
              <div><Label className="text-muted-foreground">EBITDA Margin</Label><p className="text-sm font-bold">{m?.ebitda_margin_pct ?? 0}%</p></div>
              <div>
                <Label className="text-muted-foreground">Yield on Cost</Label>
                <p className={`text-sm font-bold ${Number(m?.yield_on_cost_pct) >= 12 ? 'text-green-600' : 'text-amber-600'}`}>
                  {m?.yield_on_cost_pct ?? 0}% <span className="text-muted-foreground font-normal text-xs">/ 12% target</span>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card>
        <CardHeader><CardTitle className="text-base">Compliance Status</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><Switch checked={!!m?.tesla_om_agreement} onCheckedChange={v => updateField('tesla_om_agreement', v)} /><Label>Tesla O&M Agreement</Label></div>
              <div className="flex items-center gap-2"><Switch checked={!!m?.ground_lease_executed} onCheckedChange={v => updateField('ground_lease_executed', v)} /><Label>Ground Lease Executed</Label></div>
              <div className="flex items-center gap-2"><Switch checked={!!m?.spv_formed} onCheckedChange={v => updateField('spv_formed', v)} /><Label>SPV Formed</Label></div>
              <div className="space-y-1"><Label>ITC Application Status</Label><Input value={m?.itc_application_status || ''} onChange={e => updateField('itc_application_status', e.target.value)} /></div>
              <div className="space-y-1"><Label>LCFS Registration Status</Label><Input value={m?.lcfs_registration_status || ''} onChange={e => updateField('lcfs_registration_status', e.target.value)} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <StatusIndicator value={m?.tesla_om_agreement} label="Tesla O&M Agreement" />
              <StatusIndicator value={m?.ground_lease_executed} label="Ground Lease Executed" />
              <StatusIndicator value={m?.spv_formed} label="SPV Formed" />
              <div className="flex items-center gap-2">
                {m?.itc_application_status ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-400" />}
                <span className="text-sm">ITC: {m?.itc_application_status || 'Not Started'}</span>
              </div>
              <div className="flex items-center gap-2">
                {m?.lcfs_registration_status ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-400" />}
                <span className="text-sm">LCFS: {m?.lcfs_registration_status || 'Not Started'}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <Textarea rows={4} value={m?.notes || ''} onChange={e => updateField('notes', e.target.value)} placeholder="Site notes..." />
          ) : (
            <p className="text-sm text-muted-foreground">{m?.notes || 'No notes.'}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
