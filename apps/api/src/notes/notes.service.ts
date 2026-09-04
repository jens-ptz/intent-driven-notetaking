import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PublicationState } from '@prisma/client';
import { ERROR_CODES, type NoteView, type Page } from '@notes/shared';
import { InvalidTagError } from '../tags/tag-normalization';
import { TagsService } from '../tags/tags.service';
import type { CreateNoteDto, UpdateNoteDto } from './dto';
import { toNoteView } from './note.view';
import { NotesRepository, type NoteWithRelations } from './notes.repository';

@Injectable()
export class NotesService {
  constructor(
    private readonly notes: NotesRepository,
    private readonly tags: TagsService,
  ) {}

  /**
   * Reading a note that is not yours is refused as if it were not there.
   *
   * Not-found rather than forbidden, so note identifiers cannot be probed to
   * learn what other people have written.
   */
  async requireOwned(id: number, ownerId: number): Promise<NoteWithRelations> {
    const note = await this.notes.findLiveOwnedBy(id, ownerId);
    if (!note) {
      throw new NotFoundException('That note does not exist');
    }
    return note;
  }

  async requireAny(id: number): Promise<NoteWithRelations> {
    const note = await this.notes.findLiveById(id);
    if (!note) {
      throw new NotFoundException('That note does not exist');
    }
    return note;
  }

  private async resolveTags(inputs: readonly string[] | undefined): Promise<number[] | undefined> {
    if (inputs === undefined) {
      return undefined;
    }
    try {
      return (await this.tags.resolve(inputs)).map((tag) => tag.id);
    } catch (error) {
      if (error instanceof InvalidTagError) {
        throw new BadRequestException({
          statusCode: 400,
          code: ERROR_CODES.INVALID_TAG,
          message: error.message,
        });
      }
      throw error;
    }
  }

  async create(ownerId: number, dto: CreateNoteDto): Promise<NoteView> {
    const tagIds = (await this.resolveTags(dto.tags)) ?? [];
    return toNoteView(
      await this.notes.create({ title: dto.title, text: dto.text, ownerId, tagIds }),
    );
  }

  /**
   * Editing the content of a published note returns it to moderation.
   *
   * Without this an owner could publish acceptable content and then replace the
   * body, so the approval would not apply to what is actually public (ADR-0005).
   * Only content changes trigger it.
   */
  async update(id: number, ownerId: number, dto: UpdateNoteDto): Promise<NoteView> {
    const existing = await this.requireOwned(id, ownerId);
    const tagIds = await this.resolveTags(dto.tags);

    const contentChanged =
      (dto.title !== undefined && dto.title !== existing.title) ||
      (dto.text !== undefined && dto.text !== existing.text) ||
      tagIds !== undefined;

    const returnsToModeration =
      contentChanged && existing.publicationState === PublicationState.PUBLISHED;

    return toNoteView(
      await this.notes.update(
        id,
        {
          ...(dto.title === undefined ? {} : { title: dto.title }),
          ...(dto.text === undefined ? {} : { text: dto.text }),
          ...(returnsToModeration
            ? { publicationState: PublicationState.PENDING, publishedAt: null }
            : {}),
        },
        tagIds,
      ),
    );
  }

  async deleteOwn(id: number, ownerId: number): Promise<void> {
    await this.requireOwned(id, ownerId);
    await this.notes.softDelete(id);
  }

  async listOwn(
    ownerId: number,
    options: { page: number; limit: number; tag?: string },
  ): Promise<Page<NoteView>> {
    const [items, total] = await this.notes.listOwnedBy(ownerId, {
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      tag: options.tag,
    });
    return { items: items.map(toNoteView), page: options.page, limit: options.limit, total };
  }
}
