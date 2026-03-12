import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Briefcase, Users, FolderKanban, ListTodo, LogOut, Home, UserCircle, TrendingUp, MapPin, Mail, Shield, BookOpen, Search, Sparkles } from 'lucide-react';
import capsCapitalLogo from '@/assets/caps-capital-logo.jpg';
import { GlobalSearch } from '@/components/GlobalSearch';
import { NotificationBell } from '@/components/NotificationBell';

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
    { name: 'Compliance', href: '/compliance', icon: Shield },
    { name: 'Decisions', href: '/decisions', icon: BookOpen },
    { name: 'Recap', href: '/recap-settings', icon: Mail },
    { name: 'Doc Parser', href: '/document-parser', icon: Sparkles },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-primary border-primary">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center">
              <img src={capsCapitalLogo} alt="Caps Capital Enterprises" className="h-10" />
            </Link>
            <nav className="hidden md:flex gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-primary-foreground hover:bg-primary/80'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground gap-2"
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline text-xs opacity-70">⌘K</span>
            </Button>
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={signOut} className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
          <GlobalSearch />
        </div>
      </header>
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-6 py-6 space-y-4">{children}</div>
      </main>
    </div>
  );
}
