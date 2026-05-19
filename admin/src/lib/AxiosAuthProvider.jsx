import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import axiosInstance from "./axios";
import { getLocalAuthToken } from "./localAuth.jsx";

export function AxiosAuthProvider({ children }) {
  const { getToken } = useAuth();

  useEffect(() => {
    const id = axiosInstance.interceptors.request.use(async (config) => {
      // Prefer Clerk's session token. If we don't have one (i.e. the user
      // signed in via our local email/password+OTP flow), fall back to the
      // local JWT. Either is accepted by the backend's protectRoute middleware.
      let token = null;
      try {
        token = await getToken();
      } catch {
        token = null;
      }
      if (!token) token = getLocalAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => axiosInstance.interceptors.request.eject(id);
  }, [getToken]);

  return children;
}
