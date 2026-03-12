import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ParsedDoc {
  id: string;
  title: string;
  doc_type: string;
  parse_status: string | null;
  parse_confidence: number | null;
  parsed_at: string | null;
  created_at: string;
  field_count?: number;
}

export function ParseHistory() {
  const [docs, setDocs] = useState<ParsedDoc[]>([]);
  const [reParsing, setReParsing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { loadDocs(); }, []);

  const loadDocs = async () => {
    const { data } = await supabase
      .from('documents')
      .select('id, title, doc_type, parse_status, parse_confidence, parsed_at, created_at')
      .not('parse_status', 'is', null)
      .order('parsed_at', { ascending: false })
      .limit(50);

    if (data) {
      // Get field counts
      const ids = data.map(d => d.id);
      const { data: mappings } = await supabase
        .from('parse_field_mappings')
        .select('document_id')
        .in('document_id', ids);

      const counts: Record<string, number> = {};
      mappings?.forEach((m: any) => {
        counts[m.document_id] = (counts[m.document_id] || 0) + 1;
      });

      setDocs(data.map(d => ({ ...d, field_count: counts[d.id] || 0 })) as any);
    }
  };

  const reParse = async (docId: string) => {
    setReParsing(docId);
    const { data, error } = await supabase.functions.invoke('parse-document', {
      body: { document_id: docId },
    });
    setReParsing(null);

    if (error || data?.error) {
      toast({ title: 'Re-parse failed', description: error?.message || data?.error, variant: 'destructive' });
    } else {
      toast({ title: 'Re-parse complete', description: `${data?.fields_extracted || 0} fields extracted` });
      loadDocs();
    }
  };

  const statusBadge = (status: string | null) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
      Pending: { variant: 'outline', label: 'Pending' },
      Processing: { variant: 'secondary', label: 'Processing', className: 'animate-pulse' },
      Extracted: { variant: 'outline', label: 'Review Pending', className: 'border-amber-300 text-amber-700 bg-amber-500/10 animate-pulse' },
      Confirmed: { variant: 'default', label: 'Confirmed' },
      Failed: { variant: 'destructive', label: 'Failed' },
    };
    const cfg = map[status || ''] || { variant: 'outline' as const, label: status || 'Unknown' };
    return <Badge variant={cfg.variant} className={`text-xs ${cfg.className || ''}`}>{cfg.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Parse History</CardTitle>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No documents have been parsed yet. Upload one above to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{doc.doc_type}</span>
                    {doc.parsed_at && (
                      <span>· Parsed {formatDistanceToNow(new Date(doc.parsed_at), { addSuffix: true })}</span>
                    )}
                    {doc.field_count !== undefined && doc.field_count > 0 && (
                      <span>· {doc.field_count} fields</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.parse_confidence !== null && (
                    <span className="text-xs text-muted-foreground">{doc.parse_confidence}% avg</span>
                  )}
                  {statusBadge(doc.parse_status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={reParsing === doc.id}
                    onClick={() => reParse(doc.id)}
                    title="Re-parse this document"
                  >
                    {reParsing === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
