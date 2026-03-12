import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectDocumentsTabProps {
  projectId: string;
}

const DOC_TYPES = ['Deck', 'Model', 'Proforma', 'PPM', 'LOI', 'Contract'];

export function ProjectDocumentsTab({ projectId }: ProjectDocumentsTabProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', doc_type: 'Deck' });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { loadDocs(); }, [projectId]);

  const loadDocs = async () => {
    const { data } = await supabase.from('documents').select('*').eq('related_type', 'Project').eq('related_id', projectId).order('created_at', { ascending: false });
    setDocuments(data || []);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('documents').insert({
        title: form.title, url: form.url, doc_type: form.doc_type as any,
        related_type: 'Project', related_id: projectId,
        uploaded_by_user_id: user?.id,
      });
      if (error) throw error;
      toast({ title: 'Document added' });
      setDialogOpen(false);
      setForm({ title: '', url: '', doc_type: 'Deck' });
      loadDocs();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Documents ({documents.length})</h3>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Upload Document</Button>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No documents linked to this project.</p>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <Card key={doc.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{doc.doc_type}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>URL *</Label><Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.doc_type} onValueChange={v => setForm(f => ({ ...f, doc_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={!form.title || !form.url}>Add Document</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
