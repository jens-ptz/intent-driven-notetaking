import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PublicationState } from '@prisma/client';
import { ERROR_CODES, type NoteView, type Page, type PublicNoteView } from '@notes/shared';
import { toNoteView, toPublicNoteView } from '../notes/note.view';
import { NotesRepository } from '../notes/notes.repository';

/**
 * The publication lifecycle (ADR-0005).
 *
 *   PRIVATE   --owner requests-->   PENDING
 *   PENDING   --admin approves-->   PUBLISHED
 *   PENDING   --admin rejects -->   PRIVATE (+ reason)
 *   PUBLISHED --owner or admin withdraws--> PRIVATE
 *   PUBLISHED --content edited--> PENDING          (in NotesService)
 */
@Injectable()
export class PublicationService {
  constructor(private readonly notes: NotesRepository) {}

  /** An owner asks for one of their own notes to be published. */
  async request(noteId: number, ownerId: number): Promise<NoteView> {
    const note = await this.notes.findLiveOwnedBy(noteId, ownerId);
    if (!note) {
      throw new NotFoundException('That note does not exist');
    }

    if (note.publicationState !== PublicationState.PRIVATE) {
      // Refused rather than silently accepted, so a double submit is visible
      // instead of quietly resetting a decision already in flight.
      throw new BadRequestException({
        statusCode: 400,
        code: ERROR_CODES.ALREADY_REQUESTED,
        message:
          note.publicationState === PublicationState.PENDING
            ? 'That note is already awaiting a decision'
            : 'That note is already published',
      });
    }

    return toNoteView(
      await this.notes.update(noteId, {
        publicationState: PublicationState.PENDING,
        rejectionReason: null,
      }),
    );
  }

  async approve(noteId: number): Promise<NoteView> {
    const note = await this.requirePending(noteId);
    return toNoteView(
      await this.notes.update(note.id, {
        publicationState: PublicationState.PUBLISHED,
        publishedAt: new Date(),
        rejectionReason: null,
      }),
    );
  }

  async reject(noteId: number, reason: string): Promise<NoteView> {
    const note = await this.requirePending(noteId);
    return toNoteView(
      await this.notes.update(note.id, {
        publicationState: PublicationState.PRIVATE,
        publishedAt: null,
        rejectionReason: reason,
      }),
    );
  }

  /**
   * Withdrawal returns a published note to private without deleting it. The
   * owner may withdraw their own; an administrator may withdraw any.
   */
  async withdraw(noteId: number, actor: { id: number; isAdmin: boolean }): Promise<NoteView> {
    const note = await this.notes.findLiveById(noteId);
    if (!note) {
      throw new NotFoundException('That note does not exist');
    }
    if (!actor.isAdmin && note.ownerId !== actor.id) {
      throw new NotFoundException('That note does not exist');
    }
    if (note.publicationState !== PublicationState.PUBLISHED) {
      throw new BadRequestException('That note is not published');
    }

    return toNoteView(
      await this.notes.update(noteId, {
        publicationState: PublicationState.PRIVATE,
        publishedAt: null,
      }),
    );
  }

  async feed(options: { page: number; limit: number; tag?: string }): Promise<Page<PublicNoteView>> {
    const [items, total] = await this.notes.listPublic({
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      tag: options.tag,
    });
    return { items: items.map(toPublicNoteView), page: options.page, limit: options.limit, total };
  }

  async readPublic(id: number): Promise<PublicNoteView> {
    const note = await this.notes.findPublicById(id);
    if (!note) {
      // A private, pending, deleted, banned-owner or deleted-owner note is
      // indistinguishable from one that never existed.
      throw new NotFoundException('That note does not exist');
    }
    return toPublicNoteView(note);
  }

  async queue(options: { page: number; limit: number }): Promise<Page<NoteView>> {
    const [items, total] = await this.notes.listPending({
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    });
    return { items: items.map(toNoteView), page: options.page, limit: options.limit, total };
  }

  private async requirePending(noteId: number) {
    const note = await this.notes.findLiveById(noteId);
    if (!note) {
      throw new NotFoundException('That note does not exist');
    }
    if (note.publicationState !== PublicationState.PENDING) {
      throw new ForbiddenException('That note is not awaiting a decision');
    }
    return note;
  }
}
