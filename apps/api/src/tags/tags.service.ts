import { Injectable } from '@nestjs/common';
import { Tag } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeTags } from './tag-normalization';

/**
 * Tags are shared reference data: never soft-deleted, and a tag left on zero
 * notes is retained so a later note can reuse the same row (ADR-0004 keeps
 * cleanup out of the picture entirely).
 */
@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolves free text to tag rows, creating the ones that do not exist yet. */
  async resolve(inputs: readonly string[]): Promise<Tag[]> {
    const names = normalizeTags(inputs);
    const resolved: Tag[] = [];

    for (const name of names) {
      resolved.push(
        await this.prisma.tag.upsert({
          where: { name },
          create: { name },
          update: {},
        }),
      );
    }

    return resolved;
  }

  findByName(name: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({ where: { name } });
  }
}
