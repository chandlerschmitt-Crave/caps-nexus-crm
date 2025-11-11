import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by_user_id: string;
  profile?: {
    name: string;
    email: string;
  };
}

interface NotesProps {
  relatedType: string;
  relatedId: string;
  title?: string;
}

export function Notes({ relatedType, relatedId, title = 'Notes' }: NotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();

    // Set up real-time subscription
    const channel = supabase
      .channel('notes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `related_id=eq.${relatedId}`,
        },
        () => {
          loadNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [relatedId]);

  const loadNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('related_type', relatedType)
      .eq('related_id', relatedId)
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch profiles separately
      const userIds = [...new Set(data.map((note) => note.created_by_user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      setNotes(
        data.map((note) => ({
          ...note,
          profile: profileMap.get(note.created_by_user_id),
        }))
      );
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('notes').insert([
        {
          content: newNote,
          related_type: relatedType,
          related_id: relatedId,
          created_by_user_id: user.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Note added',
        description: 'Your note has been saved successfully.',
      });

      setNewNote('');
      loadNotes();
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

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Note deleted',
        description: 'The note has been removed.',
      });

      loadNotes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <CardTitle>{title}</CardTitle>
          <span className="text-sm text-muted-foreground ml-auto">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note to collaborate with your team..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button onClick={handleAddNote} disabled={loading || !newNote.trim()}>
            {loading ? 'Adding...' : 'Add Note'}
          </Button>
        </div>

        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notes yet. Add the first note to start collaborating.
            </p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {note.profile?.name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </div>
                  {user?.id === note.created_by_user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
