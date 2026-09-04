import { Injectable } from '@nestjs/common';
import { Note, Prisma, PublicationState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type NoteWithRelations = Prisma.NoteGetPayload<{
  include: { tags: { include: { tag: true } }; owner: true };
}>;

const withRelations = {
  tags: { include: { tag: true } },
  owner: true,
} satisfies Prisma.NoteInclude;

/**
 * Every query states `deletedAt: null` itself (ADR-0004). A new read path that
 * forgets it leaks deleted content, which is why platform-foundation asserts
 * absence on each of them.
 */
@Injectable()
export class NotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLiveById(id: number): Promise<NoteWithRelations | null> {
    return this.prisma.note.findFirst({
      where: { id, deletedAt: null },
      include: withRelations,
    });
  }

  findLiveOwnedBy(id: number, ownerId: number): Promise<NoteWithRelations | null> {
    return this.prisma.note.findFirst({
      where: { id, ownerId, deletedAt: null },
      include: withRelations,
    });
  }

  listOwnedBy(
    ownerId: number,
    options: { skip: number; take: number; tag?: string },
  ): Promise<[NoteWithRelations[], number]> {
    const where: Prisma.NoteWhereInput = {
      ownerId,
      deletedAt: null,
      ...(options.tag ? { tags: { some: { tag: { name: options.tag } } } } : {}),
    };
    return this.prisma.$transaction([
      this.prisma.note.findMany({
        where,
        include: withRelations,
        orderBy: { id: 'asc' },
        skip: options.skip,
        take: options.take,
      }),
      this.prisma.note.count({ where }),
    ]);
  }

  listAll(options: {
    skip: number;
    take: number;
    tag?: string;
    state?: PublicationState;
  }): Promise<[NoteWithRelations[], number]> {
    const where: Prisma.NoteWhereInput = {
      deletedAt: null,
      ...(options.state ? { publicationState: options.state } : {}),
      ...(options.tag ? { tags: { some: { tag: { name: options.tag } } } } : {}),
    };
    return this.prisma.$transaction([
      this.prisma.note.findMany({
        where,
        include: withRelations,
        orderBy: { id: 'asc' },
        skip: options.skip,
        take: options.take,
      }),
      this.prisma.note.count({ where }),
    ]);
  }

  /**
   * The public feed. A note is here only while it is published, not deleted,
   * and its owner is neither banned nor deleted - so a ban hides notes by
   * omission, with nothing to undo on unban (ADR-0008 rationale in design D8).
   */
  listPublic(options: {
    skip: number;
    take: number;
    tag?: string;
  }): Promise<[NoteWithRelations[], number]> {
    const where: Prisma.NoteWhereInput = {
      deletedAt: null,
      publicationState: PublicationState.PUBLISHED,
      owner: { bannedAt: null, deletedAt: null },
      ...(options.tag ? { tags: { some: { tag: { name: options.tag } } } } : {}),
    };
    return this.prisma.$transaction([
      this.prisma.note.findMany({
        where,
        include: withRelations,
        orderBy: { publishedAt: 'desc' },
        skip: options.skip,
        take: options.take,
      }),
      this.prisma.note.count({ where }),
    ]);
  }

  findPublicById(id: number): Promise<NoteWithRelations | null> {
    return this.prisma.note.findFirst({
      where: {
        id,
        deletedAt: null,
        publicationState: PublicationState.PUBLISHED,
        owner: { bannedAt: null, deletedAt: null },
      },
      include: withRelations,
    });
  }

  listPending(options: { skip: number; take: number }): Promise<[NoteWithRelations[], number]> {
    const where: Prisma.NoteWhereInput = {
      deletedAt: null,
      publicationState: PublicationState.PENDING,
    };
    return this.prisma.$transaction([
      this.prisma.note.findMany({
        where,
        include: withRelations,
        // Oldest request first, so the queue is a worklist rather than a pile.
        orderBy: { updatedAt: 'asc' },
        skip: options.skip,
        take: options.take,
      }),
      this.prisma.note.count({ where }),
    ]);
  }

  create(data: {
    title: string;
    text: string;
    ownerId: number;
    tagIds: number[];
  }): Promise<NoteWithRelations> {
    return this.prisma.note.create({
      data: {
        title: data.title,
        text: data.text,
        ownerId: data.ownerId,
        tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
      },
      include: withRelations,
    });
  }

  /** Replaces the whole tag set when tagIds is given; leaves it alone when not. */
  async update(
    id: number,
    data: Prisma.NoteUpdateInput,
    tagIds?: number[],
  ): Promise<NoteWithRelations> {
    if (tagIds !== undefined) {
      await this.prisma.noteTag.deleteMany({ where: { noteId: id } });
      await this.prisma.noteTag.createMany({
        data: tagIds.map((tagId) => ({ noteId: id, tagId })),
      });
    }
    return this.prisma.note.update({ where: { id }, data, include: withRelations });
  }

  async softDelete(id: number): Promise<void> {
    await this.prisma.note.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  countLive(): Promise<number> {
    return this.prisma.note.count({ where: { deletedAt: null } });
  }

  isPublished(note: Note): boolean {
    return note.publicationState === PublicationState.PUBLISHED;
  }
}
