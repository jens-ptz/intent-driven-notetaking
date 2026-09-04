import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Markdown } from '../components/Markdown';

export function PublicNotePage(): JSX.Element {
  const { id } = useParams();
  const noteId = Number(id);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-note', noteId],
    queryFn: () => api.publicNote(noteId),
  });

  if (isLoading) {
    return <p>Loading…</p>;
  }
  if (isError || !data) {
    return <p data-testid="note-missing">That note does not exist.</p>;
  }

  return (
    <article data-testid="public-note">
      <h1 data-testid="note-title">{data.title}</h1>
      <p>
        by <span data-testid="note-owner">{data.ownerUserName}</span>
      </p>
      <Markdown>{data.text}</Markdown>
      <ul data-testid="note-tags">
        {data.tags.map((tag) => (
          <li key={tag.id} data-testid="note-tag">
            {tag.name}
          </li>
        ))}
      </ul>
    </article>
  );
}
