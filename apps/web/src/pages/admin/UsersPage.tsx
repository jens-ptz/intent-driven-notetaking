import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';

export function AdminUsersPage(): JSX.Element {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => api.adminUsers() });

  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    await queryClient.invalidateQueries({ queryKey: ['public-feed'] });
  };

  const ban = useMutation({ mutationFn: api.ban, onSuccess: invalidate });
  const unban = useMutation({ mutationFn: api.unban, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: api.adminDeleteUser, onSuccess: invalidate });

  return (
    <section data-testid="admin-users">
      <h1>Accounts</h1>
      {isLoading ? <p>Loading…</p> : null}
      <ul>
        {data?.items.map((user) => (
          <li key={user.id} data-testid="user-row" data-user-name={user.userName}>
            <span data-testid="user-row-name">{user.userName}</span>{' '}
            <span data-testid="user-row-state">{user.banned ? 'banned' : 'active'}</span>{' '}
            {user.banned ? (
              <button type="button" data-testid="user-unban" onClick={() => unban.mutate(user.id)}>
                Unban
              </button>
            ) : (
              <button type="button" data-testid="user-ban" onClick={() => ban.mutate(user.id)}>
                Ban
              </button>
            )}{' '}
            <button type="button" data-testid="user-delete" onClick={() => remove.mutate(user.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
