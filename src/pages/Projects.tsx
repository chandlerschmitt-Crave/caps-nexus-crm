import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { FolderKanban, MapPin, DollarSign, Plus, LayoutGrid, List } from 'lucide-react';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { ProjectDetail } from '@/components/ProjectDetail';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useViewMode } from '@/hooks/use-view-mode';

interface Project {
  id: string;
  name: string;
  project_type: string;
  market: string | null;
  stage: string;
  est_total_cost: number | null;
  vertical: string | null;
  account?: { name: string };
}

const VERTICALS = [
  { value: 'all', label: 'All' },
  { value: 'TerraQore', label: 'TerraQore' },
  { value: 'VoltQore', label: 'VoltQore' },
  { value: 'Malibu_Luxury_Estates', label: 'Malibu Luxury Estates' },
  { value: 'Digital_Assets', label: 'Digital Assets' },
];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeVertical, setActiveVertical] = useState('all');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*, account:accounts(name)')
      .order('created_at', { ascending: false });

    setProjects(data || []);
  };

  const filteredProjects = activeVertical === 'all'
    ? projects
    : projects.filter(p => p.vertical === activeVertical);

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      Ideation: 'bg-gray-100 text-gray-800',
      'Pre-Dev': 'bg-blue-100 text-blue-800',
      Raising: 'bg-yellow-100 text-yellow-800',
      Entitlements: 'bg-orange-100 text-orange-800',
      Construction: 'bg-purple-100 text-purple-800',
      Stabilization: 'bg-green-100 text-green-800',
      Exit: 'bg-red-100 text-red-800',
      Site_Identified: 'bg-gray-100 text-gray-800',
      Underwriting: 'bg-blue-100 text-blue-800',
      LOI_Ground_Lease: 'bg-yellow-100 text-yellow-800',
      Permits: 'bg-orange-100 text-orange-800',
      Incentive_Applications: 'bg-cyan-100 text-cyan-800',
      Shovel_Ready: 'bg-lime-100 text-lime-800',
      Energized: 'bg-emerald-100 text-emerald-800',
      Stabilized_Operations: 'bg-green-100 text-green-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Development initiatives and funds
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>

        <Tabs value={activeVertical} onValueChange={setActiveVertical}>
          <TabsList>
            {VERTICALS.map(v => (
              <TabsTrigger key={v.value} value={v.value}>{v.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <ProjectForm 
          open={formOpen} 
          onOpenChange={setFormOpen} 
          onSuccess={loadProjects}
        />

        <ProjectDetail
          projectId={selectedProjectId}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onRefresh={loadProjects}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedProjectId(project.id);
                setDetailOpen(true);
              }}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <FolderKanban className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {project.name}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {project.project_type.replace('_', ' ')}
                      </Badge>
                      <Badge className={`text-xs ${getStageColor(project.stage)}`}>
                        {project.stage}
                      </Badge>
                      {project.vertical && (
                        <Badge variant="outline" className="text-xs">
                          {project.vertical.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.account && (
                  <p className="text-sm text-muted-foreground">
                    {project.account.name}
                  </p>
                )}
                {project.market && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{project.market}</span>
                  </div>
                )}
                {project.est_total_cost && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      ${(Number(project.est_total_cost) / 1000000).toFixed(1)}M
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
