import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useSession } from '../session';

export function RegisterPage(): JSX.Element {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userName: '',
    password: '',
  });
  const [error, setError] = useState<string | undefined>();
  const { refresh } = useSession();
  const navigate = useNavigate();

  function field(name: keyof typeof form) {
    return {
      name,
      'data-testid': `register-${name}`,
      value: form[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        setForm((current) => ({ ...current, [name]: event.target.value })),
    };
  }

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(undefined);
    try {
      await api.register(form);
      // Registration does not sign you in, so do it here and land on the notes
      // list, which is what the specification describes.
      await api.login({ identifier: form.userName, password: form.password });
      await refresh();
      navigate('/notes');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Registration failed');
    }
  }

  return (
    <form onSubmit={submit} data-testid="register-form">
      <h1>Register</h1>
      <label>
        First name <input {...field('firstName')} />
      </label>
      <label>
        Last name <input {...field('lastName')} />
      </label>
      <label>
        Email <input {...field('email')} />
      </label>
      <label>
        User name <input {...field('userName')} />
      </label>
      <label>
        Password <input type="password" {...field('password')} />
      </label>
      <button type="submit" data-testid="register-submit">
        Register
      </button>
      {error ? (
        <p role="alert" data-testid="register-error">
          {error}
        </p>
      ) : null}
    </form>
  );
}
