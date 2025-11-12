import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Upload, FileText } from 'lucide-react';
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

interface Commitment {
  id: string;
  vendor: string;
  number: string | null;
}

export function InvoicesTab({ packageId, onUpdate }: InvoicesTabProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    invoice_no: '',
    commitment_id: '',
    period_start: '',
    period_end: '',
    billed_this_period: '',
    retainage_held: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
    loadCommitments();
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

  const loadCommitments = async () => {
    try {
      const { data, error } = await supabase
        .from('commitments')
        .select('id, vendor, number')
        .eq('package_id', packageId)
        .order('vendor');

      if (error) throw error;
      setCommitments(data || []);
    } catch (error: any) {
      console.error('Error loading commitments:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadFile = async (invoiceId: string, file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${packageId}/${invoiceId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('construction-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      return fileName;
    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: 'Error uploading file',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.invoice_no || !newInvoice.billed_this_period) {
      toast({
        title: 'Error',
        description: 'Invoice number and billed amount are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Calculate retainage if not provided
      const billedAmount = parseFloat(newInvoice.billed_this_period);
      let retainageHeld = parseFloat(newInvoice.retainage_held || '0');
      
      // If no retainage specified, calculate 10% default
      if (!newInvoice.retainage_held) {
        const { data: pkgData } = await supabase
          .from('construction_packages')
          .select('retainage_pct')
          .eq('id', packageId)
          .maybeSingle();
        
        const retainagePct = pkgData?.retainage_pct || 10;
        retainageHeld = billedAmount * (retainagePct / 100);
      }

      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .insert({
          package_id: packageId,
          invoice_no: newInvoice.invoice_no,
          commitment_id: newInvoice.commitment_id || null,
          period_start: newInvoice.period_start || null,
          period_end: newInvoice.period_end || null,
          billed_this_period: billedAmount,
          retainage_held: retainageHeld,
          approved_amount: 0,
          status: 'Submitted',
        })
        .select()
        .single();

      if (error) throw error;

      // Upload file if selected
      if (selectedFile && invoiceData) {
        setUploading(true);
        const filePath = await uploadFile(invoiceData.id, selectedFile);
        
        if (filePath) {
          await supabase
            .from('invoices')
            .update({ file_url: filePath })
            .eq('id', invoiceData.id);
        }
        setUploading(false);
      }

      toast({
        title: 'Success',
        description: 'Invoice created',
      });

      setNewInvoice({
        invoice_no: '',
        commitment_id: '',
        period_start: '',
        period_end: '',
        billed_this_period: '',
        retainage_held: '',
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

  const handleDownloadFile = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('construction-files')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'invoice';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: 'Error downloading file',
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
                      <TableCell className="text-right">
                        {formatCurrency(invoice.billed_this_period)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.retainage_held)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(invoice.approved_amount)}
                      </TableCell>
                      <TableCell>
                        {invoice.file_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(invoice.file_url!)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <Label>Commitment (Vendor)</Label>
                <Select
                  value={newInvoice.commitment_id}
                  onValueChange={(value) => setNewInvoice({ ...newInvoice, commitment_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {commitments.map((commitment) => (
                      <SelectItem key={commitment.id} value={commitment.id}>
                        {commitment.vendor} {commitment.number ? `(${commitment.number})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Billed This Period *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newInvoice.billed_this_period}
                  onChange={(e) => setNewInvoice({ ...newInvoice, billed_this_period: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Retainage Held (optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newInvoice.retainage_held}
                  onChange={(e) => setNewInvoice({ ...newInvoice, retainage_held: e.target.value })}
                  placeholder="Auto-calculated at 10%"
                />
              </div>
            </div>

            <div>
              <Label>Upload Invoice File</Label>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('invoice-file-upload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFile ? selectedFile.name : 'Choose File'}
                </Button>
                <input
                  id="invoice-file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
                />
                {selectedFile && (
                  <span className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice} disabled={loading || uploading}>
              {uploading ? 'Uploading...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
