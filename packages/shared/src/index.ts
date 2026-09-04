/** Roles an account can hold. A registration request can never grant ADMIN. */
export const ROLES = ['USER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

/** Where a note sits in the moderated publication lifecycle (ADR-0005). */
export const PUBLICATION_STATES = ['PRIVATE', 'PENDING', 'PUBLISHED'] as const;
export type PublicationState = (typeof PUBLICATION_STATES)[number];

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  roles: Role[];
}

/** What an administrator sees about an account. */
export interface AdminUserSummary extends UserProfile {
  banned: boolean;
  createdAt: string;
}

export interface TagView {
  id: number;
  name: string;
}

export interface NoteView {
  id: number;
  title: string;
  text: string;
  tags: TagView[];
  publicationState: PublicationState;
  rejectionReason: string | null;
  ownerId: number;
  ownerUserName: string;
  createdAt: string;
  updatedAt: string;
}

/** A note as an anonymous visitor sees it: no owner id, no moderation detail. */
export interface PublicNoteView {
  id: number;
  title: string;
  text: string;
  tags: TagView[];
  ownerUserName: string;
  publishedAt: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  password: string;
}

/** One field, resolved against both email and user name (see authentication spec). */
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface NoteWriteRequest {
  title: string;
  text: string;
  tags?: string[];
}

export interface RejectRequest {
  reason: string;
}

export const TAG_MAX_LENGTH = 32;
export const TITLE_MAX_LENGTH = 200;
export const PASSWORD_MIN_LENGTH = 8;
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

/** Error codes the client distinguishes. */
export const ERROR_CODES = {
  ACCOUNT_BANNED: 'ACCOUNT_BANNED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  USER_NAME_TAKEN: 'USER_NAME_TAKEN',
  INVALID_TAG: 'INVALID_TAG',
  ALREADY_REQUESTED: 'ALREADY_REQUESTED',
} as const;
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
