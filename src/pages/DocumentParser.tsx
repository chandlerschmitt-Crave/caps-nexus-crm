import { useState, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, FileText, Loader2, CheckCircle, XCircle, Sparkles, History, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentReviewPanel } from '@/components/parser/DocumentReviewPanel';
import { ParseHistory } from '@/components/parser/ParseHistory';
import { RecordLinker } from '@/components/parser/RecordLinker';

const DOC_TYPES = [
  'Investor Deck',
  'Term Sheet / LOI',
  'Proforma / Financial Model',
  'Construction Contract',
  'Lease Agreement',
  'Capital Call Notice',
  'K1 / Tax Document',
  'Investment Memo',
  'Other',
];

const DOC_TYPE_MAP: Record<string, string> = {
  'Investor Deck': 'Deck',
  'Term Sheet / LOI': 'LOI',
  'Proforma / Financial Model': 'Proforma',
  'Construction Contract': 'Contract',
  'Lease Agreement': 'Contract',
  'Capital Call Notice': 'Other',
  'K1 / Tax Document': 'Other',
  'Investment Memo': 'Deck',
  'Other': 'Other',
};

interface LinkedRecord {
  type: string;
  id: string;
  name: string;
}

export default function DocumentParser() {
  const [docType, setDocType] = useState('');
  const [linkedRecord, setLinkedRecord] = useState<LinkedRecord | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [parseComplete, setParsComplete] = useState(false);
  const [bulkQueue, setBulkQueue] = useState<Array<{ file: File; status: string; docId?: string }>>([]);
  const [dragOver, setDragOver] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const uploadAndParse = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'pdf';
    const filePath = `${user?.id}/${Date.now()}-${file.name}`;

    // Upload to storage
    const { error: upErr } = await supabase.storage.from('documents').upload(filePath, file);
    if (upErr) {
      toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' });
      return null;
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
    const fileUrl = urlData?.publicUrl || filePath;

    // Create document record
    const dbDocType = DOC_TYPE_MAP[docType] || 'Other';
    const { data: docData, error: docErr } = await supabase.from('documents').insert({
      title: file.name,
      url: fileUrl,
      doc_type: dbDocType as any,
      uploaded_by_user_id: user?.id,
      related_id: linkedRecord?.id || null,
      related_type: linkedRecord?.type || null,
      parse_status: 'Pending',
    }).select('id').single();

    if (docErr || !docData) {
      toast({ title: 'Error creating document record', description: docErr?.message, variant: 'destructive' });
      return null;
    }

    return docData.id;
  };

  const triggerParse = async (docId: string) => {
    const { data, error } = await supabase.functions.invoke('parse-document', {
      body: { document_id: docId },
    });

    if (error) {
      toast({ title: 'Parse failed', description: error.message, variant: 'destructive' });
      return false;
    }

    if (data?.error) {
      toast({ title: 'Parse failed', description: data.error, variant: 'destructive' });
      return false;
    }

    toast({
      title: 'Extraction complete',
      description: `Extracted ${data?.fields_extracted || 0} fields with ${data?.avg_confidence || 0}% avg confidence`,
    });
    return true;
  };

  const handleSingleUpload = async () => {
    if (files.length === 0 || !docType) {
      toast({ title: 'Missing info', description: 'Please select a file and document type', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const docId = await uploadAndParse(files[0]);
    setUploading(false);

    if (!docId) return;

    setParsing(true);
    setCurrentDocId(docId);
    const success = await triggerParse(docId);
    setParsing(false);

    if (success) {
      setParsComplete(true);
    }
  };

  const handleBulkUpload = async () => {
    if (files.length === 0 || !docType) {
      toast({ title: 'Missing info', description: 'Please select files and document type', variant: 'destructive' });
      return;
    }

    const queue = files.map(f => ({ file: f, status: 'Queued' as string }));
    setBulkQueue(queue);

    for (let i = 0; i < queue.length; i++) {
      setBulkQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'Uploading' } : q));
      
      const docId = await uploadAndParse(queue[i].file);
      if (!docId) {
        setBulkQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'Failed' } : q));
        continue;
      }

      setBulkQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'Parsing', docId } : q));
      const success = await triggerParse(docId);
      setBulkQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: success ? 'Done' : 'Failed' } : q));
    }

    toast({ title: 'Bulk processing complete' });
  };

  const resetForm = () => {
    setFiles([]);
    setCurrentDocId(null);
    setParsComplete(false);
    setBulkQueue([]);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-accent" />
            Document Parser
          </h1>
          <p className="text-muted-foreground">
            Upload documents and let AI extract structured data into your CRM
          </p>
        </div>

        <Tabs defaultValue="upload">
          <TabsList>
            <TabsTrigger value="upload" className="gap-2"><Upload className="h-4 w-4" /> Upload & Parse</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" /> Parse History</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6 mt-4">
            {/* Review Panel — shown when extraction is complete */}
            {parseComplete && currentDocId ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Extraction Complete — Review & Confirm
                  </h2>
                  <Button variant="outline" onClick={resetForm}>Parse Another Document</Button>
                </div>
                <DocumentReviewPanel documentId={currentDocId} linkedRecord={linkedRecord} />
              </div>
            ) : (
              <>
                {/* Upload Zone */}
                <Card>
                  <CardContent className="p-6 space-y-6">
                    {/* Document Type */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Document Type</label>
                        <Select value={docType} onValueChange={setDocType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {DOC_TYPES.map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Link to Record (optional)</label>
                        <RecordLinker value={linkedRecord} onChange={setLinkedRecord} />
                      </div>
                    </div>

                    {/* Drop Zone */}
                    <div
                      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                        dragOver ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-1">
                        Drag & drop files here
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        PDF, DOCX, XLSX, JPG, PNG — max 20MB
                      </p>
                      <label>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
                          multiple
                          onChange={handleFileSelect}
                        />
                        <Button variant="outline" asChild>
                          <span>Browse Files</span>
                        </Button>
                      </label>
                    </div>

                    {/* File list */}
                    {files.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{files.length} file(s) selected:</p>
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-md border">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm flex-1 truncate">{f.name}</span>
                            <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                            <Button variant="ghost" size="sm" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSingleUpload}
                        disabled={files.length === 0 || !docType || uploading || parsing}
                        className="gap-2"
                      >
                        {(uploading || parsing) && <Loader2 className="h-4 w-4 animate-spin" />}
                        {uploading ? 'Uploading...' : parsing ? 'AI is extracting...' : 'Upload & Parse'}
                      </Button>
                      {files.length > 1 && (
                        <Button
                          variant="outline"
                          onClick={handleBulkUpload}
                          disabled={!docType || uploading || parsing}
                          className="gap-2"
                        >
                          <Layers className="h-4 w-4" />
                          Bulk Parse ({files.length} files)
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Bulk Queue */}
                {bulkQueue.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Processing Queue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {bulkQueue.map((q, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-md border">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm flex-1 truncate">{q.file.name}</span>
                            <Badge variant={
                              q.status === 'Done' ? 'default' :
                              q.status === 'Failed' ? 'destructive' :
                              q.status === 'Parsing' ? 'secondary' : 'outline'
                            } className="text-xs">
                              {q.status === 'Parsing' && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                              {q.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ParseHistory />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
