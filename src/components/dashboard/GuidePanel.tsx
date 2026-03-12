import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  FolderKanban, 
  MapPin, 
  TrendingUp, 
  Users, 
  Home, 
  CheckSquare,
  ChevronRight 
} from 'lucide-react';

interface GuideCard {
  title: string;
  subtitle: string;
  description: string;
  action: string;
  route: string;
  icon: any;
  contextInfo?: string;
}

export function GuidePanel() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [contextData, setContextData] = useState({
    activeProjects: 0,
    tasksDue: 0,
    activeDeals: 0,
    investors: 0,
    properties: 0,
  });

  useEffect(() => {
    loadContextData();
    
    // Check screen size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadContextData = async () => {
    const [projectsRes, tasksRes, dealsRes, investorsRes, propertiesRes] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*').neq('status', 'Done').lte('due_date', new Date().toISOString().split('T')[0]),
      supabase.from('deals').select('*').neq('stage', 'Closed_Won').neq('stage', 'Closed_Lost'),
      supabase.from('accounts').select('*', { count: 'exact', head: true }).in('type_of_account', ['Investor', 'Fund', 'HoldCo']),
      supabase.from('properties').select('*', { count: 'exact', head: true }),
    ]);

    setContextData({
      activeProjects: projectsRes.count || 0,
      tasksDue: tasksRes.data?.length || 0,
      activeDeals: dealsRes.data?.length || 0,
      investors: investorsRes.count || 0,
      properties: propertiesRes.count || 0,
    });
  };

  const guideCards: GuideCard[] = [
    {
      title: 'Projects',
      subtitle: 'Your active developments & construction timelines.',
      description: 'Track Malibu estates, data center builds, construction progress, budgets, and key milestones — all in one place.',
      action: 'View Projects',
      route: '/projects',
      icon: FolderKanban,
      contextInfo: contextData.activeProjects > 0 ? `${contextData.activeProjects} active project${contextData.activeProjects !== 1 ? 's' : ''}` : undefined,
    },
    {
      title: 'Pipeline',
      subtitle: 'Deals in motion.',
      description: 'From early conversations to closing capital, track every negotiation, touchpoint, and investor milestone.',
      action: 'Go to Pipeline',
      route: '/pipeline',
      icon: TrendingUp,
      contextInfo: contextData.activeDeals > 0 ? `${contextData.activeDeals} active deal${contextData.activeDeals !== 1 ? 's' : ''}` : undefined,
    },
    {
      title: 'Investors',
      subtitle: 'Relationships that fuel projects.',
      description: 'Organize funds, family offices, and strategic partners. Track commitments, conversations, and deal allocations.',
      action: 'Manage Investors',
      route: '/investors',
      icon: Users,
      contextInfo: contextData.investors > 0 ? `${contextData.investors} investor${contextData.investors !== 1 ? 's' : ''}` : undefined,
    },
    {
      title: 'Properties',
      subtitle: 'Assets under management.',
      description: 'Keep tabs on each parcel or estate — zoning, utilities, power, entitlements, mineral rights, and more.',
      action: 'View Properties',
      route: '/properties',
      icon: Home,
      contextInfo: contextData.properties > 0 ? `${contextData.properties} propert${contextData.properties !== 1 ? 'ies' : 'y'}` : undefined,
    },
    {
      title: 'Tasks',
      subtitle: 'Keep momentum.',
      description: 'Automated reminders for due diligence, investor outreach, site verification, and construction reviews.',
      action: 'View Tasks',
      route: '/tasks',
      icon: CheckSquare,
      contextInfo: contextData.tasksDue > 0 ? `${contextData.tasksDue} task${contextData.tasksDue !== 1 ? 's' : ''} due` : undefined,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[hsl(var(--primary))]">Your CAPS Ecosystem</h2>
        <p className="text-sm text-muted-foreground">Navigate your operations with confidence.</p>
      </div>

      {isMobile ? (
        <Accordion type="single" collapsible className="w-full">
          {guideCards.map((card) => {
            const Icon = card.icon;
            return (
              <AccordionItem key={card.title} value={card.title} className="border-l-2 border-l-[#C8A25E] pl-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#0C1C2E] text-[#C8A25E]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[#0C1C2E]">{card.title}</p>
                      {card.contextInfo && (
                        <p className="text-xs text-[#C8A25E] font-medium">{card.contextInfo}</p>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <p className="text-sm font-medium text-[#0C1C2E]">{card.subtitle}</p>
                  <p className="text-sm text-[#6B7078] leading-relaxed">{card.description}</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(card.route)}
                  >
                    {card.action}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guideCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.title}
                className="group relative overflow-hidden border-t-2 border-t-[#C8A25E] bg-[#FAF8F4] transition-all duration-200 hover:border-t-[3px] hover:shadow-lg cursor-pointer"
                style={{ 
                  boxShadow: '0 2px 6px rgba(12, 28, 46, 0.06)',
                }}
                onClick={() => navigate(card.route)}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#0C1C2E] text-[#C8A25E]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0C1C2E] text-lg">{card.title}</h3>
                        {card.contextInfo && (
                          <p className="text-xs text-[#C8A25E] font-medium">{card.contextInfo}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[#0C1C2E]">{card.subtitle}</p>
                    <p className="text-sm text-[#6B7078] leading-relaxed">{card.description}</p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-[#C8A25E] group-hover:text-[#0C1C2E] group-hover:border-[#C8A25E] transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(card.route);
                    }}
                  >
                    {card.action}
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
