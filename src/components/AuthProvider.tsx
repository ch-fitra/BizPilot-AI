import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, User, Workspace } from '../services/authService';

interface AuthContextType {
  user: User | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: any) => Promise<boolean>;
  logout: () => void;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createNewWorkspace: (payload: { businessName: string; businessType?: string; location?: string; currency?: string }) => Promise<Workspace | null>;
  reloadSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define global interceptor early at module level to guarantee it's bound before anything fires
let interceptorBound = false;
const bindInterceptor = () => {
  if (interceptorBound) return;
  interceptorBound = true;

  try {
    const originalFetch = window.fetch ? window.fetch.bind(window) : null;
    if (!originalFetch) return;

    const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const token = localStorage.getItem('bizpilot_token');
      const activeBizId = localStorage.getItem('bizpilot_active_business_id');

      let url = '';
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else if (input && typeof input === 'object' && 'url' in input) {
        url = (input as any).url || '';
      }

      // Intercept only relative API operations
      if (url.startsWith('/api/') || url.includes('/api/')) {
        const actualInit = init || {};
        const headers = new Headers(actualInit.headers || {});
        
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        if (activeBizId) {
          headers.set('x-business-id', activeBizId);
        }
        actualInit.headers = headers;
        return originalFetch(input, actualInit);
      }
      return originalFetch(input, init);
    };

    try {
      // Try direct setting, fallback to defineProperty if writable is false or defined as getter
      (window as any).fetch = customFetch;
    } catch {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
  } catch (err) {
    console.warn('BizPilot AI AuthProvider fetch interceptor hook could not override window.fetch:', err);
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize fetch interceptor on layout setup
  useEffect(() => {
    bindInterceptor();
    initializeSession();
  }, []);

  const initializeSession = async () => {
    const token = AuthService.getLocalToken();
    const activeBizId = AuthService.getLocalActiveBusinessId();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await AuthService.me();
      if (res.success && res.user) {
        setUser(res.user);
        setWorkspaces(res.workspaces || []);
        setIsAuthenticated(true);

        const loadedBizId = activeBizId || res.user.defaultBusinessId;
        const matchingWorkspace = (res.workspaces || []).find(w => w.id === loadedBizId);
        
        const activeWorkspace = matchingWorkspace || (res.workspaces && res.workspaces.length > 0 ? res.workspaces[0] : null);
        if (activeWorkspace) {
          setCurrentWorkspace(activeWorkspace);
          AuthService.setSession(token, activeWorkspace.id);
        }
      } else {
        // Token must be stale/expired
        AuthService.clearSession();
      }
    } catch (err) {
      console.warn('Authentication session check bypassed/failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const res = await AuthService.login({ email, password });
      if (res.success && res.token && res.user) {
        setUser(res.user);
        setWorkspaces(res.workspaces || []);
        setIsAuthenticated(true);

        const targetWorkspace = res.currentWorkspace || (res.workspaces && res.workspaces.length > 0 ? res.workspaces[0] : null);
        if (targetWorkspace) {
          setCurrentWorkspace(targetWorkspace);
          AuthService.setSession(res.token, targetWorkspace.id);
        } else {
          localStorage.setItem('bizpilot_token', res.token);
        }
        setLoading(false);
        return true;
      } else {
        setError(res.error || 'Autentikasi gagal. Mohon periksa kembali email dan kata sandi Anda.');
        setLoading(false);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Menerima respon tidak valid dari server.');
      setLoading(false);
      return false;
    }
  };

  const register = async (payload: any): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const res = await AuthService.register(payload);
      if (res.success && res.token && res.user) {
        setUser(res.user);
        setWorkspaces(res.workspaces || []);
        setIsAuthenticated(true);

        const targetWorkspace = res.currentWorkspace || (res.workspaces && res.workspaces.length > 0 ? res.workspaces[0] : null);
        if (targetWorkspace) {
          setCurrentWorkspace(targetWorkspace);
          AuthService.setSession(res.token, targetWorkspace.id);
        } else {
          localStorage.setItem('bizpilot_token', res.token);
        }
        setLoading(false);
        return true;
      } else {
        setError(res.error || 'Daftar gagal.');
        setLoading(false);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Gagal tersambung ke server.');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    AuthService.clearSession();
    setUser(null);
    setCurrentWorkspace(null);
    setWorkspaces([]);
    setIsAuthenticated(false);
    setError(null);
  };

  const switchWorkspace = async (workspaceId: string): Promise<void> => {
    const token = AuthService.getLocalToken();
    if (!token) return;

    // Check if within current loaded workspace list
    const found = workspaces.find(w => w.id === workspaceId);
    if (found) {
      setCurrentWorkspace(found);
      AuthService.setSession(token, workspaceId);

      // Save user profile state
      try {
        await AuthService.updateProfile({ defaultBusinessId: workspaceId });
      } catch (err) {
        console.error('Failed to persist switched work space profile:', err);
      }

      // Fast reload the entire frame so that new components re-mount cleanly and reload data!
      window.location.reload();
    }
  };

  const createNewWorkspace = async (payload: { businessName: string; businessType?: string; location?: string; currency?: string }): Promise<Workspace | null> => {
    try {
      setError(null);
      const res = await AuthService.createWorkspace(payload);
      if (res.success && res.workspace) {
        // Reload settings
        const currentToken = AuthService.getLocalToken();
        const updatedWorkspaces = [...workspaces, res.workspace];
        setWorkspaces(updatedWorkspaces);
        
        setCurrentWorkspace(res.workspace);
        if (currentToken) {
          AuthService.setSession(currentToken, res.workspace.id);
        }

        // Fast page refresh on successful workspace addition to allow dashboard reload
        window.location.reload();
        return res.workspace;
      } else {
        setError(res.error || 'Gagal menambahkan workspace bisnis baru.');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error connection failed.');
      return null;
    }
  };

  const reloadSession = async () => {
    await initializeSession();
  };

  return (
    <AuthContext.Provider value={{
      user,
      currentWorkspace,
      workspaces,
      isAuthenticated,
      loading,
      error,
      login,
      register,
      logout,
      switchWorkspace,
      createNewWorkspace,
      reloadSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be invoked within an AuthProvider container.');
  }
  return context;
};
