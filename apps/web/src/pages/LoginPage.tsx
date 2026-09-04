import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useSession } from '../session';

export function LoginPage(): JSX.Element {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const { refresh } = useSession();
  const navigate = useNavigate();

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(undefined);
    try {
      await api.login({ identifier, password });
      await refresh();
      navigate('/notes');
    } catch (caught) {
      // The identifier field keeps what was typed; only the password clears.
      setError(caught instanceof Error ? caught.message : 'Sign-in failed');
      setPassword('');
    }
  }

  return (
    <form onSubmit={submit} data-testid="login-form">
      <h1>Sign in</h1>
      <label>
        Email or user name
        <input
          name="identifier"
          data-testid="login-identifier"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          data-testid="login-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button type="submit" data-testid="login-submit">
        Sign in
      </button>
      {error ? (
        <p role="alert" data-testid="login-error">
          {error}
        </p>
      ) : null}
    </form>
  );
}
