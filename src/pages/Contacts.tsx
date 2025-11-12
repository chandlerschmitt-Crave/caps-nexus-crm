import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ContactForm } from '@/components/forms/ContactForm';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Mail, Phone, Linkedin, Building2, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  role: string | null;
  linkedin_url: string | null;
  communication_style: string | null;
  account: { name: string; type_of_account: string | null } | null;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>();

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('*, account:accounts(name, type_of_account)')
      .order('last_name');

    setContacts(data || []);
  };

  const handleEdit = (contactId: string) => {
    setSelectedContactId(contactId);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedContactId(undefined);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">Manage your business contacts</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedContactId(undefined)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedContactId ? 'Edit Contact' : 'Add New Contact'}
                </DialogTitle>
              </DialogHeader>
              <ContactForm
                contactId={selectedContactId}
                onSuccess={() => {
                  handleCloseDialog();
                  loadContacts();
                }}
                onCancel={handleCloseDialog}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Firm</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Communication Style</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No contacts found. Add your first contact to get started.
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </div>
                        {contact.title && (
                          <div className="text-sm text-muted-foreground">{contact.title}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.account && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm">{contact.account.name}</div>
                            {contact.account.type_of_account && (
                              <div className="text-xs text-muted-foreground">
                                {contact.account.type_of_account}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.role && (
                        <Badge variant="secondary">{contact.role}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <a 
                              href={`mailto:${contact.email}`}
                              className="hover:underline text-primary"
                            >
                              {contact.email}
                            </a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <a 
                              href={`tel:${contact.phone}`}
                              className="hover:underline"
                            >
                              {contact.phone}
                            </a>
                          </div>
                        )}
                        {contact.linkedin_url && (
                          <div className="flex items-center gap-2 text-sm">
                            <Linkedin className="h-3 w-3 text-muted-foreground" />
                            <a 
                              href={contact.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline text-primary"
                            >
                              LinkedIn
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {contact.communication_style && (
                        <div className="text-sm text-muted-foreground truncate">
                          {contact.communication_style}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(contact.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
