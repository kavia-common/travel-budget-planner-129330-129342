import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthAPI } from "../services/api";

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /**
   * AuthProvider manages user session state, including JWT token and user profile.
   * It exposes login, register, logout, and a ready flag.
   */
  const [token, setToken] = useState(() => localStorage.getItem("tb_token") || "");
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setReady(true);
        return;
      }
      try {
        const me = await AuthAPI.me(token);
        setUser(me);
      } catch {
        setToken("");
        localStorage.removeItem("tb_token");
      } finally {
        setReady(true);
      }
    }
    bootstrap();
  }, [token]);

  // PUBLIC_INTERFACE
  async function login(email, password) {
    const { token: tkn, user: usr } = await AuthAPI.login(email, password);
    setToken(tkn);
    setUser(usr);
    localStorage.setItem("tb_token", tkn);
    return usr;
  }

  // PUBLIC_INTERFACE
  async function register(payload) {
    const res = await AuthAPI.register(payload);
    return res;
  }

  // PUBLIC_INTERFACE
  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("tb_token");
  }

  const value = useMemo(() => ({ token, user, ready, login, register, logout }), [token, user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access authentication context */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
