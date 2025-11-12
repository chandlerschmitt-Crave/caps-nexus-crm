import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Building2, Globe, Phone, MapPin, FileText, FolderKanban, Home, Plus, Link as LinkIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AccountDetailProps {
  accountId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

interface Account {
  id: string;
  name: string;
  type_of_account: string | null;
  website: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  notes: string | null;
}

interface Project {
  id: string;
  name: string;
  project_type: string;
  stage: string;
}

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  status: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  title: string | null;
}

export function AccountDetail({ accountId, open, onOpenChange, onRefresh }: AccountDetailProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkType, setLinkType] = useState<'project' | 'property' | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (accountId && open) {
      loadAccountDetails();
    }
  }, [accountId, open]);

  const loadAccountDetails = async () => {
    if (!accountId) return;

    setLoading(true);
    try {
      // Load account details
      const { data: accountData } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .maybeSingle();

      setAccount(accountData);

      // Load related projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, project_type, stage')
        .eq('account_id', accountId);

      setProjects(projectsData || []);

      // Load all projects for linking
      const { data: allProjectsData } = await supabase
        .from('projects')
        .select('id, name, project_type, stage')
        .order('name');

      setAllProjects(allProjectsData || []);

      // Load related properties through projects
      const projectIds = projectsData?.map(p => p.id) || [];
      if (projectIds.length > 0) {
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('id, address, city, state, status')
          .in('project_id', projectIds);

        setProperties(propertiesData || []);
      }

      // Load all properties for linking
      const { data: allPropertiesData } = await supabase
        .from('properties')
        .select('id, address, city, state, status')
        .order('address');

      setAllProperties(allPropertiesData || []);

      // Load contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, title')
        .eq('account_id', accountId)
        .order('last_name');

      setContacts(contactsData || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProject = async () => {
    if (!selectedId || !accountId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ account_id: accountId })
        .eq('id', selectedId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project linked successfully',
      });

      setLinkDialogOpen(false);
      setSelectedId('');
      loadAccountDetails();
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProperty = async () => {
    // Properties are linked through projects, so we need to create/update the relationship
    toast({
      title: 'Info',
      description: 'Properties are linked through projects. Please link a project first.',
    });
    setLinkDialogOpen(false);
  };

  const openLinkDialog = (type: 'project' | 'property') => {
    setLinkType(type);
    setSelectedId('');
    setLinkDialogOpen(true);
  };

  if (!account) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {account.name}
          </SheetTitle>
          <SheetDescription>
            Account details and relationships
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {account.type_of_account && (
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">{account.type_of_account}</Badge>
                  </div>
                </div>
              )}

              {account.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {account.website}
                  </a>
                </div>
              )}

              {account.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{account.phone}</span>
                </div>
              )}

              {(account.city || account.state || account.country) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {[account.city, account.state, account.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {account.notes && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </Label>
                  <p className="text-sm mt-1">{account.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Contacts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Contacts ({contacts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No contacts linked to this account
                </p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-2 rounded-md border">
                      <div>
                        <p className="text-sm font-medium">
                          {contact.first_name} {contact.last_name}
                        </p>
                        {contact.title && (
                          <p className="text-xs text-muted-foreground">{contact.title}</p>
                        )}
                      </div>
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {contact.email}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Projects ({projects.length})
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => openLinkDialog('project')}>
                <LinkIcon className="h-3 w-3 mr-1" />
                Link Project
              </Button>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No projects linked to this account
                </p>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div key={project.id} className="p-3 rounded-md border">
                      <p className="text-sm font-medium">{project.name}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {project.project_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {project.stage}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Properties */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Home className="h-4 w-4" />
                Properties ({properties.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No properties linked through projects
                </p>
              ) : (
                <div className="space-y-2">
                  {properties.map((property) => (
                    <div key={property.id} className="p-3 rounded-md border">
                      <p className="text-sm font-medium">{property.address}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                          {property.city}, {property.state}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {property.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Link Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link {linkType === 'project' ? 'Project' : 'Property'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select {linkType === 'project' ? 'Project' : 'Property'}</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select a ${linkType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {linkType === 'project' &&
                      allProjects
                        .filter(p => !projects.some(ep => ep.id === p.id))
                        .map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                    {linkType === 'property' &&
                      allProperties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setLinkDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={linkType === 'project' ? handleLinkProject : handleLinkProperty}
                  disabled={!selectedId || loading}
                >
                  {loading ? 'Linking...' : 'Link'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
