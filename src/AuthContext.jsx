import { createContext, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTokens, saveTokens, logout, userIdFromToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  // Synchronous init: no "initializing" state, so protected routes never flash.
  const [access, setAccess] = useState(() => getTokens().access);

  const value = useMemo(
    () => ({
      isLoggedIn: Boolean(access),
      userId: access ? userIdFromToken(access) : null,
      signIn(tokens) {
        saveTokens(tokens);
        setAccess(tokens.access_token);
      },
      async signOut(all = false) {
        await logout(all); // never throws; clears local tokens
        setAccess(null);
        navigate("/login", { replace: true });
      },
    }),
    [access, navigate]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
