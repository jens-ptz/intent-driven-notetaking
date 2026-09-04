import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ERROR_CODES, type AdminUserSummary, type NoteView, type Page } from '@notes/shared';
import { toNoteView } from '../notes/note.view';
import { NotesRepository } from '../notes/notes.repository';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly notes: NotesRepository,
    private readonly users: UsersRepository,
  ) {}

  async listNotes(options: {
    page: number;
    limit: number;
    tag?: string;
  }): Promise<Page<NoteView>> {
    const [items, total] = await this.notes.listAll({
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      tag: options.tag,
    });
    return { items: items.map(toNoteView), page: options.page, limit: options.limit, total };
  }

  async listUsers(options: { page: number; limit: number }): Promise<Page<AdminUserSummary>> {
    const [items, total] = await this.users.listLive(
      (options.page - 1) * options.limit,
      options.limit,
    );
    return {
      items: items.map((user) => ({
        ...UsersService.toProfile(user),
        banned: user.bannedAt !== null,
        createdAt: user.createdAt.toISOString(),
      })),
      page: options.page,
      limit: options.limit,
      total,
    };
  }

  /**
   * A ban is reversible and destroys nothing: it blocks the account and, via
   * the feed's owner filter, hides its published notes for as long as it lasts.
   */
  async ban(targetId: number, actorId: number): Promise<void> {
    if (targetId === actorId) {
      // Otherwise a single action could leave the platform with no reachable
      // administrator.
      throw new BadRequestException('An administrator cannot ban their own account');
    }
    await this.requireLiveUser(targetId);
    await this.users.update(targetId, { bannedAt: new Date() });
  }

  async unban(targetId: number): Promise<void> {
    await this.requireLiveUser(targetId);
    await this.users.update(targetId, { bannedAt: null });
  }

  async deleteUser(targetId: number, actorId: number): Promise<void> {
    if (targetId === actorId) {
      throw new BadRequestException(
        'An administrator cannot delete their own account here; use account deletion',
      );
    }
    await this.requireLiveUser(targetId);
    await this.users.softDeleteWithNotes(targetId);
  }

  async updateNote(id: number, data: { title?: string; text?: string }): Promise<NoteView> {
    await this.requireLiveNote(id);
    return toNoteView(await this.notes.update(id, data));
  }

  async deleteNote(id: number): Promise<void> {
    await this.requireLiveNote(id);
    await this.notes.softDelete(id);
  }

  async readNote(id: number): Promise<NoteView> {
    return toNoteView(await this.requireLiveNote(id));
  }

  private async requireLiveUser(id: number) {
    const user = await this.users.findLiveById(id);
    if (!user) {
      throw new NotFoundException('That account does not exist');
    }
    return user;
  }

  private async requireLiveNote(id: number) {
    const note = await this.notes.findLiveById(id);
    if (!note) {
      throw new NotFoundException('That note does not exist');
    }
    return note;
  }
}

export { ERROR_CODES };
