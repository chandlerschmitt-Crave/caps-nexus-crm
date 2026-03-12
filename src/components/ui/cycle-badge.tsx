import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface CycleBadgeProps {
  value: string;
  options: string[];
  table: string;
  id: string;
  field: string;
  onUpdate?: () => void;
  colorMap?: Record<string, string>;
  variant?: 'outline' | 'secondary' | 'default' | 'destructive';
}

const defaultStatusColors: Record<string, string> = {
  Not_Started: 'bg-muted text-muted-foreground',
  In_Progress: 'bg-blue-500/20 text-blue-700 border-blue-300',
  Blocked: 'bg-destructive/20 text-destructive border-destructive/30',
  Done: 'bg-green-500/20 text-green-700 border-green-300',
};

const defaultPriorityColors: Record<string, string> = {
  Low: 'bg-muted text-muted-foreground',
  Med: 'bg-amber-500/20 text-amber-700 border-amber-300',
  High: 'bg-destructive/20 text-destructive border-destructive/30',
};

export function CycleBadge({ value, options, table, id, field, onUpdate, colorMap, variant = 'outline' }: CycleBadgeProps) {
  const [currentValue, setCurrentValue] = useState(value);
  const [loading, setLoading] = useState(false);

  const colors = colorMap || (field === 'priority' ? defaultPriorityColors : defaultStatusColors);

  const handleCycle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    
    const currentIdx = options.indexOf(currentValue);
    const nextIdx = (currentIdx + 1) % options.length;
    const nextValue = options[nextIdx];

    setLoading(true);
    const { error } = await supabase.from(table as any).update({ [field]: nextValue } as any).eq('id', id);
    
    if (!error) {
      setCurrentValue(nextValue);
      onUpdate?.();
    }
    setLoading(false);
  };

  return (
    <Badge
      variant={variant}
      className={`text-xs cursor-pointer select-none transition-opacity ${loading ? 'opacity-50' : ''} ${colors[currentValue] || ''}`}
      onClick={handleCycle}
      title={`Click to cycle: ${options.join(' → ')}`}
    >
      {currentValue.replace(/_/g, ' ')}
    </Badge>
  );
}
