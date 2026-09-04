import type {
  AdminUserSummary,
  LoginRequest,
  NoteView,
  Page,
  PublicNoteView,
  RegisterRequest,
  UserProfile,
} from '@notes/shared';

const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    method,
    // The session lives in an httpOnly cookie, so it travels here and nowhere
    // else - no token is ever handed to page scripts (ADR-0002).
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const payload = text === '' ? undefined : JSON.parse(text);

  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : (payload?.message ?? response.statusText);
    throw new ApiError(response.status, payload?.code, message);
  }

  return payload as T;
}

export const api = {
  login: (body: LoginRequest) => request<{ status: string }>('POST', '/auth/login', body),
  logout: () => request<{ status: string }>('POST', '/auth/logout'),
  register: (body: RegisterRequest) => request<UserProfile>('POST', '/users/register', body),
  me: () => request<UserProfile>('GET', '/users/me'),

  publicFeed: (tag?: string) =>
    request<Page<PublicNoteView>>('GET', `/public/notes${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`),
  publicNote: (id: number) => request<PublicNoteView>('GET', `/public/notes/${id}`),

  myNotes: () => request<Page<NoteView>>('GET', '/notes'),
  note: (id: number) => request<NoteView>('GET', `/notes/${id}`),
  createNote: (body: { title: string; text: string; tags?: string[] }) =>
    request<NoteView>('POST', '/notes', body),
  updateNote: (id: number, body: { title?: string; text?: string; tags?: string[] }) =>
    request<NoteView>('PATCH', `/notes/${id}`, body),
  deleteNote: (id: number) => request<void>('DELETE', `/notes/${id}`),
  requestPublication: (id: number) =>
    request<NoteView>('POST', `/notes/${id}/publication-request`),
  withdraw: (id: number) => request<NoteView>('DELETE', `/notes/${id}/publication`),

  moderationQueue: () => request<Page<NoteView>>('GET', '/admin/moderation'),
  approve: (id: number) => request<NoteView>('POST', `/admin/notes/${id}/approve`),
  reject: (id: number, reason: string) =>
    request<NoteView>('POST', `/admin/notes/${id}/reject`, { reason }),
  adminNotes: () => request<Page<NoteView>>('GET', '/admin/notes'),
  adminDeleteNote: (id: number) => request<void>('DELETE', `/admin/notes/${id}`),
  adminUsers: () => request<Page<AdminUserSummary>>('GET', '/admin/users'),
  ban: (id: number) => request<void>('POST', `/admin/users/${id}/ban`),
  unban: (id: number) => request<void>('DELETE', `/admin/users/${id}/ban`),
  adminDeleteUser: (id: number) => request<void>('DELETE', `/admin/users/${id}`),
};
