import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Markdown } from '../components/Markdown';

const STATE_LABEL = {
  PRIVATE: 'private',
  PENDING: 'pending publication',
  PUBLISHED: 'published',
} as const;

export function NoteEditorPage(): JSX.Element {
  const { id } = useParams();
  const noteId = Number(id);
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ['note', noteId], queryFn: () => api.note(noteId) });

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (data) {
      setTitle(data.title);
      setText(data.text);
      setTags(data.tags.map((tag) => tag.name).join(', '));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      api.updateNote(noteId, {
        title,
        text,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag !== ''),
      }),
    onSuccess: async () => {
      setError(undefined);
      await queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      await queryClient.invalidateQueries({ queryKey: ['my-notes'] });
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'Could not save'),
  });

  const requestPublication = useMutation({
    mutationFn: () => api.requestPublication(noteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      await queryClient.invalidateQueries({ queryKey: ['my-notes'] });
    },
  });

  if (!data) {
    return <p>Loading…</p>;
  }

  return (
    <section data-testid="note-editor">
      <h1>Edit note</h1>
      <p>
        This note is <span data-testid="editor-state">{STATE_LABEL[data.publicationState]}</span>.
      </p>

      {/* The design's mitigation for ADR-0005: warn before an edit knocks a
          published note out of the feed. */}
      {data.publicationState === 'PUBLISHED' ? (
        <p role="status" data-testid="republish-warning">
          Saving a change to a published note takes it off the public feed until an administrator
          approves it again.
        </p>
      ) : null}

      {data.rejectionReason ? (
        <p role="status" data-testid="rejection-reason">
          An administrator rejected this note: {data.rejectionReason}
        </p>
      ) : null}

      <label>
        Title
        <input
          data-testid="editor-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      <label>
        Body (markdown)
        <textarea
          data-testid="editor-text"
          rows={10}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </label>

      <label>
        Tags (comma separated)
        <input
          data-testid="editor-tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
      </label>

      <button type="button" data-testid="editor-save" onClick={() => save.mutate()}>
        Save
      </button>
      {data.publicationState === 'PRIVATE' ? (
        <button
          type="button"
          data-testid="editor-request-publication"
          onClick={() => requestPublication.mutate()}
        >
          Request publication
        </button>
      ) : null}

      {error ? (
        <p role="alert" data-testid="editor-error">
          {error}
        </p>
      ) : null}

      <h2>Preview</h2>
      <div data-testid="editor-preview">
        <Markdown>{text}</Markdown>
      </div>

      <ul data-testid="editor-tag-list">
        {data.tags.map((tag) => (
          <li key={tag.id} data-testid="editor-tag">
            {tag.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
