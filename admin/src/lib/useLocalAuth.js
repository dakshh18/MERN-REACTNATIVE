import { createContext, useContext } from "react";

// Local (email/password+OTP) auth context, hook, and a non-reactive token
// reader. Lives in a `.js` file (no components exported) so the Vite
// react-refresh rule doesn't complain about mixing components with hooks
// in the same module.

export const TOKEN_KEY = "admin.localAuth.token";
export const USER_KEY = "admin.localAuth.user";

export const LocalAuthContext = createContext(null);

export function useLocalAuth() {
  const ctx = useContext(LocalAuthContext);
  if (!ctx) {
    throw new Error("useLocalAuth must be used inside <LocalAuthProvider>");
  }
  return ctx;
}

// Read the raw token without subscribing to a re-render — used by axios
// interceptor where we just want the latest value.
export function getLocalAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}
