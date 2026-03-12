import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Clock, Settings, History, Eye, Mail, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendTime, setSendTime] = useState('17:00');
  const [isEnabled, setIsEnabled] = useState(true);
  const [previewLog, setPreviewLog] = useState<RecapLog | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prefsRes, logsRes] = await Promise.all([
        supabase.from('recap_preferences').select('*').limit(1).single(),
        supabase.from('recap_logs').select('*').order('sent_at', { ascending: false }).limit(20),
      ]);

      if (prefsRes.data) {
        setPrefs(prefsRes.data as any);
        setSendTime(prefsRes.data.send_time?.substring(0, 5) || '17:00');
        setIsEnabled(prefsRes.data.is_enabled);
      }

      if (logsRes.data) {
        setLogs(logsRes.data as any);
      }
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
                and log it for review. Email delivery requires a configured email domain.
              </p>
              <Button
                onClick={sendRecapNow}
                disabled={sending}
                className="w-full"
                variant="outline"
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? 'Generating Recap...' : 'Send Recap Now'}
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
            <CardDescription>Previously generated recap emails</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No recaps generated yet. Click "Send Recap Now" to create your first one.
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
                      {log.html_body && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewLog(log)}
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
    </Layout>
  );
}
