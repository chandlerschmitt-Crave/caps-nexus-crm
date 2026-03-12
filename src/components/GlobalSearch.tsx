import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { FolderKanban, Building2, UserCircle, Briefcase, ListTodo, MapPin, Shield, BookOpen } from 'lucide-react';

interface SearchResult {
  id: string;
  type: string;
  name: string;
  summary: string;
  icon: React.ElementType;
}

// Global open function so other components can trigger search
let globalOpenSearch: (() => void) | null = null;

export function openGlobalSearch() {
  globalOpenSearch?.();
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Register global opener
  useEffect(() => {
    globalOpenSearch = () => setOpen(true);
    return () => { globalOpenSearch = null; };
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const like = `%${q}%`;

    const [projects, accounts, contacts, deals, tasks, compliance, decisions] = await Promise.all([
      supabase.from('projects').select('id, name, vertical, stage').ilike('name', like).limit(5),
      supabase.from('accounts').select('id, name, type_of_account').ilike('name', like).limit(5),
      supabase.from('contacts').select('id, first_name, last_name, email').or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`).limit(5),
      supabase.from('deals').select('id, name, stage, instrument').ilike('name', like).limit(5),
      supabase.from('tasks').select('id, subject, status').ilike('subject', like).limit(5),
      supabase.from('compliance_items').select('id, title, status, item_type').ilike('title', like).limit(5),
      supabase.from('decision_log').select('id, title, decision_type').ilike('title', like).limit(5),
    ]);

    const r: SearchResult[] = [];
    projects.data?.forEach(p => r.push({ id: p.id, type: 'Project', name: p.name, summary: `${p.vertical || ''} · ${p.stage}`, icon: FolderKanban }));
    accounts.data?.forEach(a => r.push({ id: a.id, type: 'Account', name: a.name, summary: a.type_of_account?.replace(/_/g, ' ') || '', icon: Building2 }));
    contacts.data?.forEach(c => r.push({ id: c.id, type: 'Contact', name: `${c.first_name} ${c.last_name}`, summary: c.email || '', icon: UserCircle }));
    deals.data?.forEach(d => r.push({ id: d.id, type: 'Deal', name: d.name, summary: `${d.stage} · ${d.instrument}`, icon: Briefcase }));
    tasks.data?.forEach(t => r.push({ id: t.id, type: 'Task', name: t.subject, summary: t.status?.replace(/_/g, ' ') || '', icon: ListTodo }));
    
    compliance.data?.forEach(c => r.push({ id: c.id, type: 'Compliance', name: c.title, summary: `${c.item_type} · ${c.status}`, icon: Shield }));
    decisions.data?.forEach(d => r.push({ id: d.id, type: 'Decision', name: d.title, summary: d.decision_type, icon: BookOpen }));

    setResults(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    addRecentlyViewed(result);
    const routes: Record<string, string> = {
      Project: '/projects',
      Account: '/accounts',
      Contact: '/contacts',
      Deal: '/pipeline',
      Task: '/tasks',
      
      Compliance: '/compliance',
      Decision: '/decisions',
    };
    navigate(routes[result.type] || '/dashboard');
  };

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] = acc[r.type] || []).push(r);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search projects, accounts, contacts, deals..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{loading ? 'Searching...' : 'No results found.'}</CommandEmpty>
        {Object.entries(grouped).map(([type, items], idx) => (
          <div key={type}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={type + 's'}>
              {items.map(item => {
                const Icon = item.icon;
                return (
                  <CommandItem key={`${item.type}-${item.id}`} onSelect={() => handleSelect(item)} className="gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.summary}</p>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

// Recently viewed helper — stores in localStorage
const RECENT_KEY = 'caps-recently-viewed';
const MAX_RECENT = 8;

export interface RecentItem {
  id: string;
  type: string;
  name: string;
  summary: string;
  viewedAt: string;
}

export function addRecentlyViewed(item: { id: string; type: string; name: string; summary: string }) {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as RecentItem[];
    const filtered = stored.filter(r => !(r.id === item.id && r.type === item.type));
    filtered.unshift({ ...item, viewedAt: new Date().toISOString() });
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
  } catch {}
}

export function getRecentlyViewed(): RecentItem[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}
