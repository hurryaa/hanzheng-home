import { createContext } from "react";

export interface AuthUser {
  id: string;
  username: string;
  role: 'user' | 'staff' | 'admin';
  name: string;
  email?: string;
  storeId?: string; // 员工所属门店
  phone?: string;
  profileImageUrl?: string;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isUser: () => boolean;
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
  isStaff: () => false,
  isUser: () => false,
  login: () => {},
  logout: () => {},
});