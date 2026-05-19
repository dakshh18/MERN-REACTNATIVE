import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { LocalAuthContext, TOKEN_KEY, USER_KEY } from "./useLocalAuth.js";

// Local (email/password+OTP) auth provider for the admin SPA. Lives alongside
// Clerk — either one can sign you in. Token + minimal user snapshot are
// stored in localStorage; that's already the pattern Clerk uses internally
// for its own session token, so we're not introducing a new persistence
// layer.
//
// The context, hook, and token-reader helper live in useLocalAuth.js so
// this file can export only the provider component (Vite react-refresh
// rule).

const API_URL = import.meta.env.VITE_API_URL;

export function LocalAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Keep tabs in sync — if the user signs out in another tab, drop our copy.
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY) setToken(e.newValue);
      if (e.key === USER_KEY) {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((t, u) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const registerStart = useCallback(async (body) => {
    const res = await axios.post(`${API_URL}/auth/register/start`, body);
    return res.data;
  }, []);

  const loginStart = useCallback(async (body) => {
    const res = await axios.post(`${API_URL}/auth/login/start`, body);
    return res.data;
  }, []);

  const verifyOtp = useCallback(
    async ({ email, phoneNumber, otp, purpose }) => {
      const path =
        purpose === "register" ? "/auth/register/verify" : "/auth/login/verify";
      const res = await axios.post(`${API_URL}${path}`, {
        email,
        phoneNumber,
        otp,
      });
      persist(res.data.token, res.data.user);
      return res.data;
    },
    [persist]
  );

  const resendOtp = useCallback(async (body) => {
    const res = await axios.post(`${API_URL}/auth/otp/resend`, body);
    return res.data;
  }, []);

  const value = {
    token,
    user,
    isSignedIn: Boolean(token && user),
    registerStart,
    loginStart,
    verifyOtp,
    resendOtp,
    signOut,
  };

  return (
    <LocalAuthContext.Provider value={value}>{children}</LocalAuthContext.Provider>
  );
}
