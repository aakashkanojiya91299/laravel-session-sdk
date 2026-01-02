import { useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  name?: string;
}

interface Permissions {
  role: string;
  role_arr: string[];
  modules: any[];
  links: any[];
}

interface AuthState {
  user: User | null;
  role: string | null;
  permissions: Permissions | null;
  loading: boolean;
  authenticated: boolean;
  error: string | null;
}

export function useLaravelAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    permissions: null,
    loading: true,
    authenticated: false,
    error: null,
  });

  useEffect(() => {
    validateSession();

    // Re-validate every 5 minutes
    const interval = setInterval(validateSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const validateSession = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setState({
          user: data.user,
          role: data.role,
          permissions: data.permissions,
          loading: false,
          authenticated: true,
          error: null,
        });
      } else {
        const errorData = await response.json();
        setState({
          user: null,
          role: null,
          permissions: null,
          loading: false,
          authenticated: false,
          error: errorData.error,
        });
      }
    } catch (error: any) {
      setState({
        user: null,
        role: null,
        permissions: null,
        loading: false,
        authenticated: false,
        error: error.message,
      });
    }
  };

  const redirectToLogin = () => {
    const laravelUrl = process.env.NEXT_PUBLIC_LARAVEL_URL || 'http://localhost:8000';
    window.location.href = `${laravelUrl}/login`;
  };

  const logout = () => {
    const laravelUrl = process.env.NEXT_PUBLIC_LARAVEL_URL || 'http://localhost:8000';
    window.location.href = `${laravelUrl}/logout`;
  };

  return {
    ...state,
    refetch: validateSession,
    redirectToLogin,
    logout,
  };
}
