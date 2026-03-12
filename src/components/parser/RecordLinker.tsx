import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface LinkedRecord {
  type: string;
  id: string;
  name: string;
}

interface Props {
  value: LinkedRecord | null;
  onChange: (record: LinkedRecord | null) => void;
}

interface Option {
  type: string;
  id: string;
  name: string;
}

export function RecordLinker({ value, onChange }: Props) {
  const [options, setOptions] = useState<Option[]>([]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    const [projects, accounts, deals] = await Promise.all([
      supabase.from('projects').select('id, name').order('name').limit(50),
      supabase.from('accounts').select('id, name').order('name').limit(50),
      supabase.from('deals').select('id, name').order('name').limit(50),
    ]);

    const opts: Option[] = [];
    projects.data?.forEach(p => opts.push({ type: 'project', id: p.id, name: `Project: ${p.name}` }));
    accounts.data?.forEach(a => opts.push({ type: 'account', id: a.id, name: `Account: ${a.name}` }));
    deals.data?.forEach(d => opts.push({ type: 'deal', id: d.id, name: `Deal: ${d.name}` }));
    setOptions(opts);
  };

  const selectedKey = value ? `${value.type}:${value.id}` : '';

  return (
    <Select
      value={selectedKey}
      onValueChange={(val) => {
        if (!val) { onChange(null); return; }
        const opt = options.find(o => `${o.type}:${o.id}` === val);
        if (opt) onChange({ type: opt.type, id: opt.id, name: opt.name });
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="None — parse without linking" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        {options.map(opt => (
          <SelectItem key={`${opt.type}:${opt.id}`} value={`${opt.type}:${opt.id}`}>
            {opt.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
