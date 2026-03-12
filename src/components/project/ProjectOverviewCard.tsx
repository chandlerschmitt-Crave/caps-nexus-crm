import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { format, formatDistanceToNow } from 'date-fns';
import { Plus, ListTodo, FileText, BookOpen, MessageSquare, Zap } from 'lucide-react';

interface ProjectOverviewCardProps {
  project: {
    id: string;
    name: string;
    vertical: string | null;
    project_type: string;
    stage: string;
    market: string | null;
    description: string | null;
    est_total_cost: number | null;
    account: { name: string; type_of_account: string | null } | null;
  };
  onQuickAction: (action: string) => void;
}

const ALL_STAGES = ['Ideation', 'Pre-Dev', 'Raising', 'Entitlements', 'Construction', 'Stabilization', 'Exit'];
const VOLTQORE_STAGES = ['Site_Identified', 'Underwriting', 'LOI_Ground_Lease', 'Permits', 'Incentive_Applications', 'Shovel_Ready', 'Construction', 'Energized', 'Stabilized_Operations'];

const VERTICAL_COLORS: Record<string, string> = {
  TerraQore: 'bg-emerald-500/20 text-emerald-700 border-emerald-300',
  VoltQore: 'bg-blue-500/20 text-blue-700 border-blue-300',
  Malibu_Luxury_Estates: 'bg-amber-500/20 text-amber-700 border-amber-300',
  Digital_Assets: 'bg-purple-500/20 text-purple-700 border-purple-300',
  CAPS_Platform: 'bg-muted text-muted-foreground',
};

export function ProjectOverviewCard({ project, onQuickAction }: ProjectOverviewCardProps) {
  const [financials, setFinancials] = useState<any>(null);
  const [stageHistory, setStageHistory] = useState<any[]>([]);
  const [capitalSummary, setCapitalSummary] = useState({ committed: 0, called: 0 });
  const [lastActivity, setLastActivity] = useState<any>(null);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());

  useEffect(() => { loadData(); }, [project.id]);

  const loadData = async () => {
    const [finRes, histRes, capRes, actRes, profRes] = await Promise.all([
      supabase.from('project_financials').select('*').eq('project_id', project.id).maybeSingle(),
      supabase.from('project_stage_history').select('*').eq('project_id', project.id).order('changed_at', { ascending: true }),
      supabase.from('capital_stacks').select('committed_amount, called_amount').eq('project_id', project.id),
      supabase.from('activities').select('subject, type, activity_date, owner_user_id').eq('what_type', 'Project').eq('what_id', project.id).order('activity_date', { ascending: false }).limit(1),
      supabase.from('profiles').select('id, name'),
    ]);
    setFinancials(finRes.data);
    setStageHistory(histRes.data || []);
    const committed = (capRes.data || []).reduce((s, r) => s + (Number(r.committed_amount) || 0), 0);
    const called = (capRes.data || []).reduce((s, r) => s + (Number(r.called_amount) || 0), 0);
    setCapitalSummary({ committed, called });
    setLastActivity(actRes.data?.[0] || null);
    const pMap = new Map<string, string>();
    (profRes.data || []).forEach(p => pMap.set(p.id, p.name));
    setProfiles(pMap);
  };

  const stages = project.vertical === 'VoltQore' ? VOLTQORE_STAGES : ALL_STAGES;
  const currentIdx = stages.indexOf(project.stage);
  const progressPct = currentIdx >= 0 ? ((currentIdx + 1) / stages.length) * 100 : 0;

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-bold">{project.name}</h2>
          {project.vertical && (
            <Badge variant="outline" className={VERTICAL_COLORS[project.vertical] || ''}>
              {project.vertical.replace(/_/g, ' ')}
            </Badge>
          )}
          <Badge variant="secondary">{project.project_type.replace(/_/g, ' ')}</Badge>
          <Badge>{project.stage.replace(/_/g, ' ')}</Badge>
        </div>

        {/* Stage progress */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{stages[0].replace(/_/g, ' ')}</span>
            <span>{stages[stages.length - 1].replace(/_/g, ' ')}</span>
          </div>
          <Progress value={progressPct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">Stage {currentIdx + 1} of {stages.length}</p>
        </div>

        {/* Key financial stats */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total Cost', value: project.est_total_cost ? formatCurrency(project.est_total_cost) : '—' },
            { label: 'Committed', value: capitalSummary.committed ? formatCurrency(capitalSummary.committed) : '—' },
            { label: 'Called', value: capitalSummary.called ? formatCurrency(capitalSummary.called) : '—' },
            { label: 'Target IRR', value: financials?.target_irr_pct ? `${financials.target_irr_pct}%` : '—' },
            { label: 'Proj. IRR', value: financials?.projected_irr_pct ? `${financials.projected_irr_pct}%` : '—' },
          ].map(stat => (
            <div key={stat.label} className="text-center p-2 rounded-md bg-muted/50">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-sm font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Last activity */}
        {lastActivity && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Zap className="h-3 w-3" />
            Last activity: <strong>{lastActivity.subject}</strong> ({lastActivity.type}) — {formatDistanceToNow(new Date(lastActivity.activity_date), { addSuffix: true })}
            {lastActivity.owner_user_id && ` by ${profiles.get(lastActivity.owner_user_id) || 'Unknown'}`}
          </div>
        )}

        {/* Stage history timeline */}
        {stageHistory.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Stage History</p>
            <div className="flex flex-wrap gap-2">
              {stageHistory.map((h, i) => (
                <div key={h.id} className="flex items-center gap-1 text-xs">
                  {i > 0 && <span className="text-muted-foreground">→</span>}
                  <Badge variant="outline" className="text-[10px] py-0">
                    {h.to_stage.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-muted-foreground">{format(new Date(h.changed_at), 'M/d')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button size="sm" variant="outline" onClick={() => onQuickAction('task')}><ListTodo className="h-3 w-3 mr-1" />Add Task</Button>
          <Button size="sm" variant="outline" onClick={() => onQuickAction('activity')}><Zap className="h-3 w-3 mr-1" />Log Activity</Button>
          <Button size="sm" variant="outline" onClick={() => onQuickAction('document')}><FileText className="h-3 w-3 mr-1" />Upload Doc</Button>
          <Button size="sm" variant="outline" onClick={() => onQuickAction('decision')}><BookOpen className="h-3 w-3 mr-1" />Log Decision</Button>
          <Button size="sm" variant="outline" onClick={() => onQuickAction('note')}><MessageSquare className="h-3 w-3 mr-1" />Add Note</Button>
        </div>
      </CardContent>
    </Card>
  );
}
