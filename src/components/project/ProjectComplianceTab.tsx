import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Shield } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectComplianceTabProps {
  projectId: string;
}

export function ProjectComplianceTab({ projectId }: ProjectComplianceTabProps) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    loadItems();
  }, [projectId]);

  const loadItems = async () => {
    const { data } = await supabase
      .from('compliance_items')
      .select('*')
      .eq('project_id', projectId)
      .order('due_date');
    setItems(data || []);
  };

  const getStatusColor = (status: string, dueDate: string) => {
    if (status === 'Approved' || status === 'Waived') return 'bg-green-500/20 text-green-700';
    const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
    if (status === 'Overdue' || diff < 0) return 'bg-destructive/20 text-destructive';
    if (diff <= 7) return 'bg-orange-500/20 text-orange-700';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Compliance Items ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No compliance items for this project.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.item_type.replace(/_/g, ' ')}</TableCell>
                  <TableCell>{format(new Date(item.due_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(item.status, item.due_date)}>
                      {item.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
