import { WEB_BASE_URL } from '../config.js';

/**
 * Page objects hold every selector and route in the suite. Step definitions
 * read as intent and never touch a locator, so a UI change lands here only.
 *
 * Waiting is always on visible state, never on a timeout.
 */
class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(path) {
    await this.page.goto(`${WEB_BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
  }

  testId(id) {
    return this.page.getByTestId(id);
  }
}

export class PublicFeedPage extends BasePage {
  async open() {
    await this.goto('/');
    await this.testId('public-feed').waitFor();
  }

  async titles() {
    await this.testId('public-feed').waitFor();
    // Either an entry or the empty message is present before we read.
    await this.page
      .locator('[data-testid="feed-item"], [data-testid="feed-empty"]')
      .first()
      .waitFor();
    return this.testId('feed-item-title').allTextContents();
  }

  async openNote(title) {
    await this.testId('feed-item-title').filter({ hasText: title }).click();
  }
}

export class PublicNotePage extends BasePage {
  async openById(id) {
    await this.goto(`/public/notes/${id}`);
  }

  async title() {
    return this.testId('note-title').textContent();
  }

  headingText(level) {
    return this.page.locator(`[data-testid="markdown"] h${level}`).first().textContent();
  }

  italicText() {
    return this.page.locator('[data-testid="markdown"] em').first().textContent();
  }

  async markdownHtml() {
    return this.testId('markdown').innerHTML();
  }

  async tags() {
    return this.testId('note-tag').allTextContents();
  }
}

export class SignInPage extends BasePage {
  async open() {
    await this.goto('/login');
    await this.testId('login-form').waitFor();
  }

  async submit(identifier, password) {
    await this.testId('login-identifier').fill(identifier);
    await this.testId('login-password').fill(password);
    await this.testId('login-submit').click();
  }

  error() {
    return this.testId('login-error');
  }
}

export class RegisterPage extends BasePage {
  async open() {
    await this.goto('/register');
    await this.testId('register-form').waitFor();
  }

  async submit(details) {
    for (const [field, value] of Object.entries(details)) {
      await this.testId(`register-${field}`).fill(value);
    }
    await this.testId('register-submit').click();
  }
}

export class NoteListPage extends BasePage {
  async open() {
    await this.goto('/notes');
    await this.testId('note-list').waitFor();
  }

  row(title) {
    return this.page.locator(`[data-testid="note-row"][data-title="${title}"]`);
  }

  async titles() {
    await this.testId('note-list').waitFor();
    return this.testId('note-row-title').allTextContents();
  }

  async stateOf(title) {
    return this.row(title).getByTestId('note-row-state').textContent();
  }

  async delete(title) {
    await this.row(title).getByTestId('note-row-delete').click();
    await this.row(title).waitFor({ state: 'detached' });
  }

  async openEditor(title) {
    await this.row(title).getByTestId('note-row-title').click();
    await this.testId('note-editor').waitFor();
  }

  isOffered() {
    return this.testId('nav-my-notes').isVisible();
  }
}

export class NoteEditorPage extends BasePage {
  async openById(id) {
    await this.goto(`/notes/${id}/edit`);
    await this.testId('note-editor').waitFor();
  }

  async typeBody(text) {
    await this.testId('editor-text').fill(text);
  }

  async setTags(tags) {
    await this.testId('editor-tags').fill(tags.join(', '));
  }

  async save() {
    await this.testId('editor-save').click();
  }

  async requestPublication() {
    await this.testId('editor-request-publication').click();
    await this.testId('editor-state').filter({ hasText: 'pending' }).waitFor();
  }

  previewHeading(level) {
    return this.page.locator(`[data-testid="editor-preview"] h${level}`).first();
  }

  state() {
    return this.testId('editor-state');
  }

  rejectionReason() {
    return this.testId('rejection-reason');
  }

  async tags() {
    return this.testId('editor-tag').allTextContents();
  }
}

export class AdminPage extends BasePage {
  async openModeration() {
    await this.goto('/admin/moderation');
    await this.testId('moderation-queue').waitFor();
  }

  async openUsers() {
    await this.goto('/admin/users');
    await this.testId('admin-users').waitFor();
  }

  async approve(title) {
    const item = this.page.locator(`[data-testid="queue-item"][data-title="${title}"]`);
    await item.getByTestId('queue-approve').click();
    await item.waitFor({ state: 'detached' });
  }

  userRow(userName) {
    return this.page.locator(`[data-testid="user-row"][data-user-name="${userName}"]`);
  }

  async ban(userName) {
    const row = this.userRow(userName);
    await row.getByTestId('user-ban').click();
    await row.getByTestId('user-row-state').filter({ hasText: 'banned' }).waitFor();
  }

  async stateOf(userName) {
    return this.userRow(userName).getByTestId('user-row-state').textContent();
  }

  forbidden() {
    return this.testId('admin-forbidden');
  }

  navigation() {
    return this.testId('nav-admin');
  }
}

export function pagesFor(page) {
  return {
    feed: new PublicFeedPage(page),
    publicNote: new PublicNotePage(page),
    signIn: new SignInPage(page),
    register: new RegisterPage(page),
    noteList: new NoteListPage(page),
    editor: new NoteEditorPage(page),
    admin: new AdminPage(page),
  };
}
