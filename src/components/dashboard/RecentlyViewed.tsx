import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRecentlyViewed, type RecentItem } from '@/components/GlobalSearch';
import { FolderKanban, Building2, UserCircle, Briefcase, ListTodo, MapPin, Shield, BookOpen, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const iconMap: Record<string, React.ElementType> = {
  Project: FolderKanban,
  Account: Building2,
  Contact: UserCircle,
  Deal: Briefcase,
  Task: ListTodo,
  Parcel: MapPin,
  Compliance: Shield,
  Decision: BookOpen,
};

const routeMap: Record<string, string> = {
  Project: '/projects',
  Account: '/accounts',
  Contact: '/contacts',
  Deal: '/pipeline',
  Task: '/tasks',
  
  Compliance: '/compliance',
  Decision: '/decisions',
};

export function RecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" /> Recently Viewed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          {items.map((item) => {
            const Icon = iconMap[item.type] || FolderKanban;
            return (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => navigate(routeMap[item.type] || '/dashboard')}
                className="flex items-start gap-2 p-2.5 rounded-md border hover:bg-muted/50 transition-colors text-left"
              >
                <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] h-4 px-1">{item.type}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(item.viewedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
