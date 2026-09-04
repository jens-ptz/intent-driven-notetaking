import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api/client';

export function ModerationPage(): JSX.Element {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('Needs more detail');
  const { data, isLoading } = useQuery({
    queryKey: ['moderation'],
    queryFn: () => api.moderationQueue(),
  });

  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['moderation'] });
    await queryClient.invalidateQueries({ queryKey: ['public-feed'] });
  };

  const approve = useMutation({ mutationFn: api.approve, onSuccess: invalidate });
  const reject = useMutation({
    mutationFn: (id: number) => api.reject(id, reason),
    onSuccess: invalidate,
  });

  return (
    <section data-testid="moderation-queue">
      <h1>Moderation queue</h1>
      {isLoading ? <p>Loading…</p> : null}
      {data && data.items.length === 0 ? <p data-testid="queue-empty">Nothing awaiting a decision.</p> : null}
      <label>
        Rejection reason
        <input
          data-testid="reject-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <ul>
        {data?.items.map((note) => (
          <li key={note.id} data-testid="queue-item" data-title={note.title}>
            <span data-testid="queue-item-title">{note.title}</span>{' '}
            <small>by {note.ownerUserName}</small>{' '}
            <button type="button" data-testid="queue-approve" onClick={() => approve.mutate(note.id)}>
              Approve
            </button>{' '}
            <button type="button" data-testid="queue-reject" onClick={() => reject.mutate(note.id)}>
              Reject
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
