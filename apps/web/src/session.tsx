import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';
import type { UserProfile } from '@notes/shared';
import { api } from './api/client';

interface Session {
  user: UserProfile | undefined;
  isLoading: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<Session | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }): JSX.Element {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['session'],
    // A 401 here simply means nobody is signed in; it is not an error state.
    // Resolve to null, never undefined: React Query treats undefined as a
    // failed fetch and keeps the previous data, which would leave a signed-out
    // user looking signed in.
    queryFn: (): Promise<UserProfile | null> => api.me().catch(() => null),
    staleTime: 0,
  });

  const user = data ?? undefined;
  const value: Session = {
    user,
    isLoading,
    isAdmin: user?.roles.includes('ADMIN') ?? false,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession used outside SessionProvider');
  }
  return context;
}
