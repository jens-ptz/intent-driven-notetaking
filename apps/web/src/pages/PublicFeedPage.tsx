import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export function PublicFeedPage(): JSX.Element {
  const { data, isLoading } = useQuery({ queryKey: ['public-feed'], queryFn: () => api.publicFeed() });

  return (
    <section data-testid="public-feed">
      <h1>Public notes</h1>
      {isLoading ? <p>Loading…</p> : null}
      {data && data.items.length === 0 ? <p data-testid="feed-empty">Nothing published yet.</p> : null}
      <ul>
        {data?.items.map((note) => (
          <li key={note.id} data-testid="feed-item">
            <Link to={`/public/notes/${note.id}`} data-testid="feed-item-title">
              {note.title}
            </Link>{' '}
            <small>by {note.ownerUserName}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
