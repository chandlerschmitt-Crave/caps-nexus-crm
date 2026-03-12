import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Briefcase, Users, FolderKanban, ListTodo, LogOut, Home, UserCircle, TrendingUp, MapPin, Mail, Shield, BookOpen, Search, Sparkles } from 'lucide-react';
import capsCapitalLogo from '@/assets/caps-capital-logo.jpg';
import { GlobalSearch, openGlobalSearch } from '@/components/GlobalSearch';
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
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center shrink-0">
              <img src={capsCapitalLogo} alt="Caps Capital Enterprises" className="h-10" />
            </Link>
            {/* Search bar — always visible */}
            <button
              onClick={openGlobalSearch}
              className="hidden sm:flex items-center gap-2 rounded-md border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-sm text-primary-foreground/70 hover:bg-primary-foreground/20 transition-colors min-w-[220px]"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Search everything...</span>
              <kbd className="hidden lg:inline-flex text-[10px] bg-primary-foreground/10 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
            </button>
          </div>
          <div className="flex items-center gap-1">
            {/* Mobile search icon */}
            <Button
              variant="ghost"
              size="sm"
              className="sm:hidden text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
              onClick={openGlobalSearch}
            >
              <Search className="h-4 w-4" />
            </Button>
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={signOut} className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
        {/* Navigation row */}
        <div className="container mx-auto px-4 overflow-x-auto">
          <nav className="flex gap-1 pb-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-primary-foreground/80 hover:bg-primary-foreground/10'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-6 py-6 space-y-4">{children}</div>
      </main>
      <GlobalSearch />
    </div>
  );
}
