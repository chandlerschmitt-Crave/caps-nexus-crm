import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Users,
  Clock,
  Eye,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface RecapLog {
  id: string;
  sent_at: string;
  narrative: string | null;
  stats: any;
  html_body: string | null;
  status: string;
}

interface ProjectBreakdown {
  id: string;
  name: string;
  stage: string;
  completedToday: any[];
  overdueTasks: any[];
  upcomingTasks: any[];
  todayNotes: any[];
  isStale: boolean;
}

const PIPELINE_STAGES = [
  'Ideation',
  'Pre-Dev',
  'Raising',
  'Entitlements',
  'Construction',
  'Stabilization',
  'Exit',
];

export function DailyBrief() {
  const [latestRecap, setLatestRecap] = useState<RecapLog | null>(null);
  const [projects, setProjects] = useState<ProjectBreakdown[]>([]);
  const [watchlist, setWatchlist] = useState<{ message: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadBrief();
  }, []);

  const loadBrief = async () => {
    setLoading(true);
    try {
      // Load latest recap log
      const { data: recapData } = await supabase
        .from('recap_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recapData) {
        setLatestRecap(recapData as any);
      }

      // Load live portfolio data for breakdown
      await loadPortfolioBreakdown();
    } catch (err) {
      console.error('Error loading brief:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolioBreakdown = async () => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();
    const todayEnd = new Date(now);
    todayEnd.setUTCHours(23, 59, 59, 999);
    const todayEndISO = todayEnd.toISOString();

    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const next7Days = new Date(now);
    next7Days.setDate(next7Days.getDate() + 7);
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const [projectsRes, tasksRes, notesRes, activitiesRes] = await Promise.all([
      supabase.from('projects').select('id, name, stage'),
      supabase.from('tasks').select('*, owner:profiles(name)'),
      supabase.from('notes').select('*').gte('created_at', todayISO).lte('created_at', todayEndISO),
      supabase.from('activities').select('what_id').gte('activity_date', threeDaysAgo.toISOString()),
    ]);

    const allProjects = projectsRes.data || [];
    const allTasks = tasksRes.data || [];
    const todayNotes = notesRes.data || [];
    const recentActivityIds = new Set((activitiesRes.data || []).map((a: any) => a.what_id).filter(Boolean));

    const breakdowns: ProjectBreakdown[] = allProjects.map((project: any) => {
      const projectTasks = allTasks.filter((t: any) => t.related_id === project.id);
      const completedToday = projectTasks.filter(
        (t: any) => t.status === 'Done' && t.created_at >= todayISO && t.created_at <= todayEndISO
      );
      const openTasks = projectTasks.filter((t: any) => t.status !== 'Done');
      const overdueTasks = openTasks.filter(
        (t: any) => t.due_date && new Date(t.due_date) < now
      );
      const upcomingTasks = openTasks.filter(
        (t: any) => t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= next7Days
      );
      const projectNotes = todayNotes.filter((n: any) => n.related_id === project.id);
      const isStale = !recentActivityIds.has(project.id);

      return {
        id: project.id,
        name: project.name,
        stage: project.stage,
        completedToday,
        overdueTasks,
        upcomingTasks,
        todayNotes: projectNotes,
        isStale,
      };
    });

    setProjects(breakdowns);

    // Build watchlist
    const watchlistItems: { message: string; type: string }[] = [];
    breakdowns.forEach((p) => {
      if (p.isStale) {
        watchlistItems.push({ message: `${p.name} — No activity in 3+ days`, type: 'stale' });
      }
      if (p.overdueTasks.length >= 2) {
        watchlistItems.push({ message: `${p.name} — ${p.overdueTasks.length} overdue tasks`, type: 'overdue' });
      }
      const urgentUpcoming = (allTasks || []).filter(
        (t: any) =>
          t.related_id === p.id &&
          t.status !== 'Done' &&
          t.due_date &&
          new Date(t.due_date) <= twoDaysFromNow &&
          new Date(t.due_date) >= now
      );
      if (urgentUpcoming.length > 0) {
        watchlistItems.push({ message: `${p.name} — Tasks due within 48 hours`, type: 'urgent' });
      }
    });
    setWatchlist(watchlistItems);
  };

  const generateBrief = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-recap', {
        body: { manual: true },
      });
      if (error) throw error;
      toast({
        title: '✨ Daily Brief Updated',
        description: `Portfolio snapshot refreshed with ${data.stats?.tasksCompleted || 0} tasks completed today.`,
      });
      loadBrief();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const getStageIndex = (stage: string) => {
    const idx = PIPELINE_STAGES.indexOf(stage);
    return idx >= 0 ? idx : 0;
  };

  if (loading) {
    return (
      <Card className="border-t-[3px] border-t-accent">
        <CardContent className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
        </CardContent>
      </Card>
    );
  }

  const stats = latestRecap?.stats || {};
  const briefDate = latestRecap?.sent_at
    ? format(new Date(latestRecap.sent_at), 'EEEE, MMMM d, yyyy · h:mm a')
    : 'No brief generated yet';

  return (
    <Card className="border-t-[3px] border-t-accent overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Daily Brief</CardTitle>
              <p className="text-xs text-muted-foreground">{briefDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateBrief}
              disabled={generating}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Narrative */}
        {latestRecap?.narrative ? (
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
            <p className="text-sm leading-relaxed">{latestRecap.narrative}</p>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No brief generated yet. Click "Refresh" to generate your first daily brief.
            </p>
          </div>
        )}

        {/* Stats Block */}
        {latestRecap && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatChip icon={CheckCircle2} label="Completed" value={stats.tasksCompleted || 0} color="text-green-600" />
            <StatChip icon={FolderKanban} label="New Projects" value={stats.newProjects || 0} color="text-primary" />
            <StatChip icon={Users} label="New Contacts" value={(stats.newInvestors || 0) + (stats.newContacts || 0)} color="text-primary" />
            <StatChip icon={AlertTriangle} label="Urgent" value={stats.urgentItems || 0} color={stats.urgentItems > 0 ? 'text-destructive' : 'text-muted-foreground'} />
            <StatChip icon={Eye} label="Watchlist" value={watchlist.length} color={watchlist.length > 0 ? 'text-amber-600' : 'text-muted-foreground'} />
          </div>
        )}

        {/* Expand/Collapse for Portfolio Breakdown */}
        <Button
          variant="ghost"
          className="w-full justify-between text-sm font-medium"
          onClick={() => setExpanded(!expanded)}
        >
          <span>Portfolio Breakdown ({projects.length} projects)</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {expanded && (
          <div className="space-y-3">
            {projects.map((project) => {
              const stageIdx = getStageIndex(project.stage);
              const isOpen = expandedProject === project.id;
              const hasIssues = project.overdueTasks.length > 0 || project.isStale;

              return (
                <div
                  key={project.id}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    hasIssues ? 'border-destructive/30' : 'border-border'
                  }`}
                >
                  <button
                    onClick={() => setExpandedProject(isOpen ? null : project.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-medium text-sm truncate">{project.name}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {project.stage.replace(/_/g, ' ')}
                      </Badge>
                      {project.isStale && (
                        <Badge variant="secondary" className="text-xs shrink-0 bg-amber-100 text-amber-800">
                          Stale
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {project.overdueTasks.length > 0 && (
                        <span className="text-xs text-destructive font-medium">
                          {project.overdueTasks.length} overdue
                        </span>
                      )}
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {/* Stage progress bar */}
                  <div className="px-3 pb-1 flex gap-[2px]">
                    {PIPELINE_STAGES.map((s, i) => (
                      <div
                        key={s}
                        className={`h-1.5 flex-1 rounded-full ${
                          i <= stageIdx ? 'bg-accent' : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>

                  {isOpen && (
                    <div className="px-3 pb-3 pt-2 space-y-3 text-sm">
                      {/* Completed Today */}
                      <div>
                        <p className="font-medium text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Tasks Completed Today
                        </p>
                        {project.completedToday.length > 0 ? (
                          project.completedToday.map((t: any) => (
                            <p key={t.id} className="text-xs pl-4 py-0.5">✅ {t.subject}</p>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground pl-4">None today</p>
                        )}
                      </div>

                      {/* Overdue */}
                      {project.overdueTasks.length > 0 && (
                        <div>
                          <p className="font-medium text-xs text-destructive mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Overdue Tasks
                          </p>
                          {project.overdueTasks.map((t: any) => (
                            <p key={t.id} className="text-xs pl-4 py-0.5 text-destructive">
                              ⚠️ {t.subject} — {t.owner?.name || 'Unassigned'} (Due: {t.due_date})
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Upcoming */}
                      {project.upcomingTasks.length > 0 && (
                        <div>
                          <p className="font-medium text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Upcoming (7 days)
                          </p>
                          {project.upcomingTasks.slice(0, 5).map((t: any) => (
                            <p key={t.id} className="text-xs pl-4 py-0.5">
                              📅 {t.subject} — Due: {t.due_date}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {project.todayNotes.length > 0 && (
                        <div>
                          <p className="font-medium text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> Notes Today
                          </p>
                          {project.todayNotes.map((n: any) => (
                            <p key={n.id} className="text-xs pl-4 py-0.5 text-muted-foreground">
                              💬 {n.content.substring(0, 100)}{n.content.length > 100 ? '...' : ''}
                            </p>
                          ))}
                        </div>
                      )}

                      <Button
                        variant="link"
                        size="sm"
                        className="text-xs p-0 h-auto"
                        onClick={() => navigate('/projects')}
                      >
                        View Project →
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Watchlist */}
        {expanded && watchlist.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                🔍 Watchlist
              </p>
              <div className="space-y-1">
                {watchlist.map((item, i) => (
                  <div
                    key={i}
                    className={`text-xs px-3 py-2 rounded ${
                      item.type === 'overdue'
                        ? 'bg-destructive/10 text-destructive'
                        : item.type === 'urgent'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {item.type === 'overdue' ? '🚨' : item.type === 'urgent' ? '⏰' : '🔇'} {item.message}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Recap History Link */}
        <div className="flex justify-end">
          <Button
            variant="link"
            size="sm"
            className="text-xs"
            onClick={() => navigate('/recap-settings')}
          >
            <Clock className="h-3 w-3 mr-1" />
            View Brief History & Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
