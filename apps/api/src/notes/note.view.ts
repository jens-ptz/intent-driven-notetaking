import type { NoteView, PublicNoteView } from '@notes/shared';
import type { NoteWithRelations } from './notes.repository';

export function toNoteView(note: NoteWithRelations): NoteView {
  return {
    id: note.id,
    title: note.title,
    text: note.text,
    tags: note.tags.map(({ tag }) => ({ id: tag.id, name: tag.name })),
    publicationState: note.publicationState,
    rejectionReason: note.rejectionReason,
    ownerId: note.ownerId,
    ownerUserName: note.owner.userName,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

/** What an anonymous visitor sees: no owner id, no moderation detail. */
export function toPublicNoteView(note: NoteWithRelations): PublicNoteView {
  return {
    id: note.id,
    title: note.title,
    text: note.text,
    tags: note.tags.map(({ tag }) => ({ id: tag.id, name: tag.name })),
    ownerUserName: note.owner.userName,
    publishedAt: (note.publishedAt ?? note.updatedAt).toISOString(),
  };
}
