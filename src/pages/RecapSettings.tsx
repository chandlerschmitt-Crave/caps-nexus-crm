import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Clock, Settings, History, Eye, Mail, Calendar, AlertTriangle, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RecapPreferences {
  id: string;
  send_time: string;
  is_enabled: boolean;
  excluded_project_ids: string[];
}

interface RecapLog {
  id: string;
  sent_at: string;
  recipient_count: number;
  subject: string;
  html_body: string | null;
  narrative: string | null;
  stats: any;
  status: string;
  error_message: string | null;
}

interface UpcomingObligation {
  id: string;
  title: string;
  obligation_type: string;
  due_date: string;
  status: string;
  account?: { name: string } | null;
}

export default function RecapSettings() {
  const [prefs, setPrefs] = useState<RecapPreferences | null>(null);
  const [logs, setLogs] = useState<RecapLog[]>([]);
  const [upcomingObligations, setUpcomingObligations] = useState<UpcomingObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendTime, setSendTime] = useState('17:00');
  const [isEnabled, setIsEnabled] = useState(true);
  const [previewLog, setPreviewLog] = useState<RecapLog | null>(null);
  
  // Edit state
  const [editLog, setEditLog] = useState<RecapLog | null>(null);
  const [editNarrative, setEditNarrative] = useState('');
  const [editHtml, setEditHtml] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editTab, setEditTab] = useState('narrative');

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      const [prefsRes, logsRes, oblRes] = await Promise.all([
        supabase.from('recap_preferences').select('*').limit(1).single(),
        supabase.from('recap_logs').select('*').order('sent_at', { ascending: false }).limit(20),
        supabase.from('investor_obligations' as any)
          .select('id, title, obligation_type, due_date, status, account:accounts(name)')
          .neq('status', 'Completed')
          .lte('due_date', in30)
          .order('due_date', { ascending: true }),
      ]);

      if (prefsRes.data) {
        setPrefs(prefsRes.data as any);
        setSendTime(prefsRes.data.send_time?.substring(0, 5) || '17:00');
        setIsEnabled(prefsRes.data.is_enabled);
      }

      if (logsRes.data) {
        setLogs(logsRes.data as any);
      }
      
      setUpcomingObligations((oblRes.data as any) || []);
    } catch (err) {
      console.error('Error loading recap data:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!prefs?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('recap_preferences')
        .update({
          send_time: sendTime + ':00',
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq('id', prefs.id);

      if (error) throw error;

      toast({ title: 'Preferences saved', description: 'Recap settings have been updated.' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const sendRecapNow = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-recap', {
        body: { manual: true },
      });

      if (error) throw error;

      toast({
        title: 'Recap generated!',
        description: `${data.recipientCount} recipients. ${data.stats?.tasksCompleted || 0} tasks completed today.`,
      });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error sending recap', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const openEditDialog = (log: RecapLog) => {
    setEditLog(log);
    setEditSubject(log.subject || '');
    setEditNarrative(log.narrative || '');
    setEditHtml(log.html_body || '');
    setEditTab('narrative');
  };

  const saveRecapEdit = async () => {
    if (!editLog) return;
    setSavingEdit(true);
    try {
      // If narrative changed, update it in the HTML body too
      let finalHtml = editHtml;
      if (editNarrative !== editLog.narrative && editLog.html_body && editLog.narrative) {
        // Replace the old narrative in the HTML with the new one
        finalHtml = finalHtml.replace(editLog.narrative, editNarrative);
      }

      const { error } = await supabase
        .from('recap_logs')
        .update({
          subject: editSubject,
          narrative: editNarrative,
          html_body: finalHtml,
        })
        .eq('id', editLog.id);

      if (error) throw error;

      toast({ title: 'Recap updated', description: 'Your edits have been saved.' });
      setEditLog(null);
      loadData();
    } catch (err: any) {
      toast({ title: 'Error saving edit', description: err.message, variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      sent: 'bg-green-100 text-green-800',
      generated: 'bg-accent/20 text-accent-foreground',
      failed: 'bg-destructive/20 text-destructive',
    };
    return variants[status] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Recap</h1>
          <p className="text-muted-foreground">Configure your daily portfolio summary email</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-accent" />
                Configuration
              </CardTitle>
              <CardDescription>Set your recap delivery preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Enable Daily Recap</Label>
                  <p className="text-sm text-muted-foreground">Send automated daily emails</p>
                </div>
                <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Send Time (UTC)
                </Label>
                <Input
                  type="time"
                  value={sendTime}
                  onChange={(e) => setSendTime(e.target.value)}
                  className="w-40"
                />
                <p className="text-xs text-muted-foreground">
                  The recap will be generated and sent at this time daily
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Recipients
                </Label>
                <p className="text-sm text-muted-foreground">
                  All registered team members will receive the recap
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={savePreferences} disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manual Send Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-accent" />
                Manual Send
              </CardTitle>
              <CardDescription>Generate and send a recap right now</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click below to generate a recap based on today's data. This will create the email
                and log it for review. You can edit the recap before sending.
              </p>
              <Button
                onClick={sendRecapNow}
                disabled={sending}
                className="w-full"
                variant="outline"
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? 'Generating Recap...' : 'Generate Recap'}
              </Button>

              {logs.length > 0 && logs[0].stats && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Last Recap Stats</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>✅ Tasks: {logs[0].stats.tasksCompleted}</div>
                    <div>📁 Projects: {logs[0].stats.newProjects}</div>
                    <div>👤 Contacts: {logs[0].stats.newContacts}</div>
                    <div>⚠️ Urgent: {logs[0].stats.urgentItems}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recap History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-accent" />
              Recap History
            </CardTitle>
            <CardDescription>Previously generated recap emails — click edit to modify before sending</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No recaps generated yet. Click "Generate Recap" to create your first one.
              </p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{log.subject}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{format(new Date(log.sent_at), 'MMM d, yyyy h:mm a')}</span>
                        <span>·</span>
                        <span>{log.recipient_count} recipients</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadge(log.status)}>
                        {log.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(log)}
                        title="Edit recap"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {log.html_body && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewLog(log)}
                          title="Preview recap"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investor Reporting - Upcoming Obligations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Investor Reporting — Next 30 Days
            </CardTitle>
            <CardDescription>Upcoming investor obligations to review for the daily recap</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingObligations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No investor obligations due in the next 30 days. All clear!
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingObligations.map((obl) => {
                  const isOverdue = new Date(obl.due_date) < new Date();
                  return (
                    <div
                      key={obl.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${isOverdue ? 'border-red-300 bg-red-50/50 dark:bg-red-950/10' : ''}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{obl.title}</p>
                          <Badge variant="outline" className="text-[10px]">{obl.obligation_type.replace(/_/g, ' ')}</Badge>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-[10px]">
                              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                              OVERDUE
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{(obl as any).account?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                          {new Date(obl.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewLog} onOpenChange={(open) => !open && setPreviewLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewLog?.subject}</DialogTitle>
          </DialogHeader>
          {previewLog?.html_body && (
            <div
              className="mt-4"
              dangerouslySetInnerHTML={{ __html: previewLog.html_body }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editLog} onOpenChange={(open) => !open && setEditLog(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Recap
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
              />
            </div>

            <Tabs value={editTab} onValueChange={setEditTab}>
              <TabsList className="w-full">
                <TabsTrigger value="narrative" className="flex-1">Executive Brief</TabsTrigger>
                <TabsTrigger value="html" className="flex-1">Full HTML</TabsTrigger>
                <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="narrative" className="space-y-2">
                <Label>Executive Brief Narrative</Label>
                <Textarea
                  value={editNarrative}
                  onChange={(e) => setEditNarrative(e.target.value)}
                  className="min-h-[160px]"
                  placeholder="Write the executive brief narrative..."
                />
                <p className="text-xs text-muted-foreground">
                  This is the AI-generated summary at the top of the recap. Edit it to refine the tone or add context.
                </p>
              </TabsContent>

              <TabsContent value="html" className="space-y-2">
                <Label>HTML Body</Label>
                <Textarea
                  value={editHtml}
                  onChange={(e) => setEditHtml(e.target.value)}
                  className="min-h-[300px] font-mono text-xs"
                  placeholder="Full HTML email body..."
                />
                <p className="text-xs text-muted-foreground">
                  Advanced: edit the full HTML email template directly.
                </p>
              </TabsContent>

              <TabsContent value="preview">
                {editHtml && (
                  <div
                    className="border rounded-lg p-4 max-h-[400px] overflow-auto bg-background"
                    dangerouslySetInnerHTML={{ __html: editHtml }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditLog(null)}>
              Cancel
            </Button>
            <Button onClick={saveRecapEdit} disabled={savingEdit}>
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}