import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import { useSession } from '../session';

export function Layout({ children }: { children: ReactNode }): JSX.Element {
  const { user, isAdmin, refresh } = useSession();
  const navigate = useNavigate();

  async function signOut(): Promise<void> {
    await api.logout();
    // Leave the protected page before the session clears; otherwise the route
    // guard redirects to /login in the same tick and wins over the feed.
    navigate('/');
    await refresh();
  }

  return (
    <>
      <header>
        <nav>
          <Link to="/">Public feed</Link>
          {user ? (
            <>
              {' · '}
              <Link to="/notes" data-testid="nav-my-notes">
                My notes
              </Link>
              {isAdmin ? (
                // Every administrator screen is one click away; the area is not
                // reachable by typed URL alone (web-client).
                <span data-testid="nav-admin">
                  {' · '}
                  <Link to="/admin/moderation" data-testid="nav-admin-moderation">
                    Moderation
                  </Link>
                  {' · '}
                  <Link to="/admin/users" data-testid="nav-admin-users">
                    Accounts
                  </Link>
                  {' · '}
                  <Link to="/admin/notes" data-testid="nav-admin-notes">
                    All notes
                  </Link>
                </span>
              ) : null}
              {' · '}
              <button type="button" onClick={signOut} data-testid="sign-out">
                Sign out
              </button>
            </>
          ) : (
            <>
              {' · '}
              <Link to="/login" data-testid="nav-login">
                Sign in
              </Link>
              {' · '}
              <Link to="/register" data-testid="nav-register">
                Register
              </Link>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
}
