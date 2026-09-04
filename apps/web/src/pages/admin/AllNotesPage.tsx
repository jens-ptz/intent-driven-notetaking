import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';

export function AdminNotesPage(): JSX.Element {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-notes'], queryFn: () => api.adminNotes() });

  const remove = useMutation({
    mutationFn: api.adminDeleteNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      await queryClient.invalidateQueries({ queryKey: ['public-feed'] });
    },
  });

  return (
    <section data-testid="admin-notes">
      <h1>All notes</h1>
      {isLoading ? <p>Loading…</p> : null}
      <ul>
        {data?.items.map((note) => (
          <li key={note.id} data-testid="admin-note-row" data-title={note.title}>
            <span>{note.title}</span> <small>by {note.ownerUserName}</small>{' '}
            <span>{note.publicationState.toLowerCase()}</span>{' '}
            <button type="button" data-testid="admin-note-delete" onClick={() => remove.mutate(note.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
