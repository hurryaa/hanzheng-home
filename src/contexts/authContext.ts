import { createContext } from "react";

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  name: string;
  email: string;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  login: (params: { token: string; user: AuthUser }) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  token: null,
  user: null,
  permissions: [],
  hasPermission: () => false,
  isAdmin: () => false,
  login: () => {},
  logout: () => {},
});