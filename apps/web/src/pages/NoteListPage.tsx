import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import type { PublicationState } from '@notes/shared';
import { api } from '../api/client';

const STATE_LABEL: Record<PublicationState, string> = {
  PRIVATE: 'private',
  PENDING: 'pending publication',
  PUBLISHED: 'published',
};

export function NoteListPage(): JSX.Element {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['my-notes'], queryFn: () => api.myNotes() });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-notes'] }),
  });

  async function createDraft(): Promise<void> {
    const created = await api.createNote({ title: 'Untitled note', text: '' });
    await queryClient.invalidateQueries({ queryKey: ['my-notes'] });
    navigate(`/notes/${created.id}/edit`);
  }

  return (
    <section data-testid="note-list">
      <h1>My notes</h1>
      <button type="button" onClick={createDraft} data-testid="new-note">
        New note
      </button>
      {isLoading ? <p>Loading…</p> : null}
      <ul>
        {data?.items.map((note) => (
          <li key={note.id} data-testid="note-row" data-title={note.title}>
            <Link to={`/notes/${note.id}/edit`} data-testid="note-row-title">
              {note.title}
            </Link>{' '}
            <span data-testid="note-row-state">{STATE_LABEL[note.publicationState]}</span>{' '}
            <button
              type="button"
              data-testid="note-row-delete"
              onClick={() => remove.mutate(note.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
