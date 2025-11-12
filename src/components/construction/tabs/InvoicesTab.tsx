import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Upload, FileText, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InvoicesTabProps {
  packageId: string;
  onUpdate?: () => void;
}

interface Invoice {
  id: string;
  invoice_no: string;
  status: string;
  period_start: string | null;
  period_end: string | null;
  billed_this_period: number;
  retainage_held: number;
  approved_amount: number;
  file_url: string | null;
  commitment_id: string | null;
  created_at: string;
}

export function InvoicesTab({ packageId, onUpdate }: InvoicesTabProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    invoice_no: '',
    billed_this_period: '',
    period_start: '',
    period_end: '',
    status: 'Submitted',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, [packageId]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('package_id', packageId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload PDF, JPG, PNG, or XLSX files only',
          variant: 'destructive',
        });
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 10MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File, invoiceNo: string): Promise<string | null> => {
    try {
      setUploadingFile(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${packageId}/${invoiceNo}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('construction-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('construction-files')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error: any) {
      toast({
        title: 'File upload failed',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.invoice_no || !newInvoice.billed_this_period) {
      toast({
        title: 'Error',
        description: 'Invoice number and amount are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      let fileUrl = null;
      
      // Upload file if selected
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile, newInvoice.invoice_no);
        if (!fileUrl) {
          setLoading(false);
          return;
        }
      }

      // Calculate retainage (10% default)
      const billedAmount = parseFloat(newInvoice.billed_this_period);
      const retainageHeld = billedAmount * 0.10;

      const { error } = await supabase.from('invoices').insert({
        package_id: packageId,
        invoice_no: newInvoice.invoice_no,
        status: newInvoice.status,
        period_start: newInvoice.period_start || null,
        period_end: newInvoice.period_end || null,
        billed_this_period: billedAmount,
        retainage_held: retainageHeld,
        approved_amount: 0,
        file_url: fileUrl,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });

      setNewInvoice({
        invoice_no: '',
        billed_this_period: '',
        period_start: '',
        period_end: '',
        status: 'Submitted',
      });
      setSelectedFile(null);
      setCreateDialogOpen(false);
      await loadInvoices();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploadToExisting = async (invoiceId: string, invoiceNo: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileUrl = await uploadFile(file, invoiceNo);
    if (!fileUrl) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .update({ file_url: fileUrl })
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });

      loadInvoices();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Submitted: 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]',
      Approved: 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))]',
      Paid: 'bg-[hsl(var(--success))] text-white',
      Rejected: 'bg-destructive text-white',
    };
    return colors[status] || 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]';
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Invoices</CardTitle>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No invoices yet. Click "New Invoice" to create one.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Billed</TableHead>
                    <TableHead className="text-right">Retainage</TableHead>
                    <TableHead className="text-right">Approved</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_no}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {invoice.period_start && invoice.period_end
                          ? `${new Date(invoice.period_start).toLocaleDateString()} - ${new Date(invoice.period_end).toLocaleDateString()}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.billed_this_period)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.retainage_held)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(invoice.approved_amount)}</TableCell>
                      <TableCell>
                        {invoice.file_url ? (
                          <a
                            href={invoice.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-primary hover:underline"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">No file</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => document.getElementById(`upload-${invoice.id}`)?.click()}
                            disabled={uploadingFile}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload
                          </Button>
                          <input
                            id={`upload-${invoice.id}`}
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUploadToExisting(invoice.id, invoice.invoice_no, e)}
                            accept=".pdf,.jpg,.jpeg,.png,.xlsx"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Invoice Number *</Label>
                <Input
                  value={newInvoice.invoice_no}
                  onChange={(e) => setNewInvoice({ ...newInvoice, invoice_no: e.target.value })}
                  placeholder="INV-001"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={newInvoice.status}
                  onValueChange={(value) => setNewInvoice({ ...newInvoice, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Billed This Period *</Label>
              <Input
                type="number"
                value={newInvoice.billed_this_period}
                onChange={(e) => setNewInvoice({ ...newInvoice, billed_this_period: e.target.value })}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Period Start</Label>
                <Input
                  type="date"
                  value={newInvoice.period_start}
                  onChange={(e) => setNewInvoice({ ...newInvoice, period_start: e.target.value })}
                />
              </div>
              <div>
                <Label>Period End</Label>
                <Input
                  type="date"
                  value={newInvoice.period_end}
                  onChange={(e) => setNewInvoice({ ...newInvoice, period_end: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Upload Invoice File (Optional)</Label>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('invoice-file-input')?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFile ? selectedFile.name : 'Choose File'}
                </Button>
                <input
                  id="invoice-file-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Accepted: PDF, JPG, PNG, XLSX (Max 10MB)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice} disabled={loading || uploadingFile}>
              {uploadingFile ? 'Uploading...' : loading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
