import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, AlertTriangle, XCircle, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FieldMapping {
  id: string;
  field_path: string;
  extracted_value: string;
  suggested_value: string;
  confidence_pct: number;
  status: string;
  final_value: string | null;
}

interface Props {
  documentId: string;
  linkedRecord?: { type: string; id: string; name: string } | null;
}

const FIELD_LABELS: Record<string, string> = {
  'project_financials.total_project_cost': 'Total Project Cost',
  'project_financials.total_equity_raised': 'Equity Requirement',
  'project_financials.total_debt_raised': 'Debt Amount',
  'project_financials.target_irr_pct': 'Target IRR %',
  'project_financials.projected_irr_pct': 'Projected IRR %',
  'project_financials.target_equity_multiple': 'Equity Multiple',
  'project_financials.target_yield_on_cost_pct': 'Cash Yield %',
  'project_financials.target_noi': 'Annual NOI',
  'project_financials.hold_period_years': 'Hold Period (years)',
  'project_financials.target_close_date': 'Target Close Date',
  'project_financials.dscr': 'DSCR',
  'capital_stacks.preferred_return_pct': 'Preferred Return %',
  'capital_stacks.committed_amount': 'Committed Capital',
  'capital_stacks.lp_split_above_hurdle_pct': 'LP Split %',
  'capital_stacks.gp_split_above_hurdle_pct': 'GP Split %',
  'capital_stacks.promote_pct': 'Promote %',
  'projects.name': 'Project Name',
  'projects.market': 'Location',
  'projects.project_type': 'Project Type',
  'projects.stage': 'Stage',
  'deals.instrument': 'Deal Instrument',
  'deals.close_date': 'Closing Date',
  'accounts.name': 'Investor / Lender Name',
  'contacts.first_name': 'Contact Name',
  'contacts.email': 'Contact Email',
  'voltqore_site_metrics.total_stalls': 'Total Stalls',
  'voltqore_site_metrics.location_city': 'Site Location',
  'voltqore_site_metrics.utilization_target_pct': 'Utilization Target %',
  'voltqore_site_metrics.lcfs_credits_monthly': 'LCFS Credits (Monthly)',
  'voltqore_site_metrics.gross_capex': 'Gross CapEx',
  'voltqore_site_metrics.net_capex': 'Net CapEx',
  'voltqore_site_metrics.incentives_secured': 'Incentives Secured',
  'voltqore_site_metrics.yield_on_cost_pct': 'Yield on Cost %',
  'voltqore_site_metrics.avg_session_price_kwh': 'Avg Session $/kWh',
  'properties.address': 'Property Address',
  'properties.apn': 'APN',
  'properties.arv': 'ARV',
  'properties.land_cost': 'Land Cost',
  'properties.construction_budget': 'Construction Budget',
  'properties.softs': 'Soft Costs',
  'properties.city': 'City',
  'properties.state': 'State',
};

function getFieldLabel(path: string): string {
  return FIELD_LABELS[path] || path.split('.').pop()?.replace(/_/g, ' ') || path;
}

function getTableLabel(path: string): string {
  const table = path.split('.')[0];
  const labels: Record<string, string> = {
    project_financials: 'Project Financials',
    capital_stacks: 'Capital Stack',
    projects: 'Project',
    deals: 'Deal',
    accounts: 'Account',
    contacts: 'Contact',
    voltqore_site_metrics: 'VoltQore Metrics',
    properties: 'Property',
  };
  return labels[table] || table;
}

function ConfidenceBadge({ pct }: { pct: number }) {
  if (pct >= 85) return <Badge className="bg-green-500/20 text-green-700 border-green-300 text-xs">{pct}%</Badge>;
  if (pct >= 60) return <Badge className="bg-amber-500/20 text-amber-700 border-amber-300 text-xs">{pct}%</Badge>;
  return <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">{pct}%</Badge>;
}

export function DocumentReviewPanel({ documentId, linkedRecord }: Props) {
  const [fields, setFields] = useState<FieldMapping[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFields();
  }, [documentId]);

  const loadFields = async () => {
    const { data } = await supabase
      .from('parse_field_mappings')
      .select('*')
      .eq('document_id', documentId)
      .order('confidence_pct', { ascending: false });

    if (data) {
      setFields(data as any);
      const vals: Record<string, string> = {};
      const accepted = new Set<string>();
      data.forEach((f: any) => {
        vals[f.id] = f.suggested_value || f.extracted_value || '';
        if (f.confidence_pct >= 60) accepted.add(f.id);
      });
      setEditValues(vals);
      setAcceptedIds(accepted);
    }
  };

  const toggleAccept = (id: string) => {
    setAcceptedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const acceptAll = () => setAcceptedIds(new Set(fields.map(f => f.id)));
  const rejectAll = () => setAcceptedIds(new Set());

  const handleSave = async () => {
    setSaving(true);

    const accepted = fields.filter(f => acceptedIds.has(f.id));
    
    // Update parse_field_mappings statuses
    for (const field of fields) {
      const isAccepted = acceptedIds.has(field.id);
      await supabase.from('parse_field_mappings').update({
        status: isAccepted ? 'Accepted' : 'Rejected',
        final_value: isAccepted ? editValues[field.id] : null,
      }).eq('id', field.id);
    }

    // Group accepted fields by target table
    const byTable: Record<string, Record<string, string>> = {};
    for (const field of accepted) {
      const [table, column] = field.field_path.split('.');
      if (!table || !column) continue;
      if (!byTable[table]) byTable[table] = {};
      byTable[table][column] = editValues[field.id];
    }

    // Write to target tables if we have a linked record
    if (linkedRecord) {
      for (const [table, values] of Object.entries(byTable)) {
        if (table === 'project_financials' && linkedRecord.type === 'project') {
          // Upsert project financials
          const { data: existing } = await supabase
            .from('project_financials')
            .select('id')
            .eq('project_id', linkedRecord.id)
            .maybeSingle();

          const numericValues: Record<string, any> = { project_id: linkedRecord.id };
          for (const [k, v] of Object.entries(values)) {
            numericValues[k] = isNaN(Number(v)) ? v : Number(v);
          }

          if (existing) {
            await supabase.from('project_financials').update(numericValues).eq('id', existing.id);
          } else {
            await supabase.from('project_financials').insert(numericValues as any);
          }
        }

        if (table === 'projects' && linkedRecord.type === 'project') {
          await supabase.from('projects').update(values).eq('id', linkedRecord.id);
        }

        if (table === 'properties' && linkedRecord.type === 'property') {
          await supabase.from('properties').update(values).eq('id', linkedRecord.id);
        }

        if (table === 'deals' && linkedRecord.type === 'deal') {
          await supabase.from('deals').update(values as any).eq('id', linkedRecord.id);
        }

        if (table === 'accounts' && linkedRecord.type === 'account') {
          await supabase.from('accounts').update(values).eq('id', linkedRecord.id);
        }
      }
    }

    // Update document status
    await supabase.from('documents').update({ parse_status: 'Confirmed' }).eq('id', documentId);

    setSaving(false);
    setSaved(true);
    toast({
      title: 'Fields saved successfully',
      description: `${accepted.length} field(s) written to database${linkedRecord ? ` for ${linkedRecord.name}` : ''}`,
    });
  };

  // Group by table
  const grouped: Record<string, FieldMapping[]> = {};
  fields.forEach(f => {
    const table = getTableLabel(f.field_path);
    if (!grouped[table]) grouped[table] = [];
    grouped[table].push(f);
  });

  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No fields were extracted from this document. Try a different document type or re-upload.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm font-medium">{fields.length} fields extracted</p>
                <p className="text-xs text-muted-foreground">{acceptedIds.size} accepted</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={acceptAll}>Accept All</Button>
                <Button size="sm" variant="outline" onClick={rejectAll}>Reject All</Button>
              </div>
            </div>
            {linkedRecord && (
              <Badge variant="secondary">Linked to: {linkedRecord.name}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Field groups */}
      {Object.entries(grouped).map(([table, tableFields]) => (
        <Card key={table}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{table}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tableFields.map(field => {
                const isAccepted = acceptedIds.has(field.id);
                return (
                  <div key={field.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isAccepted ? 'bg-green-50/50 border-green-200 dark:bg-green-950/10' : 'bg-muted/30'
                  }`}>
                    <Checkbox
                      checked={isAccepted}
                      onCheckedChange={() => toggleAccept(field.id)}
                    />
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                      <div>
                        <p className="text-sm font-medium">{getFieldLabel(field.field_path)}</p>
                        <p className="text-[10px] text-muted-foreground">{field.field_path}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Extracted:</p>
                        <p className="text-sm">{field.extracted_value}</p>
                      </div>
                      <div>
                        <Input
                          value={editValues[field.id] || ''}
                          onChange={e => setEditValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="h-8 text-sm"
                          disabled={saved}
                        />
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <ConfidenceBadge pct={field.confidence_pct} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Save Button */}
      {!saved ? (
        <Button onClick={handleSave} disabled={saving || acceptedIds.size === 0} className="gap-2" size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save {acceptedIds.size} Accepted Field{acceptedIds.size !== 1 ? 's' : ''}
        </Button>
      ) : (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">All accepted fields have been saved to the database.</span>
        </div>
      )}
    </div>
  );
}
