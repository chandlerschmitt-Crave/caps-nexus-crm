import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Building2, LayoutDashboard, Briefcase, Users, FolderKanban, ListTodo, LogOut, Home, UserCircle, TrendingUp, MapPin } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Pipeline', href: '/pipeline', icon: Briefcase },
    { name: 'Accounts', href: '/accounts', icon: Users },
    { name: 'Investors', href: '/investors', icon: TrendingUp },
    { name: 'Contacts', href: '/contacts', icon: UserCircle },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Properties', href: '/properties', icon: Home },
    { name: 'Tasks', href: '/tasks', icon: ListTodo },
    { name: 'Prospecting', href: '/land-intelligence', icon: MapPin },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="text-lg">Caps Capital</span>
            </Link>
            <nav className="hidden md:flex gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
