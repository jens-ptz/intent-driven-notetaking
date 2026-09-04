import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { NoteEditorPage } from './pages/NoteEditorPage';
import { NoteListPage } from './pages/NoteListPage';
import { PublicFeedPage } from './pages/PublicFeedPage';
import { PublicNotePage } from './pages/PublicNotePage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminNotesPage } from './pages/admin/AllNotesPage';
import { ModerationPage } from './pages/admin/ModerationPage';
import { AdminUsersPage } from './pages/admin/UsersPage';
import { useSession } from './session';

function RequireSession({ children }: { children: ReactNode }): JSX.Element {
  const { user, isLoading } = useSession();
  if (isLoading) {
    return <p>Loading…</p>;
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

/**
 * The admin area is refused outright rather than shown empty or broken, so a
 * regular user who guesses the URL gets a clear answer.
 */
function RequireAdmin({ children }: { children: ReactNode }): JSX.Element {
  const { user, isAdmin, isLoading } = useSession();
  if (isLoading) {
    return <p>Loading…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return (
      <p role="alert" data-testid="admin-forbidden">
        This area requires the admin role.
      </p>
    );
  }
  return <>{children}</>;
}

export function App(): JSX.Element {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<PublicFeedPage />} />
        <Route path="/public/notes/:id" element={<PublicNotePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/notes"
          element={
            <RequireSession>
              <NoteListPage />
            </RequireSession>
          }
        />
        <Route
          path="/notes/:id/edit"
          element={
            <RequireSession>
              <NoteEditorPage />
            </RequireSession>
          }
        />
        <Route
          path="/admin/moderation"
          element={
            <RequireAdmin>
              <ModerationPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAdmin>
              <AdminUsersPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/notes"
          element={
            <RequireAdmin>
              <AdminNotesPage />
            </RequireAdmin>
          }
        />
      </Routes>
    </Layout>
  );
}
